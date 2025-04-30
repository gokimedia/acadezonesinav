import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient<Database>(
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
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)

// Service role client with full access
export const createServerClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 5
        }
      }
    }
  )
}

// NOT: Aşağıdaki kod Server-side only olarak işaretlendi
// PostgreSQL bağlantı havuzu kodları tarayıcıda çalışmaz

// Tarayıcı ortamında çalışmayı önlemek için kontrol eklendi
const isServer = typeof window === 'undefined';

// Bağlantı havuzunu yönetmek için yardımcı fonksiyonlar - SADECE SERVER TARAFI KULLANIM İÇİN
let connectionPool: any = null;

// PostgreSQL havuzunu başlat (ihtiyaç halinde kullanılabilir)
export const getConnectionPool = async () => {
  // Sadece sunucu tarafında çalışır
  if (!isServer) {
    console.warn('getConnectionPool yalnızca sunucu tarafında kullanılabilir');
    return null;
  }

  if (!connectionPool) {
    try {
      // Dinamik import ile Node.js modülünü yükle
      // Bu kod tarayıcıda çalışmayacak, sadece sunucu tarafında çalışacak
      if (isServer) {
        const { Pool } = await import('pg');
        
        connectionPool = new Pool({
          connectionString: process.env.DATABASE_URL || `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'postgres'}@${process.env.POSTGRES_HOST || 'localhost'}:5432/${process.env.POSTGRES_DB || 'postgres'}`,
          max: 50, // PERFORMANS İYİLEŞTİRME: Havuzdaki maksimum bağlantı sayısı artırıldı (20->50)
          idleTimeoutMillis: 30000, // Boşta kalan bağlantıların kapatılma süresi
          connectionTimeoutMillis: 5000, // Bağlantı zaman aşımı
          // PERFORMANS İYİLEŞTİRME: SQL sorguları için timeout değeri artırıldı
          statement_timeout: 10000, // 10 saniye (ms cinsinden)
        });
        
        // Bağlantı hatalarını yakala
        connectionPool.on('error', (err: Error) => {
          console.error('Unexpected error on idle client', err);
        });
      }
    } catch (error) {
      console.error('Error initializing connection pool:', error);
      return null;
    }
  }
  
  return connectionPool;
}

// Havuzu kapat (uygulama kapanırken çağrılabilir)
export const closeConnectionPool = async () => {
  // Sadece sunucu tarafında çalışır
  if (!isServer) {
    console.warn('closeConnectionPool yalnızca sunucu tarafında kullanılabilir');
    return;
  }

  if (connectionPool) {
    await connectionPool.end();
    connectionPool = null;
  }
}
