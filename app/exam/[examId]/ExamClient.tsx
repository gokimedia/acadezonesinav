'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  name: string;
  surname: string;
  phone: string;
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
  [key: string]: string | number; // İndeks imzası eklendi
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

interface ExamStudentData {
  id: string; // exam_students tablosundaki id
  student_id: string;
  exam_id: string;
  students: Student;
}

interface Props {
  examId: string;
  examData: Exam;
  studentData: ExamStudentData;
}

export default function ExamClient({ examId, examData, studentData }: Props) {
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(examData.duration * 60);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isExamActive, setIsExamActive] = useState(examData.is_active);
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Öğrenci ve sınav verileri hazır mı kontrolü
  const isDataReady = examData && studentData && studentData.students;

  // Periyodik olarak sınav durumunu kontrol et
  useEffect(() => {
    if (!examId) return;
    
    const checkExamStatus = async () => {
      try {
        console.log("Sınav durumu kontrol ediliyor...");
        const { data, error } = await supabase
          .from('exams')
          .select('is_active')
          .eq('id', examId)
          .single();
          
        if (error) {
          console.error("Sınav durumu kontrol hatası:", error);
          return;
        }
        
        console.log("Sınav durumu:", data.is_active);
        if (!data.is_active && isExamActive) {
          console.log("Sınav devre dışı bırakıldı!");
          setIsExamActive(false);
          setError('Bu sınav yönetici tarafından durduruldu. Lütfen giriş sayfasına dönün.');
        }
      } catch (err) {
        console.error('Sınav durumu kontrol hatası:', err);
      }
    };
    
    // İlk kontrol
    checkExamStatus();
    
    // 30 saniyede bir kontrol et
    const interval = setInterval(checkExamStatus, 30000);
    
    return () => clearInterval(interval);
  }, [examId, supabase, isExamActive]);

  // Sınavı bitirme işlemi
  const handleFinishExam = useCallback(async () => {
    if (!isDataReady) return;

    try {
      setLoading(true);
      setExamSubmitted(true);
      router.push(`/exam-result/${examId}?student=${studentData.students.id}`);
    } catch (err) {
      console.error('Sınav bitirme hatası:', err);
      setError('Sınav bitirme işlemi sırasında bir hata oluştu');
      setLoading(false);
    }
  }, [examId, isDataReady, router, studentData?.students?.id]);

  // Mevcut cevapları yükleme fonksiyonu
  const loadExistingAnswers = useCallback(async () => {
    if (!isDataReady) return;
    
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

      if (existingAnswers?.length) {
        const answerMap = existingAnswers.reduce<Record<string, string>>((acc, curr) => ({
          ...acc,
          [curr.question_id]: curr.student_answer
        }), {});
        setAnswers(answerMap);
      }
    } catch (err) {
      console.error('Cevaplar yüklenirken hata:', err);
    }
  }, [examData?.id, studentData?.students?.id, supabase, isDataReady]);

  // Başlangıçta verileri yükle
  useEffect(() => {
    if (!isDataReady) return;

    const initializeExam = async () => {
      try {
        await loadExistingAnswers();
        
        // Başlangıç zamanını kontrol et (önce sessionStorage, sonra localStorage)
        const storageKey = `exam_${examData.id}_student_${studentData.students.id}_start_time`;
        
        // Hata durumlarına karşı try-catch bloğu ekle
        try {
          // Önce sessionStorage'da kontrol et (tarayıcı oturumu için)
          let savedStartTime = sessionStorage.getItem(storageKey);
          
          // sessionStorage'da yoksa localStorage'ı kontrol et
          if (!savedStartTime) {
            savedStartTime = localStorage.getItem(storageKey);
          }
          
          if (savedStartTime) {
            // Eğer başlangıç zamanı kaydedilmişse, kalan süreyi hesapla
            const startTime = parseInt(savedStartTime, 10);
            const currentTime = new Date().getTime();
            const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
            const remainingSeconds = Math.max(0, examData.duration * 60 - elapsedSeconds);
            
            console.log('Sınav bilgileri:', {
              startTime,
              currentTime,
              elapsedSeconds,
              remainingSeconds,
              duration: examData.duration
            });
            
            setTimeLeft(remainingSeconds);
          } else {
            // Eğer başlangıç zamanı yoksa, şimdi kaydet
            const now = new Date().getTime();
            console.log('Yeni sınav başlangıç zamanı kaydediliyor:', now);
            
            // Her iki storage'a da kaydet (redundancy için)
            try {
              localStorage.setItem(storageKey, now.toString());
              sessionStorage.setItem(storageKey, now.toString());
            } catch (storageError) {
              console.error('Storage kayıt hatası:', storageError);
              // localStorage hata verirse sadece session'a kaydet
              sessionStorage.setItem(storageKey, now.toString());
            }
          }
        } catch (storageError) {
          console.error('Storage erişim hatası:', storageError);
          // Depolama erişim hatası - başlangıç süresi yok sayılıyor
          setError('Tarayıcı depolama alanına erişim hatası. Sınav süresi tam olarak çalışmayabilir.');
        }
        
        setHasStarted(examData.is_active);
        setIsExamActive(examData.is_active);
      } catch (err) {
        console.error('Sınav başlatılırken hata:', err);
        setError('Sınav yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    initializeExam();
  }, [examData?.id, examData?.is_active, examData?.duration, loadExistingAnswers, isDataReady, studentData?.students?.id]);

  // Süre sayacı
  useEffect(() => {
    if (!hasStarted || timeLeft <= 0 || examSubmitted || !isExamActive) return;

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
  }, [hasStarted, timeLeft, examSubmitted, handleFinishExam, isExamActive]);

  // Cevap seçme işlemi
  const handleAnswerSelect = async (questionId: string, answer: string) => {
    if (!isDataReady || !isExamActive) return;
    
    try {
      const currentQuestion = examData.questions.find(q => q.id === questionId);
      if (!currentQuestion) return;

      // Önce yerel state'i güncelle (UX için hızlı feedback)
      setAnswers(prev => ({
        ...prev,
        [questionId]: answer
      }));

      // Mevcut cevabı sil
      const { error: deleteError } = await supabase
        .from('answers')
        .delete()
        .eq('exam_id', examData.id)
        .eq('question_id', questionId)
        .eq('student_id', studentData.students.id);

      if (deleteError) {
        console.error('Eski cevap silinirken hata:', deleteError);
        // Silme hatası kritik değil, devam et
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
    } catch (error) {
      console.error('Cevap kaydedilirken hata:', error);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Sonraki soruya geçiş
  const goToNextQuestion = () => {
    setCurrentQuestionIndex(prev => 
      Math.min((examData?.questions?.length || 1) - 1, prev + 1)
    );
  };

  // Önceki soruya geçiş
  const goToPreviousQuestion = () => {
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
  };

  // Yükleniyor durumu
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  // Sınav durduruldu
  if (!isExamActive) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-600 text-white p-8 rounded-xl max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Sınav Durduruldu</h1>
          <p className="text-lg mb-6">Bu sınav yönetici tarafından durduruldu. Lütfen yöneticinizle iletişime geçin.</p>
          <button 
            onClick={() => window.location.href = '/exam-login'} 
            className="bg-white text-red-600 px-6 py-2 rounded-lg hover:bg-gray-100"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  // Veri eksikliği kontrolü
  if (!isDataReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-500 text-white p-6 rounded-lg max-w-md text-center">
          <h1 className="text-xl font-bold mb-4">Veri Hatası</h1>
          <p>Sınav veya öğrenci bilgileri yüklenemedi. Lütfen sayfayı yenileyin veya yöneticinize başvurun.</p>
        </div>
      </div>
    );
  }

  // Sınav henüz başlamadı
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Sınav henüz başlatılmadı</h1>
          <p className="text-gray-700 mb-6">Lütfen sınavın başlamasını bekleyin.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Yenile
          </button>
        </div>
      </div>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-500 text-white p-6 rounded-lg max-w-md text-center">
          <h1 className="text-xl font-bold mb-4">Hata</h1>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-white text-red-500 px-6 py-2 rounded-lg hover:bg-gray-100"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // Ana sınav içeriği
  const currentQuestion = examData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === examData.questions.length - 1;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
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
            
            {/* Soruların durumunu gösteren noktalama */}
            <div className="flex space-x-1">
              {examData.questions.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-3 h-3 rounded-full ${
                    idx === currentQuestionIndex 
                      ? 'bg-blue-500' 
                      : answers[examData.questions[idx].id] 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                  }`}
                  aria-label={`Soru ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {currentQuestion && (
            <div className="space-y-6">
              <p className="text-gray-900 text-lg">
                {currentQuestion.question_text}
              </p>

              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map(option => {
                  const isSelected = answers[currentQuestion.id] === option;
                  const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                  const optionText = currentQuestion[optionKey] as string;

                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                      className={`w-full p-4 text-left rounded-lg transition-all ${
                        isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-900 hover:bg-gray-100 border border-gray-200'
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
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-6 py-2 rounded-lg ${
                currentQuestionIndex === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              ← Önceki Soru
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleFinishExam}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Sınavı Bitir
              </button>
            ) : (
              <button
                onClick={goToNextQuestion}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Sonraki Soru →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}