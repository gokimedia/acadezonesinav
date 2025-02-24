'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Clock, Users, FileText } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[] | null;
  correct_answer: string;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  is_active: boolean;
  created_at: string;
}

export default function ExamDetailPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchExam() {
      try {
        const { data: examData, error: examError } = await supabase
          .from('exams')
          .select('*')
          .eq('id', examId)
          .single();

        if (examError) throw examError;
        if (!examData) throw new Error('Sınav bulunamadı');

        setExam(examData);

        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', examId);

        if (questionError) throw questionError;
        setQuestions(questionData || []);
      } catch (err) {
        console.error('Sınav yüklenirken hata:', err);
        setError(err instanceof Error ? err.message : 'Sınav yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    fetchExam();
  }, [examId]);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error || !exam) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {error || 'Sınav bulunamadı'}
        </h2>
        <Button
          variant="primary"
          onClick={() => router.push('/panel/sinavlar')}
        >
          Sınavlara Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{exam.title}</h1>
        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/panel/sinavlar/${examId}/edit`)}
          >
            Düzenle
          </Button>
          <Button
            variant={exam.is_active ? 'success' : 'primary'}
            onClick={async () => {
              try {
                await supabase
                  .from('exams')
                  .update({ is_active: !exam.is_active })
                  .eq('id', examId);
                
                setExam({ ...exam, is_active: !exam.is_active });
              } catch (err) {
                console.error('Sınav durumu güncellenirken hata:', err);
              }
            }}
          >
            {exam.is_active ? 'Sınavı Durdur' : 'Sınavı Başlat'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <div className="flex items-center space-x-4 p-6">
            <div className="rounded-full bg-primary-50 p-3">
              <Clock className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Süre</p>
              <p className="text-2xl font-semibold text-gray-900">
                {exam.duration} dk
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4 p-6">
            <div className="rounded-full bg-warning-50 p-3">
              <FileText className="h-6 w-6 text-warning-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Soru Sayısı</p>
              <p className="text-2xl font-semibold text-gray-900">
                {questions.length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-4 p-6">
            <div className="rounded-full bg-success-50 p-3">
              <Users className="h-6 w-6 text-success-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Durum</p>
              <p className="text-2xl font-semibold text-gray-900">
                {exam.is_active ? 'Aktif' : 'Pasif'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sınav Açıklaması
          </h2>
          <p className="text-gray-700">{exam.description}</p>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sorular ({questions.length})
          </h2>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                <h3 className="text-base font-medium text-gray-900 mb-2">
                  {index + 1}. {question.question}
                </h3>
                <div className="space-y-2 ml-6">
                  {question.options?.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`p-2 rounded-md ${
                        option === question.correct_answer
                          ? 'bg-success-50 text-success-700'
                          : 'bg-gray-50'
                      }`}
                    >
                      {option}
                      {option === question.correct_answer && (
                        <span className="ml-2 text-success-500">(Doğru Cevap)</span>
                      )}
                    </div>
                  ))}
                  {!question.options && (
                    <div className="text-gray-500 italic">
                      Bu soru için seçenekler bulunmamaktadır.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
