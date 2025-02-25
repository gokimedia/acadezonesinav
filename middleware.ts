import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;
  
  // Sınav sayfaları için token kontrolü
  if (pathname.startsWith('/exam/')) {
    const examToken = req.cookies.get('exam_token')?.value;
    
    if (!examToken) {
      return NextResponse.redirect(new URL('/exam-login', req.url));
    }

    try {
      // Base64 içeriğinin kontrolü ve düzgün parse edilmesi
      const tokenStr = examToken.startsWith('base64-') 
        ? examToken.replace('base64-', '') 
        : examToken;
        
      // Güvenli bir şekilde base64 decode işlemi
      let tokenData;
      try {
        // Browser için atob, Node.js için Buffer kullanımı
        const decodedStr = typeof window !== 'undefined' 
          ? atob(tokenStr)
          : Buffer.from(tokenStr, 'base64').toString('utf-8');
        tokenData = JSON.parse(decodedStr);
      } catch (decodeError) {
        // Base64 olmayabilir, doğrudan JSON olarak parse etmeyi dene
        tokenData = JSON.parse(tokenStr);
      }
      
      // Gerekli token alanlarının kontrolü
      if (!tokenData || !tokenData.examId || !tokenData.studentId || !tokenData.studentCode) {
        console.error('Geçersiz token içeriği:', tokenData);
        return NextResponse.redirect(new URL('/exam-login', req.url));
      }
    } catch (error) {
      console.error('Token parse hatası:', error);
      return NextResponse.redirect(new URL('/exam-login', req.url));
    }
    
    // Token geçerliyse devam et
    return res;
  }

  // Panel erişimi için oturum kontrolü
  if (pathname.startsWith('/panel')) {
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/panel/:path*',  // Yönetici paneli
    '/login',         // Login sayfası
    '/exam/:path*',   // Sınav sayfaları
  ],
}