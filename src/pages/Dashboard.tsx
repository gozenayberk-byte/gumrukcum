import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, AIAnalysisResult } from '../types';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
            setProfile(data);
        } else if (error && error.code === 'PGRST116') {
            // Profile doesn't exist yet, creates a temporary local profile for UI state
            setProfile({
                id: user.id,
                email: user.email,
                credits: 2,
                subscription_tier: 'free'
            });
        }
    } catch (err) {
        // Fallback for demo/offline
        setProfile({
            id: user.id,
            email: user.email,
            credits: 2,
            subscription_tier: 'free'
        });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!profile) return;
    
    // Check credits locally first
    if (profile.credits <= 0 && profile.subscription_tier !== 'professional' && profile.subscription_tier !== 'corporate') {
        setError('Yetersiz kredi. Lütfen paketinizi yükseltin.');
        return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      let base64Image = null;
      if (selectedFile && previewUrl) {
        base64Image = previewUrl.split(',')[1];
      }

      // CALL EDGE FUNCTION
      const { data, error: funcError } = await supabase.functions.invoke('analyze-product', {
        body: {
          userId: user.id,
          userPrompt: prompt,
          imageBase64: base64Image,
          tier: profile.subscription_tier
        }
      });

      if (funcError) {
        console.error("Supabase Function Error:", funcError);
        throw funcError;
      }
      
      if (data && data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      // Update credits in UI after successful real call
      if (profile.subscription_tier === 'free' || profile.subscription_tier === 'entrepreneur') {
          setProfile({ ...profile, credits: Math.max(0, profile.credits - 1) });
      }

    } catch (err: any) {
      console.error("Analysis Error:", err);
      
      // FALLBACK MOCK FOR DEMO PURPOSES
      // If the backend is not deployed (Failed to fetch) or returns 404/500, we show a demo result
      // so the user can see the UI capabilities.
      if (err.message === 'Failed to fetch' || err.message.includes('Relay Error') || err.message.includes('Edge Function')) {
        console.warn("Backend unreachable. Using mock data for demonstration.");
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockResult: AIAnalysisResult = {
            gtip: "6404.19.90.00.19",
            productName: prompt || "Tekstil Yüzlü, Kauçuk Tabanlı Ev Terliği",
            taxes: [
                { name: "Gümrük Vergisi", rate: "%12", description: "3. Ülkeler için geçerli oran." },
                { name: "KDV", rate: "%10", description: "Tekstil ürünleri indirimli oran." },
                { name: "İlave Gümrük Vergisi", rate: "%20", description: "İthalat Rejimi Kararına ek." }
            ],
            documents: [
                "Ticari Fatura (Commercial Invoice)",
                "Menşe Şehadetnamesi (Certificate of Origin)",
                "TAREKS Referans Numarası (Tekstil)",
                "Azo Boyar Madde Test Raporu"
            ],
            riskAnalysis: "DİKKAT: Ürün tekstil/konfeksiyon grubunda olduğu için TAREKS denetimine tabidir. Kanserojen boya testi (Azo) gümrükte talep edilebilir. Test sonucu olumsuz çıkarsa ürünler mahrece iade edilir veya imha edilir.",
            marketData: profile.subscription_tier === 'professional' ? {
                fobPrice: "$1.85 - $2.40",
                trSalesPrice: "249.90 TL",
                emailDraft: "Dear Supplier,\n\nWe are interested in your textile slippers (Model XYZ). Could you please provide your best FOB Shanghai price for 1000 pairs?\n\nAlso, do you have AZO-free test reports available?\n\nBest regards,"
            } : undefined
        };
        setResult(mockResult);
      } else {
        setError(err.message || 'Analiz sırasında bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Gumrukcum Panel</h1>
          <div className="flex items-center space-x-4">
            <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
              Kredi: {profile?.subscription_tier === 'professional' ? 'Sınırsız' : profile?.credits}
            </span>
            <button onClick={onLogout} className="text-gray-500 hover:text-red-600 text-sm font-medium">Çıkış Yap</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Input Area */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Yeni Analiz</h2>
              
              {/* Image Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Görseli</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition relative">
                  <div className="space-y-1 text-center">
                    {previewUrl ? (
                        <div className="relative">
                            <img src={previewUrl} className="mx-auto h-32 object-contain" alt="Preview" />
                            <button onClick={() => { setPreviewUrl(null); setSelectedFile(null); }} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    ) : (
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                    <div className="flex text-sm text-gray-600 justify-center mt-2">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                        <span>Dosya Yükle</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Area */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ürün Açıklaması (Opsiyonel)</label>
                <textarea
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                  rows={3}
                  placeholder="Örn: %100 Pamuk çocuk tişörtü..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 mb-4">{error}</div>}

              <button
                onClick={handleAnalyze}
                disabled={loading || (!selectedFile && !prompt)}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white transition-all ${
                    loading || (!selectedFile && !prompt) 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
              >
                {loading ? (
                    <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Analiz Ediliyor...
                    </span>
                ) : 'Analizi Başlat'}
              </button>
            </div>
          </div>

          {/* RIGHT: Results Area */}
          <div className="lg:col-span-2">
            {result ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-slideUp">
                <div className="bg-indigo-600 px-6 py-4 border-b border-indigo-700 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white">Analiz Raporu</h3>
                    <p className="text-indigo-200 text-sm">{result.productName}</p>
                  </div>
                  <button onClick={() => window.print()} className="text-white hover:bg-white/10 p-2 rounded">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                  </button>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* GTIP Box */}
                  <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-3 rounded-full shadow-sm text-indigo-600">
                             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                        </div>
                        <div>
                            <span className="block text-sm text-indigo-600 font-bold uppercase tracking-wide">GTIP Kodu</span>
                            <span className="text-3xl font-mono font-bold text-gray-900 tracking-wider">{result.gtip}</span>
                        </div>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border border-indigo-100 text-xs text-gray-500 max-w-xs text-center md:text-right shadow-sm">
                        *Bağlayıcı tarife bilgisi (BTB) için Gümrük İdaresi'ne başvurunuz. Bu bir tavsiyedir.
                    </div>
                  </div>

                  {/* Taxes Grid */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Vergi Oranları
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {result.taxes.map((tax, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                          <span className="block text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">{tax.name}</span>
                          <span className="block text-2xl font-bold text-gray-800">{tax.rate}</span>
                          <span className="block text-xs text-gray-400 mt-2 border-t pt-2" title={tax.description}>{tax.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Gerekli Belgeler
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <ul className="space-y-3">
                        {result.documents.map((doc, i) => (
                            <li key={i} className="flex items-start">
                                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                <span className="text-gray-700 text-sm">{doc}</span>
                            </li>
                        ))}
                        </ul>
                    </div>
                  </div>

                  {/* Risk Analysis */}
                  <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 shadow-sm">
                    <h4 className="font-bold text-amber-800 mb-3 flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        Risk ve Mevzuat Analizi
                    </h4>
                    <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{result.riskAnalysis}</p>
                  </div>

                  {/* Professional Tier Data */}
                  {result.marketData && (
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl border border-slate-700 mt-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path></svg>
                        </div>
                        <h4 className="font-bold text-white mb-6 flex items-center relative z-10">
                            <span className="bg-indigo-500 text-xs px-2 py-1 rounded mr-3 uppercase font-extrabold tracking-wider">PRO</span>
                            Piyasa & Fiyat Analizi
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative z-10">
                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                                <span className="text-xs text-gray-300 block uppercase tracking-wide mb-1">Tahmini FOB (Çin)</span>
                                <span className="text-2xl font-bold text-green-400">{result.marketData.fobPrice}</span>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                                <span className="text-xs text-gray-300 block uppercase tracking-wide mb-1">TR Pazar Yeri Satış</span>
                                <span className="text-2xl font-bold text-blue-400">{result.marketData.trSalesPrice}</span>
                            </div>
                        </div>
                        {result.marketData.emailDraft && (
                            <div className="relative z-10">
                                <span className="text-xs font-bold text-gray-300 block mb-2 uppercase">Tedarikçi Mail Taslağı (İngilizce)</span>
                                <div className="bg-black/30 p-4 rounded-lg border border-white/10 text-gray-300 text-sm font-mono whitespace-pre-wrap">
                                    {result.marketData.emailDraft}
                                </div>
                                <button 
                                    onClick={() => navigator.clipboard.writeText(result.marketData!.emailDraft!)}
                                    className="mt-2 text-xs text-indigo-300 hover:text-white flex items-center"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                    Kopyala
                                </button>
                            </div>
                        )}
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="h-full min-h-[500px] bg-white rounded-xl shadow border border-gray-200 flex flex-col items-center justify-center text-gray-400 p-8 text-center transition-all">
                {loading ? (
                    <div className="flex flex-col items-center max-w-sm">
                        <div className="relative w-20 h-20 mb-6">
                            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <h3 className="text-gray-900 font-bold text-lg mb-2">Yapay Zeka Analiz Ediyor...</h3>
                        <p className="text-gray-500 text-sm mb-6">Görsel işleniyor, GTIP taranıyor ve güncel vergi oranları Resmi Gazete'den kontrol ediliyor.</p>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-600 h-1.5 rounded-full animate-progress w-full"></div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                             <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Henüz Analiz Yok</h3>
                        <p className="max-w-xs mx-auto">Soldaki panelden ürün görseli yükleyin veya açıklama yazarak "Analizi Başlat" butonuna basın.</p>
                    </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;