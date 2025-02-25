'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import ExamResultClient from './ExamResultClient';

// Ana sayfa bileşeni
export default function ExamResultPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Suspense fallback={<LoadingSpinner />}>
        <ClientWrapper />
      </Suspense>
    </div>
  );
}

// Parametreleri almaktan sorumlu sarmalayıcı bileşen
function ClientWrapper() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [params, setParams] = useState({ examId: '', studentId: '' });
  
  useEffect(() => {
    // Client tarafında çalıştığımızdan emin olduğumuzda
    // URL parametrelerini çıkart
    const pathParts = pathname.split('/');
    const examId = pathParts[pathParts.length - 1];
    const studentId = searchParams.get('student') || '';
    
    setParams({ examId, studentId });
    setIsReady(true);
  }, [pathname, searchParams]);
  
  // Parametreler hazır değilse yükleme göster
  if (!isReady) {
    return <LoadingSpinner />;
  }
  
  // Parametreler hazırsa ana bileşeni göster
  return <ExamResultClient examId={params.examId} studentId={params.studentId} />;
}

// Yükleme göstergesi bileşeni
function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4">Sonuçlar yükleniyor...</p>
    </div>
  );
}