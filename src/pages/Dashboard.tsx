import React, { useState, useEffect, useRef } from 'react';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History State
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (activeTab === 'history') {
        fetchHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        if (error) {
           console.error("Profil çekilemedi:", error);
           return;
        }
        if (data) setProfile(data);
    } catch (err) {
        console.error("Profile fetch error:", err);
    }
  };

  const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
          const { data, error } = await supabase
            .from('queries')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          if (data) setHistory(data as QueryHistory[]);
      } catch (err: any) {
          console.error("Geçmiş yüklenemedi:", err.message);
      } finally {
          setHistoryLoading(false);
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
    if (!prompt && !selectedFile) {
        alert("Lütfen bir ürün tanımı girin veya görsel yükleyin.");
        return;
    }
    
    if (profile && profile.credits < 1 && profile.subscription_tier === 'free') {
        alert("Krediniz bitti. Lütfen paketinizi yükseltin.");
        return;
    }

    setLoading(true);
    setResult(null);

    // 1. Prepare Image
    let imageBase64 = null;
    if (selectedFile) {
        imageBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.readAsDataURL(selectedFile);
        });
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
            throw new Error("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.");
        }

        // REAL BACKEND CALL
        const { data, error } = await supabase.functions.invoke('analyze-product', {
            body: { 
                userPrompt: prompt,
                imageBase64: imageBase64,
                tier: profile?.subscription_tier 
            },
            headers: {
                Authorization: `Bearer ${session.access_token}` // Yetkilendirme header'ı
            }
        });

        if (error) {
             throw error;
        }

        setResult(data);

        // Başarılı olursa krediyi yerel state'te de düş (UI anlık güncellensin)
        if (profile && profile.subscription_tier !== 'professional' && profile.subscription_tier !== 'corporate') {
            setProfile({ ...profile, credits: Math.max(0, profile.credits - 1) });
        }
        
        // Refresh history silently
        fetchHistory();

    } catch (err: any) {
        console.error("Analiz Hatası:", err);
        // Kullanıcıya GERÇEK hatayı gösteriyoruz.
        let errorMessage = "Bir hata oluştu.";
        if (err instanceof Error) errorMessage = err.message;
        if (err && typeof err === 'object' && 'message' in err) errorMessage = (err as any).message;
        
        alert(`Analiz başarısız oldu: ${errorMessage}\n\nLütfen API Keylerinizi ve Edge Function durumunu kontrol edin.`);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-72 bg-slate-900 text-white flex flex-col shrink-0 h-auto md:min-h-screen">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
           <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">G</div>
           <span className="font-bold text-xl tracking-tight">Gumrukcum</span>
        </div>

        <div className="p-6 border-b border-slate-800 bg-slate-800/30">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-lg">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                    <p className="font-semibold text-sm truncate">{user.email}</p>
                    <p className="text-xs text-slate-400 capitalize">{profile?.subscription_tier} Plan</p>
                </div>
            </div>
            <div className="mt-4 bg-slate-900 rounded-lg p-3 border border-slate-700">
                <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-slate-400">Kalan Kredi</span>
                    <span className="font-bold text-indigo-400">{profile?.credits ?? '-'}</span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, ((profile?.credits || 0) / 5) * 100)}%` }}
                    ></div>
                </div>
            </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button 
                onClick={() => setActiveTab('analyze')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'analyze' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                <span className="font-medium">Yeni Analiz</span>
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="font-medium">Geçmiş Sorgular</span>
            </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
            <button onClick={onLogout} className="w-full flex items-center gap-2 text-slate-400 hover:text-red-400 px-4 py-2 transition-colors text-sm font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Çıkış Yap
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-5xl mx-auto">
            
            {/* ANALYZE TAB */}
            {activeTab === 'analyze' && (
                <div className="space-y-8 animate-fadeIn">
                    <header className="mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Gümrük Analizi Başlat</h1>
                        <p className="text-slate-500 mt-2">Ürün görselini yükleyin veya detaylı açıklama girin. Yapay zeka GTIP ve vergileri hesaplasın.</p>
                    </header>

                    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Input Area */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Ürün Açıklaması</label>
                                    <textarea 
                                        className="w-full h-32 p-4 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none text-slate-700"
                                        placeholder="Örn: Çin'den ithal edilecek, %100 pamuklu, baskılı erkek tişört. Yaklaşık 1000 adet..."
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Ürün Görseli (Opsiyonel)</label>
                                    <div className="relative group">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleFileChange}
                                            className="hidden" 
                                            id="file-upload"
                                        />
                                        <label 
                                            htmlFor="file-upload"
                                            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${previewUrl ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
                                        >
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="Preview" className="h-full w-full object-contain rounded-lg p-2" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400 group-hover:text-indigo-500">
                                                    <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                                    <p className="text-sm font-medium">Görsel Yüklemek İçin Tıkla</p>
                                                    <p className="text-xs mt-1 opacity-70">PNG, JPG (Max 5MB)</p>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleAnalyze}
                                    disabled={loading}
                                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 ${loading ? 'bg-indigo-400 cursor-not-allowed text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:-translate-y-1'}`}
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Analiz Ediliyor...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                            AI İle Analiz Et
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Result Area */}
                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 flex flex-col min-h-[500px]">
                                {result ? (
                                    <div className="space-y-6 animate-slideIn">
                                        <div className="border-b border-slate-200 pb-4">
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Tespit Edilen GTIP</p>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-2xl font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{result.gtip}</h2>
                                                <button onClick={() => navigator.clipboard.writeText(result.gtip)} className="text-slate-400 hover:text-indigo-600" title="Kopyala">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                                </button>
                                            </div>
                                            <p className="text-sm font-medium text-slate-800 mt-2">{result.productName}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {result.taxes.map((tax, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                                    <p className="text-xs text-slate-500">{tax.name}</p>
                                                    <p className="text-lg font-bold text-slate-900">{tax.rate}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                                <div>
                                                    <h4 className="text-sm font-bold text-amber-800 mb-1">Risk Analizi</h4>
                                                    <p className="text-sm text-amber-900 leading-relaxed">{result.riskAnalysis}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {result.marketData && (
                                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                                <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                                    Piyasa Analizi (Pro)
                                                </h4>
                                                <div className="text-sm space-y-1 text-indigo-800">
                                                    <p><span className="font-semibold">FOB Çin:</span> {result.marketData.fobPrice}</p>
                                                    <p><span className="font-semibold">TR Satış:</span> {result.marketData.trSalesPrice}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <h4 className="text-sm font-bold text-slate-700 mb-2">Gerekli Belgeler</h4>
                                            <ul className="space-y-2">
                                                {result.documents.map((doc, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                        <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                        {doc}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60">
                                        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        <p className="text-center font-medium">Analiz sonuçları burada görünecek.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'history' && (
                <div className="space-y-6 animate-fadeIn">
                    <header>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Geçmiş Analizlerim</h1>
                    </header>
                    
                    {historyLoading ? (
                        <div className="text-center py-10 text-slate-500">Yükleniyor...</div>
                    ) : history.length > 0 ? (
                        <div className="grid gap-4">
                            {history.map((item) => (
                                <div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                                    setResult(item.ai_response);
                                    setPrompt(item.user_prompt);
                                    setActiveTab('analyze');
                                }}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-900">{item.user_prompt.substring(0, 50)}...</h3>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                                            {new Date(item.created_at).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-600">
                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-medium">{item.ai_response.gtip}</span>
                                        <span className="truncate">{item.ai_response.productName}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
                            <p className="text-slate-400">Henüz hiç analiz yapmadınız.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;