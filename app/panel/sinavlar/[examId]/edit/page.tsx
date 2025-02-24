'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { FormInput } from '@/components/common/FormInput';

interface Question {
  id: string;
  question: string;
  options: string[] | null;
  correct_answer: string;
  exam_id: string;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  is_active: boolean;
}

export default function EditExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
          .eq('exam_id', examId)
          .order('id');

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

  const handleExamUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('exams')
        .update({
          title: exam.title,
          description: exam.description,
          duration: exam.duration,
          is_active: exam.is_active,
        })
        .eq('id', examId);

      if (error) throw error;
      router.push(`/panel/sinavlar/${examId}`);
    } catch (err) {
      console.error('Sınav güncellenirken hata:', err);
      setError(err instanceof Error ? err.message : 'Sınav güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

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
        <h1 className="text-2xl font-semibold text-gray-900">Sınavı Düzenle</h1>
        <Button
          variant="outline"
          onClick={() => router.push(`/panel/sinavlar/${examId}`)}
        >
          İptal
        </Button>
      </div>

      <form onSubmit={handleExamUpdate} className="space-y-6">
        <Card>
          <div className="p-6 space-y-4">
            <FormInput
              label="Sınav Başlığı"
              value={exam.title}
              onChange={(e) => setExam({ ...exam, title: e.target.value })}
              required
            />

            <FormInput
              label="Açıklama"
              value={exam.description}
              onChange={(e) => setExam({ ...exam, description: e.target.value })}
              multiline={true}
              rows={4}
            />

            <FormInput
              label="Süre (dakika)"
              type="number"
              value={exam.duration.toString()}
              onChange={(e) => setExam({ ...exam, duration: parseInt(e.target.value) || 0 })}
              required
              min={1}
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={exam.is_active}
                onChange={(e) => setExam({ ...exam, is_active: e.target.checked })}
                className="h-4 w-4 text-primary-600 rounded border-gray-300"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Sınav Aktif
              </label>
            </div>
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

        <div className="flex justify-end space-x-4">
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
          >
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  );
}
