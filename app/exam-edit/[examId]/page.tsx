'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Dynamically import the client component to handle potential SSR issues
const ExamEditClient = dynamic(() => import('./ExamEditClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <LoadingSpinner />
      <p className="ml-3 text-gray-600">Yükleniyor...</p>
    </div>
  ),
});

export default function ExamEditPage() {
  const params = useParams();
  const examId = params.examId as string;

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner />
        <p className="ml-3 text-gray-600">Yükleniyor...</p>
      </div>
    }>
      <ExamEditClient examId={examId} />
    </Suspense>
  );
}