'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Result {
  score: number;
  correct_count: number;
  wrong_count: number;
  total_questions: number;
}

export default function ExamComplete() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data: resultData, error } = await supabase
          .from('results')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) throw error;
        setResult(resultData);
      } catch (err) {
        console.error('Error fetching results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Sınav Sonuçları</h1>
          
          {result ? (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-48 h-48 rounded-full bg-blue-500 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold">{result.score}</div>
                    <div className="text-sm opacity-80">PUAN</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-400">{result.correct_count}</div>
                  <div className="text-sm opacity-80">Doğru</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-400">{result.wrong_count}</div>
                  <div className="text-sm opacity-80">Yanlış</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-2xl font-bold">{result.total_questions}</div>
                  <div className="text-sm opacity-80">Toplam Soru</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-white/80">
              Sonuçlar henüz hesaplanmadı.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
