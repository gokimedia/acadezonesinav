import { createClient } from '@supabase/supabase-js'

// Service role client with full access
export const createServerClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createClient(
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
      global: {
        fetch: (url, options) => {
          return fetch(url, {
            ...options,
            signal: options?.signal || AbortSignal.timeout(30000) // 30 saniye timeout
          });
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 5
        }
      }
    }
  )
}

// PostgreSQL bağlantı havuzunu yönetmek için yardımcı fonksiyonlar - SADECE SERVER TARAFI KULLANIM İÇİN
let connectionPool: any = null;

// PostgreSQL havuzunu başlat (ihtiyaç halinde kullanılabilir)
export const getConnectionPool = async () => {
  if (!connectionPool) {
    try {
      // Dinamik import ile Node.js modülünü yükle
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
    } catch (error) {
      console.error('Error initializing connection pool:', error);
      return null;
    }
  }
  
  return connectionPool;
}

// Havuzu kapat (uygulama kapanırken çağrılabilir)
export const closeConnectionPool = async () => {
  if (connectionPool) {
    await connectionPool.end();
    connectionPool = null;
  }
} 