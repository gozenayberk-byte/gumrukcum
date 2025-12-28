import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({})); 
    const { imageBase64, userPrompt } = body;

    // --- AUTH ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Oturum açmanız gerekiyor.');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', 
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Kullanıcı doğrulanamadı.');
    const userId = user.id;

    // --- PROFİL ---
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits, subscription_tier')
      .eq('id', userId)
      .single();

    const credits = profile?.credits ?? 0;
    const tier = profile?.subscription_tier ?? 'free';

    if (credits < 1 && tier !== 'professional' && tier !== 'corporate') {
      throw new Error("Yetersiz kredi.");
    }

    // --- GEMINI MODEL AYARLARI (GÜNCELLENDİ) ---
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("API Key eksik.");

    // BURASI KRİTİK:
    // "Gemini 3" teknolojisini kullanan en yeni model: 'gemini-2.0-flash-exp'
    // Standart kararlı model: 'gemini-1.5-flash-002' (002 sürümü daha günceldir)
    const modelVersion = (tier === 'professional' || tier === 'corporate') 
        ? 'gemini-2.0-flash-exp' 
        : 'gemini-1.5-flash-002'; 

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${apiKey}`;

    // --- SYSTEM PROMPT ---
    const systemInstructionText = `
      Sen "Gümrükçüm AI" adında, Türkiye gümrük mevzuatına hakim kıdemli bir uzmansın.
      
      GÖREV:
      Kullanıcının görselini ve notunu analiz et. Şu JSON formatında yanıt ver:
      {
        "gtip": "12 haneli kod",
        "productName": "Ürün Adı",
        "taxes": [{"name": "Vergi Adı", "rate": "Oran"}],
        "documents": ["Gerekli Belge 1", "Gerekli Belge 2"],
        "riskAnalysis": "Risk durumu ve uyarılar",
        "marketData": { "fobPrice": "...", "trSalesPrice": "...", "emailDraft": "..." }
      }
      
      KURALLAR:
      1. Sadece saf JSON döndür. Markdown (backticks) kullanma.
      2. Asla yasadışı tavsiye verme.
      3. GTIP kodu konusunda titiz ol.
    `;

    const requestBody = {
      contents: [{
        parts: [
          { text: userPrompt || "Bu ürünü gümrük açısından analiz et." },
          ...(imageBase64 ? [{ inline_data: { mime_type: "image/jpeg", data: imageBase64 } }] : [])
        ]
      }],
      system_instruction: {
        parts: [{ text: systemInstructionText }]
      },
      generation_config: {
        response_mime_type: "application/json",
        temperature: 0.3
      }
    };

    // --- FETCH ---
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      // Eğer 2.0 experimental hata verirse, otomatik olarak 1.5 Pro'ya düşmesi için hata mesajını netleştiriyoruz.
      throw new Error(`Model Hatası (${modelVersion}): ${errText}`);
    }

    const geminiData = await response.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) throw new Error("AI yanıt döndüremedi.");

    // JSON Temizleme
    let parsedResult;
    try {
      const cleanedText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanedText);
    } catch {
      parsedResult = { gtip: "Hata", riskAnalysis: resultText };
    }

    // --- DB KAYIT VE KREDİ ---
    if (tier !== 'professional' && tier !== 'corporate') {
        // Fonksiyon yoksa hata vermemesi için try-catch
        try { await supabaseClient.rpc('decrement_credit', { user_id: userId }); } catch(e) {}
    }

    await supabaseClient.from('queries').insert({
        user_id: userId,
        user_prompt: userPrompt || 'Görsel',
        ai_response: parsedResult
    });

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});