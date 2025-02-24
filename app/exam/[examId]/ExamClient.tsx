'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  name: string;
  surname: string;
  code: string;
  examStudentId: string;
}

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  points: number;
  question_type: string;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions: Question[];
  is_active: boolean;
  passing_grade: number;
}

interface Props {
  examId: string;
  examData: {
    id: string;
    title: string;
    description: string;
    duration: number;
    questions: Question[];
    is_active: boolean;
    passing_grade: number;
  };
  studentData: {
    id: string; // exam_students tablosundaki id
    student_id: string;
    exam_id: string;
    students: {
      id: string;
      name: string;
      surname: string;
      phone: string;
    };
  };
}

export default function ExamClient({ examId, examData, studentData }: Props) {
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(examData.duration * 60);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Başlangıçta mevcut cevapları yükle
  useEffect(() => {
    const loadExistingAnswers = async () => {
      try {
        const { data: existingAnswers, error: answersError } = await supabase
          .from('answers')
          .select('question_id, student_answer')
          .eq('exam_id', examData.id)
          .eq('student_id', studentData.students.id);

        if (answersError) {
          console.error('Mevcut cevaplar yüklenirken hata:', answersError);
          return;
        }

        if (existingAnswers) {
          const answerMap = existingAnswers.reduce((acc, curr) => ({
            ...acc,
            [curr.question_id]: curr.student_answer
          }), {});
          setAnswers(answerMap);
        }
      } catch (err) {
        console.error('Cevaplar yüklenirken hata:', err);
      }
    };

    loadExistingAnswers();
    setHasStarted(examData.is_active);
    setLoading(false);
  }, [examData.id, studentData.students.id, examData.is_active, supabase]);

  useEffect(() => {
    if (!hasStarted || timeLeft <= 0 || examSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, timeLeft, examSubmitted]);

  const handleAnswerSelect = async (questionId: string, answer: string) => {
    try {
      const currentQuestion = examData.questions.find(q => q.id === questionId);
      if (!currentQuestion) return;

      // Önce mevcut cevabı sil
      const { error: deleteError } = await supabase
        .from('answers')
        .delete()
        .eq('exam_id', examData.id)
        .eq('question_id', questionId)
        .eq('student_id', studentData.students.id);

      if (deleteError) {
        console.error('Eski cevap silinirken hata:', deleteError);
      }

      // Yeni cevabı kaydet
      const { error: insertError } = await supabase
        .from('answers')
        .insert({
          exam_id: examData.id,
          question_id: questionId,
          student_id: studentData.students.id,
          student_answer: answer,
          is_correct: answer.toLowerCase() === currentQuestion.correct_answer.toLowerCase()
        });

      if (insertError) {
        console.error('Cevap kaydedilirken hata:', insertError);
        setError('Cevabınız kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
        return;
      }

      // State'i güncelle
      setAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));
      
    } catch (error) {
      console.error('Cevap kaydedilirken hata:', error);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleFinishExam = async () => {
    if (!examData || !studentData) return;

    try {
      setLoading(true);
      setExamSubmitted(true);
      router.push(`/exam-result/${examId}?student=${studentData.students.id}`);
    } catch (err) {
      console.error('Sınav bitirme hatası:', err);
      setError('Sınav bitirme işlemi sırasında bir hata oluştu');
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (!hasStarted) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Sınav henüz başlatılmadı</h1>
        <p>Lütfen sınavın başlamasını bekleyin.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {error ? (
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Hata</h1>
          <p>{error}</p>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Sınav Başlığı ve Öğrenci Bilgileri */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                  {examData.title}
                </h1>
                <div className="space-y-1">
                  <p className="text-gray-300 text-lg">
                    <span className="text-gray-400">Öğrenci:</span> {studentData.students.name} {studentData.students.surname}
                  </p>
                  <p className="text-gray-400 font-mono text-sm">
                    <span className="bg-gray-700/50 px-2 py-1 rounded">ID: {studentData.students.id}</span>
                  </p>
                </div>
              </div>
              
              {/* Kalan Süre */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 px-6 py-4 rounded-xl shadow-lg">
                <p className="text-white/90 text-sm font-medium mb-1">Kalan Süre</p>
                <p className="text-3xl font-bold text-white tabular-nums">
                  {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                  {String(timeLeft % 60).padStart(2, '0')}
                </p>
              </div>
            </div>
          </div>

          {/* Soru Bölümü */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Soru {currentQuestionIndex + 1}/{examData.questions.length}
              </h2>
            </div>

            {examData.questions[currentQuestionIndex] && (
              <div className="space-y-6">
                <p className="text-gray-900 text-lg">
                  {examData.questions[currentQuestionIndex].question_text}
                </p>

                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map(option => {
                    const questionId = examData.questions[currentQuestionIndex].id;
                    const optionText = examData.questions[currentQuestionIndex][`option_${option.toLowerCase()}`];
                    const isSelected = answers[questionId] === option;

                    return (
                      <button
                        key={option}
                        onClick={() => handleAnswerSelect(questionId, option)}
                        className={`w-full p-4 text-left rounded-lg transition-all ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <span className="font-semibold">{option})</span> {optionText}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className={`px-6 py-2 rounded-lg ${
                  currentQuestionIndex === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                ← Önceki Soru
              </button>

              {currentQuestionIndex === examData.questions.length - 1 ? (
                <button
                  onClick={handleFinishExam}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Sınavı Bitir
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min((examData.questions.length || 1) - 1, prev + 1))}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Sonraki Soru →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
