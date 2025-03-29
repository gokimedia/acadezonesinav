'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database'; // database.types yerine database kullanıyoruz
import Image from 'next/image';

export default function Login() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error' | 'unknown'>('checking');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [bypassCheck, setBypassCheck] = useState(false);
  const router = useRouter();
  
  // TypeScript hatalarını önlemek için supabase client'ı basitçe oluşturuyoruz
  const supabase = createClientComponentClient<Database>();

  // Supabase bağlantısını kontrol et
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Önce ortam değişkenlerini kontrol et
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        setDebugInfo(`URL: ${supabaseUrl ? 'var' : 'yok'}, Key: ${supabaseKey ? 'var' : 'yok'}`);
        
        if (!supabaseUrl || !supabaseKey) {
          setConnectionStatus('error');
          setError('Supabase yapılandırması eksik. Lütfen .env.local dosyasını kontrol edin.');
          return;
        }

        // Auth testi - genellikle daha güvenilir
        console.log('Auth getSession testi yapılıyor...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Session yanıtı:', { sessionData, sessionError });
        
        if (sessionError) {
          console.error('Supabase session error:', sessionError);
          setDebugInfo(prev => `${prev} | Session hatası: ${JSON.stringify(sessionError)}`);
          setConnectionStatus('error');
          return;
        }

        // Veri testi
        console.log('Exams tablosuna select sorgusu yapılıyor...');
        const { data, error } = await supabase.from('exams').select('count()', { count: 'exact', head: true });
        console.log('Exams sorgu yanıtı:', { data, error });
        
        if (error) {
          console.error('Supabase veri hatası:', error);
          setDebugInfo(prev => `${prev} | Veri hatası: ${JSON.stringify(error)}`);
          setConnectionStatus('error');
        } else {
          console.log('Supabase connected successfully');
          setConnectionStatus('connected');
        }
      } catch (err) {
        console.error('Bağlantı hatası:', err);
        try {
          setDebugInfo(prev => `${prev} | Yakalanan hata: ${JSON.stringify(err)}`);
        } catch (e) {
          setDebugInfo(prev => `${prev} | Yakalandı: ${err}`);
        }
        setConnectionStatus('error');
      }
    };

    checkConnection();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const forceLogin = () => {
    setBypassCheck(true);
    setConnectionStatus('unknown');
    setError('Bağlantı durumu bilinmiyor, ancak giriş deneyebilirsiniz');
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Eğer bağlantı hatası varsa ve bypass yapılmadıysa
    if (connectionStatus === 'error' && !bypassCheck) {
      setError('Sunucu bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      console.log('Giriş yapılıyor...', credentials.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      console.log('Giriş sonucu:', { data, error });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email veya şifre hatalı');
        } else if (error.message.includes('Database error')) {
          throw new Error('Sunucu bağlantı hatası. Lütfen birazdan tekrar deneyin.');
        } else {
          throw error;
        }
      }

      // Başarılı giriş durumunda yönlendirme
      console.log('Giriş başarılı, yönlendiriliyor...');
      router.push('/panel');
      router.refresh();
      
    } catch (err: any) {
      console.error('Login error details:', err);
      
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.');
      } else {
        setError(err.message || 'Giriş yapılırken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <div className="mb-4">
            <Image 
              src="https://acadezone.s3.eu-central-1.amazonaws.com/email-assets/mavi.png" 
              alt="Acadezone Logo" 
              width={140} 
              height={40}
              className="h-12 w-auto"
              priority
            />
          </div>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-white">
            Yönetici Girişi
          </h2>
           
          {connectionStatus === 'checking' && (
            <div className="mt-2 text-yellow-500 text-sm">
              Sunucu bağlantısı kontrol ediliyor...
            </div>
          )}
           
          {connectionStatus === 'error' && (
            <div className="mt-2 text-red-500 text-sm">
              Sunucu bağlantısı kurulamadı
              <button 
                onClick={forceLogin} 
                className="ml-2 text-blue-400 hover:text-blue-300 underline"
              >
                Yine de dene
              </button>
            </div>
          )}
        </div>
         
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={credentials.email}
                onChange={handleChange}
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email adresi"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={credentials.password}
                onChange={handleChange}
                required
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Şifre"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || connectionStatus === 'checking'}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Giriş Yapılıyor...
                </span>
              ) : 'Giriş Yap'}
            </button>
          </div>
           
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Supabase URL yüklendi' : 'Supabase URL yüklenemedi'}
            </p>
            <p className="mt-1 text-gray-400">
              {debugInfo}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}