'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

type Props = {
  examId: string;
  studentId: string;
};

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

interface Answer {
  id: string;
  exam_id: string;
  student_id: string;
  question_id: string;
  student_answer: string;
  is_correct: boolean;
  created_at: string;
  question?: Question;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  passing_grade: number;
  questions: Question[];
}

interface Student {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
}

type ExamResult = {
  exam: Exam;
  student: Student;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  score: number;
  completion_time: string;
  answers: Answer[];
  passing_grade: number;
};

// Sabit geçer not - her sınav için %80
const PASSING_GRADE = 80;

export default function ExamResultClient({ examId, studentId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const supabase = createClientComponentClient();

  // Sınav sonuçlarını getirme fonksiyonu
  const fetchResult = useCallback(async () => {
    try {
      setLoading(true);
      
      // Sınav bilgilerini al
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          description,
          duration,
          passing_grade,
          questions (
            id,
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer
          )
        `)
        .eq('id', examId)
        .single();

      if (examError) {
        console.error('Sınav bilgileri alınamadı:', examError);
        throw new Error('Sınav bilgileri alınamadı');
      }

      // Öğrenci bilgilerini al
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError) {
        console.error('Öğrenci bilgileri alınamadı:', studentError);
        throw new Error('Öğrenci bilgileri alınamadı');
      }

      // Sonuçları al
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .eq('exam_id', examId)
        .eq('student_id', studentId);

      if (answersError) {
        console.error('Cevaplar alınamadı:', answersError);
        throw new Error('Cevaplar alınamadı');
      }

      // Cevapları soruları ile birleştir
      const answersWithQuestions = answers.map(answer => {
        const question = exam.questions.find(q => q.id === answer.question_id);
        return {
          ...answer,
          question
        };
      });

      // Sonuçları hesapla
      const totalQuestions = exam.questions.length;
      const correctAnswers = answers.filter(a => a.is_correct).length;
      const wrongAnswers = answers.length - correctAnswers;
      const unansweredQuestions = totalQuestions - answers.length;
      const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      setResult({
        exam,
        student,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers + unansweredQuestions,
        score,
        completion_time: new Date().toLocaleString('tr-TR'),
        answers: answersWithQuestions,
        passing_grade: PASSING_GRADE // Sabit geçer not değeri kullanılıyor
      });

    } catch (err: any) {
      console.error('Sonuç alınırken hata:', err);
      setError(err.message || 'Sonuçlar alınırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [examId, studentId, supabase]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Sonuçlar yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-red-600 text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h2 className="text-xl font-bold mb-2">Hata Oluştu</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.href = '/exam-login'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Giriş Sayfasına Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600 text-center p-8 bg-white rounded-lg shadow-lg">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Sonuç Bulunamadı</h2>
          <p className="mb-4">Bu sınav için herhangi bir sonuç bulunamadı.</p>
          <button
            onClick={() => window.location.href = '/exam-login'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  // Her zaman PASSING_GRADE ile karşılaştırma yapılıyor
  const isPassed = result.score >= PASSING_GRADE;

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`px-6 py-8 text-white ${isPassed ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-red-600 to-red-700'}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold">{result.exam.title}</h1>
                <p className="mt-2 text-white/80">
                  {result.student.name} {result.student.surname}
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="text-center">
                  <div className="text-5xl font-bold">{result.score.toFixed(1)}%</div>
                  <div className="text-sm uppercase tracking-wide mt-1 font-medium">
                    {isPassed ? 'BAŞARILI' : 'BAŞARISIZ'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Result Details */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-500 mb-1">Toplam Soru</div>
                <div className="text-2xl font-bold text-gray-800">{result.total_questions}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-500 mb-1">Doğru Cevap</div>
                <div className="text-2xl font-bold text-green-600">{result.correct_answers}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-500 mb-1">Yanlış Cevap</div>
                <div className="text-2xl font-bold text-red-600">{result.wrong_answers}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-sm text-gray-500 mb-1">Geçer Not</div>
                <div className="text-2xl font-bold text-blue-600">{PASSING_GRADE}%</div>
              </div>
            </div>

            <div className="mb-8">
              <div className={`text-center p-6 rounded-xl ${
                isPassed 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="inline-block mb-4">
                  {isPassed ? (
                    <svg className="w-16 h-16 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-16 h-16 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">
                  {isPassed
                    ? 'Tebrikler! Sınavı başarıyla tamamladınız.'
                    : 'Üzgünüz, sınavı geçemediniz.'}
                </h2>
                <p className="text-gray-600">
                  {isPassed
                    ? `Aldığınız not (${result.score.toFixed(1)}%), geçer not olan ${PASSING_GRADE}%'in üzerinde.`
                    : `Aldığınız not (${result.score.toFixed(1)}%), geçer not olan ${PASSING_GRADE}%'in altında.`}
                </p>
              </div>
            </div>

            {/* Cevapları Göster/Gizle Butonu */}
            <div className="text-center mb-6">
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                {showAnswers ? (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    Cevapları Gizle
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Cevapları Göster
                  </>
                )}
              </button>
            </div>

            {/* Cevaplar Bölümü */}
            {showAnswers && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h3 className="text-xl font-bold mb-6 text-gray-900">Sorular ve Cevaplar</h3>
                <div className="space-y-6">
                  {result.exam.questions.map((question, index) => {
                    const answer = result.answers.find(a => a.question_id === question.id);
                    const isCorrect = answer?.is_correct;
                    const isUnanswered = !answer;
                    
                    return (
                      <div 
                        key={question.id} 
                        className={`p-6 rounded-lg ${
                          isUnanswered 
                            ? 'bg-gray-50 border border-gray-200'
                            : isCorrect 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-red-50 border border-red-200'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="mr-3 mt-1">
                            {isUnanswered ? (
                              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600 font-bold">
                                {index + 1}
                              </span>
                            ) : isCorrect ? (
                              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            ) : (
                              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900 mb-3">{question.question_text}</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                              {['A', 'B', 'C', 'D'].map(option => {
                                const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                                const optionText = question[optionKey] as string;
                                const isStudentAnswer = answer?.student_answer?.toUpperCase() === option;
                                const isCorrectAnswer = question.correct_answer?.toUpperCase() === option;
                                
                                return (
                                  <div 
                                    key={option}
                                    className={`p-3 rounded-lg border ${
                                      isStudentAnswer && isCorrectAnswer
                                        ? 'bg-green-100 border-green-300'
                                        : isStudentAnswer && !isCorrectAnswer
                                          ? 'bg-red-100 border-red-300'
                                          : !isStudentAnswer && isCorrectAnswer
                                            ? 'bg-blue-50 border-blue-300'
                                            : 'bg-white border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center">
                                      <span className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 ${
                                        isStudentAnswer
                                          ? isCorrectAnswer 
                                            ? 'bg-green-500 text-white'
                                            : 'bg-red-500 text-white'
                                          : isCorrectAnswer
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 text-gray-700'
                                      }`}>
                                        {option}
                                      </span>
                                      <span className={`${
                                        isStudentAnswer
                                          ? isCorrectAnswer
                                            ? 'text-green-800 font-medium'
                                            : 'text-red-800 font-medium'
                                          : isCorrectAnswer
                                            ? 'text-blue-800 font-medium'
                                            : 'text-gray-700'
                                      }`}>
                                        {optionText}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {isUnanswered ? (
                              <div className="text-gray-500 mt-2 text-sm font-medium">
                                Bu soruya cevap verilmedi. Doğru cevap: {question.correct_answer.toUpperCase()}
                              </div>
                            ) : !isCorrect ? (
                              <div className="text-red-600 mt-2 text-sm font-medium">
                                Sizin cevabınız: {answer?.student_answer.toUpperCase()} ⛔ Doğru cevap: {question.correct_answer.toUpperCase()} ✅
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
              <div className="text-sm text-gray-500">
                <span className="font-medium">Tamamlanma Zamanı:</span> {result.completion_time}
              </div>
              <div className="space-x-3">
                <button
                  onClick={() => window.print()}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Yazdır
                </button>
                <button
                  onClick={() => window.location.href = '/exam-login'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}