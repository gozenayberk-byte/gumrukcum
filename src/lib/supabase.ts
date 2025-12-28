import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string) => {
  // Check import.meta.env (Vite standard)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }

  // Check process.env (Standard Node/Webpack)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // ignore
  }

  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Production Check: Anahtarlar yoksa konsola hata bas, ancak uygulamayı fake moda alma.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase API keys are missing in .env file!');
}

// isMockMode değişkenini kaldırdık, her zaman gerçek bağlantı denenecek.
export const isMockMode = false;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);