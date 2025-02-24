'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface ExamResult {
  exam_id: string;
  exam_title: string;
  total_students: number;
  average_score: number;
  correct_answers: number;
  wrong_answers: number;
}

export default function Results() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      // Fetch all exams with their results
      const { data: exams, error: examError } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          exam_students (
            id,
            student_id
          ),
          answers (
            id,
            is_correct
          )
        `);

      if (examError) throw examError;

      // Process the results
      const processedResults = exams?.map((exam: any) => {
        const totalStudents = exam.exam_students?.length || 0;
        const correctAnswers = exam.answers?.filter((a: any) => a.is_correct)?.length || 0;
        const wrongAnswers = exam.answers?.filter((a: any) => !a.is_correct)?.length || 0;
        const totalAnswers = correctAnswers + wrongAnswers;
        
        return {
          exam_id: exam.id,
          exam_title: exam.title,
          total_students: totalStudents,
          average_score: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
          correct_answers: correctAnswers,
          wrong_answers: wrongAnswers,
        };
      });

      setResults(processedResults || []);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sınav Sonuçları</h1>

      <div className="grid gap-6">
        {results.map((result) => (
          <div key={result.exam_id} className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{result.exam_title}</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-blue-600">Toplam Öğrenci</div>
                <div className="text-2xl font-bold">{result.total_students}</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded">
                <div className="text-sm text-green-600">Ortalama Başarı</div>
                <div className="text-2xl font-bold">
                  {result.average_score.toFixed(1)}%
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded">
                <div className="text-sm text-purple-600">Doğru/Yanlış Oranı</div>
                <div className="text-2xl font-bold">
                  {result.correct_answers}/{result.wrong_answers}
                </div>
              </div>
            </div>

            <div className="w-full h-64">
              <BarChart
                width={600}
                height={200}
                data={[
                  {
                    name: 'Doğru',
                    value: result.correct_answers,
                    fill: '#10B981'
                  },
                  {
                    name: 'Yanlış',
                    value: result.wrong_answers,
                    fill: '#EF4444'
                  }
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" />
              </BarChart>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
