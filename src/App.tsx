import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
      } catch (err) {
        console.warn("Session check failed (likely missing env vars or network issue):", err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setShowAuthModal(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
        if (authView === 'login') {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } else {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            alert("Kayıt başarılı! Lütfen mailinizi onaylayın.");
            setAuthView('login');
        }
    } catch (err: any) {
        setAuthError(err.message);
    }
  };

  const openAuth = () => {
      setAuthError('');
      setShowAuthModal(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 font-medium">Yükleniyor...</div>;

  // 1. Session exists -> Dashboard
  if (session) {
      return <Dashboard user={session.user} onLogout={() => supabase.auth.signOut()} />;
  }

  // 2. No session -> Landing Page with optional Modal
  return (
      <>
        <LandingPage onAuth={openAuth} />
        
        {showAuthModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-slate-900/60 p-4 transition-all duration-300">
                <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative border border-slate-100 animate-slideUp">
                    <button 
                        onClick={() => setShowAuthModal(false)} 
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 rounded-full p-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">{authView === 'login' ? 'Tekrar Hoşgeldiniz' : 'Ücretsiz Hesap Oluştur'}</h2>
                        <p className="text-sm text-slate-500 mt-2">{authView === 'login' ? 'Hesabınıza giriş yapın ve analize devam edin.' : 'Kredi kartı gerekmez. 2 dakika sürer.'}</p>
                    </div>
                    
                    <form onSubmit={handleAuth} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Adresi</label>
                            <input 
                                type="email" 
                                required 
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                placeholder="ornek@sirket.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Şifre</label>
                            <input 
                                type="password" 
                                required 
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        
                        {authError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{authError}</div>}

                        <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/30 transition-all transform active:scale-[0.98]">
                            {authView === 'login' ? 'Giriş Yap' : 'Kayıt Ol ve Başla'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm border-t border-slate-100 pt-6">
                        <p className="text-slate-600">
                            {authView === 'login' ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
                            <button 
                                className="text-indigo-600 font-bold hover:underline"
                                onClick={() => setAuthView(authView === 'login' ? 'register' : 'login')}
                            >
                                {authView === 'login' ? 'Hemen Kayıt Ol' : 'Giriş Yap'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        )}
      </>
  );
};

export default App;