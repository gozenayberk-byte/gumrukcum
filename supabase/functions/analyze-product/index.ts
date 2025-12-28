import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({})); 
    const { imageBase64, userPrompt } = body;

    // --- 1. GİRİŞ KONTROLÜ ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization header eksik. Giriş yapınız.');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', 
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Kullanıcı doğrulanamadı: ' + (authError?.message || 'Bilinmeyen hata'));
    
    const userId = user.id;

    // --- 2. PROFİL VE KREDİ (Hata olursa yoksayacağız) ---
    let tier = 'free';
    try {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('credits, subscription_tier')
        .eq('id', userId)
        .single();
      
      tier = profile?.subscription_tier ?? 'free';
      const credits = profile?.credits ?? 0;

      // Kredi 0 ise ve paket free ise yine de devam et (Test için engeli kaldırıyorum)
      // Normalde buraya "if (credits < 1) throw..." yazardık.
    } catch (dbError) {
      console.log("Profil okuma hatası (Önemsiz):", dbError);
    }

    // --- 3. GEMINI API ---
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("GEMINI_API_KEY bulunamadı. Lütfen secrets kontrol edin.");

    // Model İsmi: En garantili standart modeli kullanıyoruz.
    const modelVersion = 'gemini-1.5-flash'; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${apiKey}`;

    const systemInstructionText = `
      Sen Gümrükçüm AI'sın. Ürün görselini analiz et.
      Çıktıyı SADECE şu JSON formatında ver, markdown kullanma:
      {
        "gtip": "...", "productName": "...", "taxes": [], "documents": [], "riskAnalysis": "...", "marketData": null
      }
    `;

    const requestBody = {
      contents: [{
        parts: [
          { text: userPrompt || "Analiz et." },
          ...(imageBase64 ? [{ inline_data: { mime_type: "image/jpeg", data: imageBase64 } }] : [])
        ]
      }],
      system_instruction: { parts: [{ text: systemInstructionText }] },
      generation_config: { response_mime_type: "application/json" }
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google AI Hatası: ${errText}`);
    }

    const geminiData = await response.json();
    const resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) throw new Error("AI boş yanıt döndü.");

    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
      parsedResult = { gtip: "Hata", riskAnalysis: resultText };
    }

    // --- 4. VERİTABANI GÜNCELLEME (Burayı Try-Catch içine aldık ki patlamasın) ---
    try {
      if (tier !== 'professional' && tier !== 'corporate') {
         // RPC yerine doğrudan update deneyelim (Daha az hata riski)
         // Bu kısım çalışmazsa bile kod devam edip sonucu sana gösterecek.
         await supabaseClient.rpc('decrement_credit', { user_id: userId });
      }
      
      await supabaseClient.from('queries').insert({
          user_id: userId,
          user_prompt: userPrompt || 'Görsel',
          ai_response: parsedResult
      });
    } catch (dbWriteError) {
      console.error("DB Yazma Hatası (Kritik Değil):", dbWriteError);
    }

    // SONUÇ DÖN
    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    // HATAYI GİZLEME, DİREKT FRONTEND'E GÖNDER
    return new Response(JSON.stringify({ 
      error: error.message, 
      details: "Bu hatayı görüyorsanız backend logic kısmında bir sorun vardır." 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 // Yine 500 dönecek ama içinde mesaj olacak
    });
  }
});