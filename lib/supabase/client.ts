import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          signal: options?.signal || AbortSignal.timeout(30000) // 30 saniye timeout
        });
      }
    }
  });
};
