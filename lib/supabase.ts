// Client components için 'use client' direktifi
'use client';

import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Temel client-side Supabase istemcisi
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js'
      },
      // Daha uzun timeout değerleri
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          signal: options?.signal || AbortSignal.timeout(15000) // 15 saniye timeout
        });
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)

// NOT: Server-side işlemler için lib/server-supabase.ts dosyasını kullanın
