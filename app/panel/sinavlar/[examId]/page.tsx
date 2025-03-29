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
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'fill';
  options: string[];
  correct_answer: string | boolean;
  points: number;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
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

        // Fetch questions with a console log to debug
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', examId);

        if (questionError) throw questionError;
        
        console.log('Ham soru verileri:', questionData);
        
        // Format questions from database
        const formattedQuestions = (questionData || []).map(q => {
          console.log('İşleniyor:', q);
          
          // Extract options from individual fields
          const options: string[] = [];
          if (q.option_a) options.push(q.option_a);
          if (q.option_b) options.push(q.option_b);
          if (q.option_c) options.push(q.option_c);
          if (q.option_d) options.push(q.option_d);

          console.log('Oluşturulan seçenekler:', options);

          let correctAnswer = q.correct_answer;
          
          // Convert letter answer (A, B, C, D) to full option text for multiple choice questions
          if (q.question_type === 'multiple_choice' && q.correct_answer) {
            console.log('Çoktan seçmeli soru, doğru cevap:', q.correct_answer);
            const letterCode = q.correct_answer.charCodeAt(0);
            // If it's A, B, C, D (65, 66, 67, 68)
            if (letterCode >= 65 && letterCode <= 68) {
              const optionIndex = letterCode - 65; // A=0, B=1, C=2, D=3
              console.log('Harf kodu:', letterCode, 'İndeks:', optionIndex);
              if (options[optionIndex]) {
                correctAnswer = options[optionIndex];
                console.log('Doğru cevap metni:', correctAnswer);
              }
            }
          } else if (q.question_type === 'true_false') {
            // Doğru/Yanlış soruları için boolean değere dönüştürme
            console.log('Doğru/Yanlış soru, ham cevap:', q.correct_answer);
            correctAnswer = q.correct_answer === 'true' || q.correct_answer === true;
            console.log('İşlenmiş doğru/yanlış cevap:', correctAnswer);
          }
          
          const processedQuestion = {
            ...q,
            options: options,
            correct_answer: correctAnswer
          };
          
          console.log('İşlenmiş soru:', processedQuestion);
          return processedQuestion;
        });
        
        console.log('Tüm formatlanmış sorular:', formattedQuestions);
        setQuestions(formattedQuestions);
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
                <div className="flex justify-between mb-2">
                  <h3 className="text-base font-medium text-gray-900">
                    {index + 1}. {question.question_text}
                  </h3>
                  <span className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {question.points} Puan
                  </span>
                </div>
                
                <div className="space-y-2 ml-6">
                  {question.question_type === 'multiple_choice' && question.options && question.options.length > 0 ? (
                    question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`p-3 rounded-md ${
                          String(option) === String(question.correct_answer)
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 mr-2">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span>{option}</span>
                          {String(option) === String(question.correct_answer) && (
                            <span className="ml-auto text-sm font-medium text-green-600 flex items-center">
                              &#10003; Doğru Cevap
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : question.question_type === 'true_false' ? (
                    <div className="flex gap-4">
                      <div 
                        className={`p-3 rounded-md flex items-center gap-2 ${
                          question.correct_answer === true 
                            ? 'bg-green-50 border border-green-200 text-green-800' 
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <span>Doğru</span>
                        {question.correct_answer === true && (
                          <span className="ml-2 text-sm font-medium text-green-600">&#10003; Doğru Cevap</span>
                        )}
                      </div>
                      <div 
                        className={`p-3 rounded-md flex items-center gap-2 ${
                          question.correct_answer === false 
                            ? 'bg-green-50 border border-green-200 text-green-800' 
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <span>Yanlış</span>
                        {question.correct_answer === false && (
                          <span className="ml-2 text-sm font-medium text-green-600">&#10003; Doğru Cevap</span>
                        )}
                      </div>
                    </div>
                  ) : question.question_type === 'fill' ? (
                    <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-800">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Doğru Cevap:</span>
                        <span className="bg-white px-3 py-1 rounded border border-green-200">
                          {question.correct_answer}
                        </span>
                      </div>
                    </div>
                  ) : (
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
