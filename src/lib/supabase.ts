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

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'placeholder-key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('Supabase keys are missing. App is running in placeholder mode. Real backend calls will fail.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);