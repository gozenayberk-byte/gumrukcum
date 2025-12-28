import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenAI, Type } from "https://esm.sh/@google/genai";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64, userPrompt, tier } = await req.json();
    
    // SECURITY FIX: Get User ID from the Authorization Header (JWT), NOT from the body.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the user token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = user.id;

    // 1. Check Credits from the verified user ID
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits, subscription_tier')
      .eq('id', userId)
      .single();

    if (!profile) {
       throw new Error("Profil bulunamadı.");
    }

    // Double check tier consistency (Client sends tier, but we should trust DB)
    const activeTier = profile.subscription_tier;

    if (profile.credits < 1 && activeTier !== 'professional' && activeTier !== 'corporate') {
      throw new Error("Yetersiz kredi. Lütfen paket yükseltin.");
    }

    // 2. Initialize Gemini
    const ai = new GoogleGenAI({ apiKey: Deno.env.get('API_KEY') });
    
    // 3. Construct System Prompt based on Persona
    let systemInstruction = `
      Sen Türkiye Cumhuriyeti gümrük mevzuatına, Resmi Gazete'nin güncel verilerine hakim, çok titiz ve disiplinli bir Gümrük Müşavirisin. 
      Görevin: Kullanıcının sağladığı ürün görselini ve açıklamasını analiz ederek; 
      1. Doğru GTIP kodunu (12 haneli) tespit etmek.
      2. Güncel vergi oranlarını (KDV, Gümrük Vergisi, ÖTV, KKDF vb.) listelemek.
      3. Gümrükte kesinlikle istenecek belgeleri (TSE, CE, Tareks, MSDS vb.) belirtmek.
      4. İthalat risk analizini yapmak (Yasaklı mı? İzne tabi mi?).
      
      Asla yasal olmayan tavsiye (rüşvet, kaçakçılık vb.) vermezsin. Riskleri "DİKKAT" başlığıyla net bir dille belirtirsin.
      
      Çıktıyı saf JSON formatında ver.
    `;

    // 4. Configure Tools based on Tier
    const tools = [];
    let extraPrompt = "";

    if (activeTier === 'professional' || activeTier === 'corporate') {
      tools.push({ googleSearch: {} });
      extraPrompt = `
        AYRICA: Google Search aracını kullanarak bu ürün için güncel piyasa araştırması yap.
        1. Alibaba ve Made-in-China üzerindeki ortalama FOB (Çin çıkış) fiyatını bul.
        2. Türkiye'deki pazar yerlerinde (Trendyol, Hepsiburada) benzer ürünlerin satış fiyatını bul.
        3. Bu verilere dayanarak tahmini kar marjı yorumu ekle.
        4. Tedarikçiye gönderilmek üzere profesyonel bir İngilizce fiyat teklifi (RFQ) mail taslağı hazırla.
      `;
    }

    // 5. Define Output Schema
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        gtip: { type: Type.STRING, description: "12 haneli GTIP kodu" },
        productName: { type: Type.STRING, description: "Gümrük literatürüne uygun ürün tanımı" },
        taxes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              rate: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          }
        },
        documents: { type: Type.ARRAY, items: { type: Type.STRING } },
        riskAnalysis: { type: Type.STRING, description: "Risk ve uyarılar" },
        marketData: {
            type: Type.OBJECT,
            properties: {
                fobPrice: { type: Type.STRING, description: "Ortalama FOB Fiyat" },
                trSalesPrice: { type: Type.STRING, description: "TR Satış Fiyatı" },
                emailDraft: { type: Type.STRING, description: "Tedarikçi Mail Taslağı" }
            },
            nullable: true
        }
      },
      required: ["gtip", "productName", "taxes", "documents", "riskAnalysis"]
    };

    // 6. Call Gemini
    // Using gemini-3-pro-preview for complex reasoning and search capabilities
    const modelName = (activeTier === 'professional') ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    const parts = [];
    if (imageBase64) {
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64
            }
        });
    }
    parts.push({ text: `${userPrompt || "Bu ürünü analiz et."} ${extraPrompt}` });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction,
        tools: tools.length > 0 ? tools : undefined,
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const resultJson = JSON.parse(response.text);

    // 7. Deduct Credit & Log Query
    if (activeTier !== 'professional' && activeTier !== 'corporate') {
        // Decrement credit safely
        await supabaseClient.from('profiles').update({ credits: profile.credits - 1 }).eq('id', userId);
    }

    await supabaseClient.from('queries').insert({
        user_id: userId,
        user_prompt: userPrompt,
        ai_response: resultJson
    });

    return new Response(JSON.stringify(resultJson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});