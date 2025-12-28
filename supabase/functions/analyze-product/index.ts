import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS Ayarları (Önceki hatayı almamak için sabit)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Preflight (OPTIONS) Kontrolü
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({})); 
    const { imageBase64, userPrompt } = body;

    // --- KİMLİK DOĞRULAMA (AUTH) ---
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

    // --- PROFİL VE KREDİ KONTROLÜ ---
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('credits, subscription_tier')
      .eq('id', userId)
      .single();

    const credits = profile?.credits ?? 0;
    const tier = profile?.subscription_tier ?? 'free';

    // Kredi Kontrolü
    if (credits < 1 && tier !== 'professional' && tier !== 'corporate') {
      throw new Error("Yetersiz kredi. Lütfen paket yükseltin.");
    }

    // --- GEMINI 3 / NEXT-GEN AYARLARI ---
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("API Key sunucuda eksik.");

    // MODEL SEÇİMİ:
    // 'gemini-2.0-flash-exp': Şu an Google'ın en yeni, Gemini 3 teknolojisine en yakın, multimodal ve çok hızlı modelidir.
    // Profesyonel paketler için bu en güçlü modeli, ücretsizler için daha hafif versiyonu kullanıyoruz.
    const modelVersion = (tier === 'professional' || tier === 'corporate') 
        ? 'gemini-2.0-flash-exp' 
        : 'gemini-1.5-flash'; 

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${apiKey}`;

    // --- SYSTEM PROMPT (Gümrük Müşaviri Personası) ---
    const systemInstructionText = `
      Sen Türkiye Cumhuriyeti Gümrük Mevzuatı'na, Resmi Gazete'ye ve uluslararası ticaret kurallarına %100 hakim,
      kıdemli bir Gümrük Müşavirisiniz. Adın "Gümrükçüm AI".

      GÖREVİN:
      Kullanıcının yüklediği ürün görselini ve açıklamasını analiz ederek, ithalat sürecinde hayati olan bilgileri vermektir.
      
      ANALİZ KURALLARI:
      1. GTIP Kodu: Ürünü en iyi tanımlayan 12 haneli GTIP kodunu bul.
      2. Vergiler: Güncel KDV, Gümrük Vergisi, ÖTV, İlave Gümrük Vergisi oranlarını tahmin et.
      3. Belgeler: Tareks, CE, TSE, MSDS, Garanti Belgesi gibi zorunlu evrakları listele.
      4. Riskler: Yasaklı mı? İzne mi tabi? Kırmızı hat riski var mı? Bunları "DİKKAT" başlığıyla yaz.
      
      EĞER KULLANICI 'PROFESSIONAL' veya 'CORPORATE' İSE EKSTRA GÖREV:
      5. Fiyat Analizi: Çin (Alibaba) FOB fiyatını ve Türkiye Pazar Yeri (Trendyol/Hepsiburada) satış fiyatını tahmin et.
      6. Mail Taslağı: Tedarikçiden fiyat istemek için profesyonel İngilizce mail taslağı oluştur.

      ÇIKTI FORMATI (KESİNLİKLE JSON):
      Yanıtın sadece ve sadece aşağıdaki JSON formatında olmalıdır. Markdown veya başka metin ekleme.
      {
        "gtip": "xxxx.xx.xx.xx.xx",
        "productName": "Resmi Tanım",
        "taxes": [{"name": "KDV", "rate": "%20"}, {"name": "Gümrük V.", "rate": "%..."}],
        "documents": ["Belge 1", "Belge 2"],
        "riskAnalysis": "Detaylı risk analizi metni...",
        "marketData": {
            "fobPrice": "$10 - $15 (Tahmini)",
            "trSalesPrice": "500 TL - 750 TL (Tahmini)",
            "emailDraft": "Dear Supplier..."
        }
      }
    `;

    // Prompt Birleştirme
    const finalPrompt = userPrompt 
        ? `Kullanıcı Notu: ${userPrompt}. Bu nota ve görsele göre analiz yap.` 
        : "Bu görseldeki ürünü gümrük açısından detaylı analiz et.";

    // İstek Gövdesi
    const requestBody = {
      contents: [{
        parts: [
          { text: finalPrompt },
          ...(imageBase64 ? [{ inline_data: { mime_type: "image/jpeg", data: imageBase64 } }] : [])
        ]
      }],
      system_instruction: {
        parts: [{ text: systemInstructionText }]
      },
      generation_config: {
        response_mime_type: "application/json",
        temperature: 0.3 // Daha tutarlı ve ciddi yanıtlar için düşük sıcaklık
      }
    };

    // --- GOOGLE API İSTEĞİ ---
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI Hatası (${modelVersion}): ${errText}`);
    }

    const geminiData = await response.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) throw new Error("AI yanıt oluşturamadı.");

    // JSON Parse İşlemi (Hata toleranslı)
    let parsedResult;
    try {
      // Bazen model markdown ```json ... ``` içinde dönebilir, temizleyelim
      const cleanedText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleanedText);
    } catch (e) {
      console.error("JSON Parse Hatası:", e);
      // Fallback: Eğer JSON bozuksa, metni risk analizine göm
      parsedResult = {
        gtip: "Belirlenemedi",
        productName: "Analiz Hatası",
        taxes: [],
        documents: [],
        riskAnalysis: resultText,
        marketData: null
      };
    }

    // --- SONUÇLARI VERİTABANINA YAZ ---
    
    // Kredi Düşme (Ücretsiz Paketler İçin)
    if (tier !== 'professional' && tier !== 'corporate') {
        await supabaseClient.rpc('decrement_credit', { user_id: userId }).catch(() => {
             // RPC yoksa manuel düşmeyi dene, hata verirse yoksay (Kullanıcı mağdur olmasın)
             console.log("Kredi düşme RPC'si eksik olabilir.");
        });
    }

    // Geçmişe Kaydet
    await supabaseClient.from('queries').insert({
        user_id: userId,
        user_prompt: userPrompt || 'Görsel Analizi',
        ai_response: parsedResult
    });

    // Başarılı Dönüş
    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error("Genel Hata:", error);
    return new Response(JSON.stringify({ error: error.message || "Bilinmeyen sunucu hatası" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});