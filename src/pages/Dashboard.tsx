
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, AIAnalysisResult, QueryHistory } from '../types';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Analysis State
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'history') {
        fetchHistory();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
            setProfile(data);
        } else {
            // Fallback for immediate UI update after registration
            setProfile({
                id: user.id,
                email: user.email,
                credits: 2,
                subscription_tier: 'free'
            });
        }
    } catch (err) {
        console.error("Profile fetch error", err);
    }
  };

  const fetchHistory = async () => {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('queries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) {
          setHistory(data as QueryHistory[]);
      }
      setHistoryLoading(false);
  };

  // DEMO FUNCTION: Simulate Payment and Upgrade
  const handleUpgradeDemo = async () => {
      if (!profile) return;
      const confirm = window.confirm("Bu işlem demo amaçlıdır. Hesabınız 'Professional' pakete yükseltilsin mi?");
      if (confirm) {
          // Update local state immediately for UX
          setProfile({ ...profile, subscription_tier: 'professional', credits: 999 });
          
          // Update DB
          await supabase.from('profiles').update({ subscription_tier: 'professional', credits: 999 }).eq('id', user.id);
          
          // If we have a result, re-fetch it or unlock it visually (in real app, we might re-run AI with tools)
          alert("Paketiniz başarıyla yükseltildi! Piyasa analizleri artık görünür.");
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

      const { data, error: funcError } = await supabase.functions.invoke('analyze-product', {
        body: {
          userId: user.id,
          userPrompt: prompt,
          imageBase64: base64Image,
          tier: profile.subscription_tier
        }
      });

      if (funcError) throw funcError;
      if (data && data.error) throw new Error(data.error);

      setResult(data);
      
      // Update credits in UI
      if (profile.subscription_tier !== 'professional' && profile.subscription_tier !== 'corporate') {
          setProfile({ ...profile, credits: Math.max(0, profile.credits - 1) });
      }

    } catch (err: any) {
      console.error("Analysis Error:", err);
      // MOCK DATA FOR DEMO IF BACKEND FAILS
      if (err.message === 'Failed to fetch' || err.message.includes('Relay Error')) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockResult: AIAnalysisResult = {
            gtip: "6404.19.90.00.19",
            productName: prompt || "Demo Ürün Analizi",
            taxes: [
                { name: "Gümrük Vergisi", rate: "%12", description: "3. Ülkeler oranı" },
                { name: "KDV", rate: "%10", description: "İndirimli Oran" }
            ],
            documents: ["Ticari Fatura", "Menşe Şehadetnamesi"],
            riskAnalysis: "Demo modunda çalışıyor. Backend bağlantısını kontrol edin.",
            marketData: {
                fobPrice: "$2.50 - $3.00",
                trSalesPrice: "350 TL",
                emailDraft: "Dear Supplier, I am interested in your product..."
            }
        };
        setResult(mockResult);
        // Decrease credit locally for demo
        if (profile.subscription_tier !== 'professional' && profile.subscription_tier !== 'corporate') {
            setProfile({ ...profile, credits: Math.max(0, profile.credits - 1) });
        }
      } else {
        setError(err.message || 'Analiz sırasında bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (item: QueryHistory) => {
      setResult(item.ai_response);
      setActiveTab('analyze');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isPro = profile?.subscription_tier === 'professional' || profile?.subscription_tier === 'corporate';

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-30">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">G</div>
            <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Gumrukcum Panel</h1>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-6">
            <div className="flex flex-col items-end">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    {profile?.subscription_tier === 'free' ? 'Ücretsiz Paket' : 
                     profile?.subscription_tier === 'entrepreneur' ? 'Girişimci Paketi' : 
                     profile?.subscription_tier === 'professional' ? 'Profesyonel Paket' : 'Kurumsal'}
                </span>
                <span className={`text-sm font-bold ${profile?.credits === 0 && !isPro ? 'text-red-600' : 'text-indigo-600'}`}>
                    {isPro ? 'Sınırsız Kredi' : `${profile?.credits} Kredi`}
                </span>
            </div>
            <button onClick={onLogout} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mt-6 px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('analyze')}
                className={`${
                  activeTab === 'analyze'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Yeni Analiz
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`${
                  activeTab === 'history'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Geçmiş Sorgular
              </button>
            </nav>
          </div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* VIEW: ANALYZE */}
        {activeTab === 'analyze' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Area */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Ürün Yükle
                </h2>
                
                <div className="mb-4">
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition relative group">
                    <div className="space-y-1 text-center">
                        {previewUrl ? (
                            <div className="relative">
                                <img src={previewUrl} className="mx-auto h-40 object-contain rounded-md" alt="Preview" />
                                <button onClick={() => { setPreviewUrl(null); setSelectedFile(null); }} className="absolute -top-3 -right-3 bg-red-100 text-red-600 rounded-full p-1.5 shadow-sm hover:bg-red-200 transition">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        ) : (
                            <>
                                <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-indigo-400 transition" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <div className="text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                                    <span>Görsel Yükle</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                                </label>
                                </div>
                            </>
                        )}
                    </div>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notlar (Opsiyonel)</label>
                    <textarea
                    className="w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-lg p-3"
                    rows={3}
                    placeholder="Ürün materyali, kullanım alanı vb."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>

                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {error}
                </div>}

                <button
                    onClick={handleAnalyze}
                    disabled={loading || (!selectedFile && !prompt)}
                    className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white transition-all ${
                        loading || (!selectedFile && !prompt) 
                        ? 'bg-slate-300 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30 shadow-lg transform active:scale-95'
                    }`}
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Analiz Yapılıyor...
                        </>
                    ) : 'Analizi Başlat'}
                </button>
                </div>
            </div>

            {/* Results Area */}
            <div className="lg:col-span-2">
                {result ? (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn">
                    <div className="bg-slate-900 px-6 py-5 border-b border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-500 p-1.5 rounded-full">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white leading-tight">Analiz Tamamlandı</h3>
                                <p className="text-slate-400 text-xs">{new Date().toLocaleDateString('tr-TR')} • {result.productName}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-8">
                    {/* GTIP Section */}
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 bg-indigo-50 rounded-xl p-5 border border-indigo-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-full -mr-12 -mt-12 opacity-50"></div>
                            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider block mb-1">Tespit Edilen GTIP</span>
                            <div className="text-3xl font-mono font-bold text-slate-900 tracking-wider mb-2">{result.gtip}</div>
                            <p className="text-xs text-indigo-800 bg-indigo-200/50 inline-block px-2 py-1 rounded">
                                Gümrük Tarife İstatistik Pozisyonu
                            </p>
                        </div>
                        <div className="flex-1 bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                            <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Risk Analizi</h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {result.riskAnalysis}
                            </p>
                        </div>
                    </div>

                    {/* Taxes */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                            Vergi Hesaplaması
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {result.taxes.map((tax, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="text-xs text-slate-500 font-semibold uppercase mb-1">{tax.name}</div>
                                <div className="text-2xl font-bold text-slate-800">{tax.rate}</div>
                                <div className="text-xs text-slate-400 mt-2 line-clamp-2">{tax.description}</div>
                            </div>
                        ))}
                        </div>
                    </div>

                    {/* Market Analysis - BLURRED IF NOT PRO */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 mt-8">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 flex items-center justify-between">
                            <h4 className="font-bold text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                Piyasa ve Fiyat Analizi
                            </h4>
                            {!isPro && <span className="text-xs bg-slate-700 text-white px-2 py-1 rounded border border-slate-600">PRO Özellik</span>}
                        </div>

                        {isPro && result.marketData ? (
                            // UNLOCKED CONTENT
                            <div className="p-6 bg-slate-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                                        <span className="text-xs text-slate-500 uppercase font-bold">Çin FOB Fiyatı</span>
                                        <div className="text-2xl font-bold text-green-600 mt-1">{result.marketData.fobPrice}</div>
                                        <p className="text-xs text-slate-400 mt-1">Alibaba/Made-in-China ortalaması</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                                        <span className="text-xs text-slate-500 uppercase font-bold">TR Pazar Yeri Satış</span>
                                        <div className="text-2xl font-bold text-blue-600 mt-1">{result.marketData.trSalesPrice}</div>
                                        <p className="text-xs text-slate-400 mt-1">Trendyol/Hepsiburada ortalaması</p>
                                    </div>
                                </div>
                                {result.marketData.emailDraft && (
                                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                                        <span className="text-xs font-bold text-slate-500 block mb-2 uppercase">Hazır Tedarikçi Maili (İngilizce)</span>
                                        <pre className="text-xs sm:text-sm text-slate-700 font-mono whitespace-pre-wrap bg-slate-50 p-3 rounded border border-slate-100">
                                            {result.marketData.emailDraft}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // LOCKED CONTENT (BLURRED)
                            <div className="relative h-64 bg-slate-50 overflow-hidden">
                                {/* Blurred Fake Content Layer */}
                                <div className="absolute inset-0 p-6 filter blur-[6px] opacity-60 pointer-events-none select-none">
                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div className="bg-white p-4 rounded h-24 w-full"></div>
                                        <div className="bg-white p-4 rounded h-24 w-full"></div>
                                    </div>
                                    <div className="bg-white p-4 rounded h-32 w-full"></div>
                                </div>
                                
                                {/* Overlay Lock UI */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900/5">
                                    <div className="bg-white p-6 rounded-2xl shadow-xl text-center max-w-sm border border-slate-200">
                                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-2">Fiyat Analizini Aç</h3>
                                        <p className="text-sm text-slate-500 mb-6">
                                            Ürünün Çin FOB fiyatını, Türkiye satış fiyatını ve potansiyel kar marjını görmek için paketinizi yükseltin.
                                        </p>
                                        <button 
                                            onClick={handleUpgradeDemo}
                                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-500/30 transition-all transform hover:-translate-y-1"
                                        >
                                            Profesyonel Pakete Geç
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    </div>
                </div>
                ) : (
                <div className="h-full min-h-[500px] bg-white rounded-xl shadow border border-gray-200 flex flex-col items-center justify-center text-gray-400 p-8 text-center transition-all">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100">
                        <svg className="w-12 h-12 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Analize Hazır</h3>
                    <p className="max-w-xs mx-auto text-gray-500">Ürün görselini yükleyin ve yapay zekanın mevzuat taramasını başlatın.</p>
                </div>
                )}
            </div>
            </div>
        )}

        {/* VIEW: HISTORY */}
        {activeTab === 'history' && (
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-900">Geçmiş Analizler</h3>
                </div>
                
                {historyLoading ? (
                    <div className="p-12 text-center text-gray-500">Yükleniyor...</div>
                ) : history.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Henüz hiç analiz yapmadınız.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {history.map((item) => (
                            <div key={item.id} className="p-6 hover:bg-gray-50 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h4 className="font-bold text-gray-900">{item.ai_response.productName || 'İsimsiz Analiz'}</h4>
                                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-mono">{item.ai_response.gtip}</span>
                                        <span>• {new Date(item.created_at).toLocaleDateString('tr-TR')} {new Date(item.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2 line-clamp-1">{item.user_prompt}</p>
                                </div>
                                <button 
                                    onClick={() => loadHistoryItem(item)}
                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
                                >
                                    Raporu Gör
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

      </main>
    </div>
  );
};

export default Dashboard;
