import { createClient } from '@supabase/supabase-js';

// Vite ve diğer bundler'ların build sırasında değişkenleri replace edebilmesi için
// dinamik erişim ([key]) yerine doğrudan erişim (.VITE_...) kullanılmalıdır.
const getSupabaseUrl = () => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) {
    // @ts-ignore
    return import.meta.env.VITE_SUPABASE_URL;
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL) {
    // @ts-ignore
    return process.env.VITE_SUPABASE_URL;
  }
  return '';
};

const getSupabaseKey = () => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY) {
    // @ts-ignore
    return process.env.VITE_SUPABASE_ANON_KEY;
  }
  return '';
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseKey();

// Production Check: Anahtarlar yoksa konsola hata bas.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase API keys are missing! Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

// isMockMode değişkenini kaldırdık, her zaman gerçek bağlantı denenecek.
export const isMockMode = false;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);