import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// PERFORMANS İYİLEŞTİRME: Önbellek için basit in-memory yapı
// Son 10 dakika içinde kontrol edilmiş token'ları önbellekte saklar
interface CacheItem {
  value: any;
  timestamp: number;
}

// Önbellek sınıfı (in-memory, sunucu yeniden başlatıldığında sıfırlanır)
class RequestCache {
  private cache: Map<string, CacheItem> = new Map();
  private readonly MAX_AGE = 10 * 60 * 1000; // 10 dakika
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Süre geçmişse önbellekten sil
    if (Date.now() - item.timestamp > this.MAX_AGE) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  set(key: string, value: any): void {
    // Önbellek boyutunu kontrol et, 1000'den fazla ise en eski 100 öğeyi sil
    if (this.cache.size > 1000) {
      const entries = Array.from(this.cache.entries());
      const oldest = entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, 100);
      
      oldest.forEach(([key]) => this.cache.delete(key));
    }
    
    this.cache.set(key, { value, timestamp: Date.now() });
  }
}

// Singleton önbellek örneği
const cache = new RequestCache();

// PERFORMANS İYİLEŞTİRME: İstek sayacı
let totalRequests = 0;
let dbRequests = 0;
let cachedRequests = 0;

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // İstek sayısını artır
  totalRequests++;
  
  // PERFORMANS İYİLEŞTİRME: Statik kaynaklara erişimi doğrudan izin ver, DB kullanma
  const path = req.nextUrl.pathname;
  
  // Statik dosyalar için doğrudan erişime izin ver
  if (
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.startsWith('/images') ||
    path.startsWith('/favicon') ||
    path.endsWith('.ico') ||
    path.endsWith('.svg') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.jpeg') ||
    path.endsWith('.css') ||
    path.endsWith('.js')
  ) {
    return res;
  }

  // PERFORMANS İYİLEŞTİRME: API rotaları için middleware'deki gereksiz doğrulamaları geç
  if (path.startsWith('/api')) {
    // API rotalarının kendi doğrulamaları var, burada gereksiz doğrulama yapmayı atla
    return res;
  }

  // Sınav sayfalarına erişim kontrolü
  if (path.startsWith('/sinav/')) {
    // Sınav sayfasında öğrenci kodu olup olmadığını kontrol et
    const studentCode = req.nextUrl.searchParams.get('code');
    
    // Öğrenci kodu yoksa giriş sayfasına yönlendir
    if (!studentCode) {
      return NextResponse.redirect(new URL('/sinav-giris', req.url));
    }
    
    // PERFORMANS İYİLEŞTİRME: Önbellekteki token'ı kontrol et
    const cacheKey = `exam-token-${studentCode}`;
    const cachedToken = cache.get(cacheKey);
    
    if (cachedToken) {
      cachedRequests++;
      // Önbellekte token varsa DB'ye sorgu yapmadan devam et
      return res;
    }
    
    // Önbellekte yoksa, DB'ye sor ve önbelleğe al
    dbRequests++;
    const examId = path.split('/')[2]; // /sinav/[examId] formatından examId'yi al
    
    // Supabase client'ı oluştur
    const supabase = createMiddlewareClient({ req, res })
    
    // Öğrenci kodunun geçerli olup olmadığını kontrol et
    const { data, error } = await supabase
      .from('exam_students')
      .select('id')
      .eq('student_code', studentCode)
      .eq('exam_id', examId)
      .maybeSingle();
    
    if (error || !data) {
      return NextResponse.redirect(new URL('/sinav-giris?error=invalid-code', req.url));
    }
    
    // Geçerli token'ı önbelleğe al
    cache.set(cacheKey, { valid: true, examId });
    
    return res;
  }

  // Yönetici paneline erişim kontrolü
  if (path.startsWith('/panel')) {
    // Supabase client'ı oluştur
    const supabase = createMiddlewareClient({ req, res })
    
    // Kullanıcının oturum açıp açmadığını kontrol et
    const { data: { session } } = await supabase.auth.getSession()
    
    // Oturum yoksa giriş sayfasına yönlendir
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
  
  // 10'de 1 oranında performans istatistiklerini log'a yaz (debug için)
  if (totalRequests % 10 === 0) {
    console.log(`[Performans] Toplam istekler: ${totalRequests}, DB istekleri: ${dbRequests}, Önbellekten: ${cachedRequests}`);
    console.log(`[Verimlilik] Önbellek oranı: ${(cachedRequests / (dbRequests + cachedRequests) * 100).toFixed(2)}%`);
  }
  
  return res
}

export const config = {
  matcher: [
    '/panel/:path*',  // Yönetici paneli
    '/login',         // Login sayfası
    '/sinav/:path*',  // Sınav sayfaları
  ],
}