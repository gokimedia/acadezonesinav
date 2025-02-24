'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type Props = {
  examId: string;
};

type ExamResult = {
  exam_id: string;
  exam_title: string;
  total_students: number;
  students_started: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
};

type QuestionResult = {
  question_id: string;
  question_text: string;
  total_answers: number;
  correct_answers: number;
  wrong_answers: number;
};

type StudentProgress = {
  student_id: string;
  name: string;
  surname: string;
  answered_questions: number;
  correct_answers: number;
  score: number | null;
};

export default function LiveResultsClient({ examId }: Props) {
  const supabaseClient = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [questionSuccessData, setQuestionSuccessData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const [examResponse, resultsResponse, answersResponse] = await Promise.all([
          supabaseClient
            .from('exams')
            .select(`
              *,
              questions (
                id,
                question_text,
                correct_answer
              )
            `)
            .eq('id', examId)
            .single(),
          supabaseClient
            .from('results')
            .select(`
              *,
              students (
                id,
                name,
                surname
              )
            `)
            .eq('exam_id', examId),
          supabaseClient
            .from('answers')
            .select('*')
            .eq('exam_id', examId)
        ]);

        if (!mounted) return;

        if (examResponse.error) throw examResponse.error;
        if (resultsResponse.error) throw resultsResponse.error;
        if (answersResponse.error) throw answersResponse.error;

        updateStats(examResponse.data, resultsResponse.data, answersResponse.data);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Realtime subscriptions
    const resultsChannel = supabaseClient
      .channel('results-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'results',
          filter: `exam_id=eq.${examId}`
        },
        async (payload) => {
          console.log('Results change received:', payload);
          fetchData();
        }
      )
      .subscribe();

    const answersChannel = supabaseClient
      .channel('answers-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'answers',
          filter: `exam_id=eq.${examId}`
        },
        async (payload) => {
          console.log('Answers change received:', payload);
          fetchData();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      resultsChannel.unsubscribe();
      answersChannel.unsubscribe();
    };
  }, [examId]);

  const updateStats = (examInfo: any, resultsData: any[], answersData: any[]) => {
    console.log('Updating stats with:', { resultsData, answersData });
    
    // Sınav sonuçlarını hesapla
    const totalStudents = resultsData?.length || 0;
    const studentsStarted = resultsData?.filter(r => r.score !== null).length || 0;
    const scores = resultsData?.map(r => r.score || 0) || [];
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Sınav sonuçlarını set et
    setExamResult({
      exam_id: examId,
      exam_title: examInfo.title,
      total_students: totalStudents,
      students_started: studentsStarted,
      average_score: averageScore,
      highest_score: highestScore,
      lowest_score: lowestScore
    });

    // Soru sonuçlarını hesapla
    const questionStats = examInfo?.questions?.map((q: any) => {
      const questionAnswers = answersData?.filter(a => a.question_id === q.id) || [];
      const correctAnswers = questionAnswers.filter(a => a.is_correct).length;
      return {
        question_id: q.id,
        question_text: q.question_text,
        total_answers: questionAnswers.length,
        correct_answers: correctAnswers,
        wrong_answers: questionAnswers.length - correctAnswers
      };
    }) || [];

    setQuestionResults(questionStats);

    // Öğrenci ilerlemelerini hesapla
    const studentStats = resultsData?.map(result => ({
      student_id: result.student_id,
      name: result.students.name,
      surname: result.students.surname,
      answered_questions: result.total_questions || 0,
      correct_answers: result.correct_count || 0,
      score: result.score
    })) || [];

    setStudentProgress(studentStats);

    // Soru başarı oranları için veri hazırlama
    const questionSuccessData = {
      labels: questionStats.map((q, index) => `Soru ${index + 1}`),
      datasets: [
        {
          label: 'Doğru',
          data: questionStats.map(q => q.correct_answers),
          backgroundColor: '#10B981',
        },
        {
          label: 'Yanlış',
          data: questionStats.map(q => q.wrong_answers),
          backgroundColor: '#EF4444',
        },
      ],
    };

    setQuestionSuccessData(questionSuccessData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-medium text-purple-100 mb-2">Tamamlayan</h3>
            <p className="text-4xl font-bold text-white mb-1">{examResult?.students_started || 0}</p>
            <p className="text-sm text-purple-200">/{examResult?.total_students || 0} öğrenci</p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-medium text-emerald-100 mb-2">Ortalama</h3>
            <p className="text-4xl font-bold text-white mb-1">
              {examResult?.average_score ? examResult.average_score.toFixed(1) : '0.0'}
            </p>
            <p className="text-sm text-emerald-200">%{((examResult?.average_score || 0) / 100 * 100).toFixed(1)} başarı</p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-medium text-amber-100 mb-2">En Yüksek</h3>
            <p className="text-4xl font-bold text-white mb-1">{examResult?.highest_score || 0}</p>
            <p className="text-sm text-amber-200">%{((examResult?.highest_score || 0) / 100 * 100).toFixed(1)} başarı</p>
          </div>
          
          <div className="bg-gradient-to-br from-rose-600 to-rose-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-medium text-rose-100 mb-2">En Düşük</h3>
            <p className="text-4xl font-bold text-white mb-1">{examResult?.lowest_score || 0}</p>
            <p className="text-sm text-rose-200">%{((examResult?.lowest_score || 0) / 100 * 100).toFixed(1)} başarı</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Sol Taraf - Katılımcı İstatistikleri */}
          <div className="col-span-8 grid grid-rows-[140px_1fr] gap-2">
            {/* Toplam Katılımcı İstatistikleri */}
            <div className="bg-gray-800 rounded-2xl p-2 shadow-lg">
              <h3 className="text-sm font-medium text-gray-100 mb-1.5">Katılımcı İstatistikleri</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <div className="bg-gray-700/30 rounded p-1.5">
                    <div className="flex items-center justify-between">
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-[11px]">Toplam Katılımcı</span>
                          <span className="text-white text-xs font-bold">{examResult?.total_students || 0}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-gray-300 text-[11px]">Tamamlayan</span>
                          <span className="text-emerald-400 text-xs font-semibold">{examResult?.students_started || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-700/30 rounded p-1.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-gray-300 text-[11px]">Ortalama Başarı</span>
                      <span className="text-white text-xs font-semibold">%{((examResult?.average_score || 0)).toFixed(1)}</span>
                    </div>
                    <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500"
                        style={{ width: `${(examResult?.average_score || 0)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700/30 rounded p-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-300 text-[11px]">Toplam Cevap</span>
                    <span className="text-white text-xs font-semibold">
                      {questionResults.reduce((sum, q) => sum + q.total_answers, 0)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-emerald-400/90 text-[11px]">Doğru</span>
                        <span className="text-emerald-400 text-[11px] font-medium">
                          {questionResults.reduce((sum, q) => sum + q.correct_answers, 0)}
                        </span>
                      </div>
                      <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500"
                          style={{ 
                            width: `${questionResults.reduce((sum, q) => sum + q.correct_answers, 0) / 
                            Math.max(questionResults.reduce((sum, q) => sum + q.total_answers, 0), 1) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-rose-400/90 text-[11px]">Yanlış</span>
                        <span className="text-rose-400 text-[11px] font-medium">
                          {questionResults.reduce((sum, q) => sum + q.wrong_answers, 0)}
                        </span>
                      </div>
                      <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-rose-500"
                          style={{ 
                            width: `${questionResults.reduce((sum, q) => sum + q.wrong_answers, 0) / 
                            Math.max(questionResults.reduce((sum, q) => sum + q.total_answers, 0), 1) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Soru Başarı Oranları Grafiği */}
            <div className="bg-gray-800 rounded-2xl p-2 shadow-lg">
              <h3 className="text-sm font-medium text-gray-100 mb-1.5">Soru Başarı Oranları</h3>
              <div className="h-[calc(100%-1.75rem)]">
                <Bar
                  data={questionSuccessData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)',
                          drawTicks: false,
                        },
                        ticks: {
                          color: 'rgba(255, 255, 255, 0.8)',
                          font: {
                            size: 8
                          },
                          padding: 2
                        },
                      },
                      x: {
                        grid: {
                          display: false,
                        },
                        ticks: {
                          color: 'rgba(255, 255, 255, 0.8)',
                          font: {
                            size: 8
                          },
                          padding: 2
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          color: 'rgba(255, 255, 255, 0.8)',
                          boxWidth: 6,
                          padding: 2,
                          font: {
                            size: 9
                          }
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sağ Taraf - Tamamlanma Oranı ve En Çok Hata Yapılan Sorular */}
          <div className="col-span-4 flex flex-col gap-2">
            {/* Tamamlanma Oranı */}
            <div className="bg-gray-800 rounded-2xl p-3 shadow-lg">
              <h3 className="text-base font-medium text-gray-100 mb-2">Tamamlanma Oranı</h3>
              <div className="h-[180px] flex items-center justify-center">
                <Doughnut
                  data={{
                    labels: ['Tamamlandı', 'Devam Ediyor'],
                    datasets: [{
                      data: [
                        examResult?.students_started || 0,
                        (examResult?.total_students || 0) - (examResult?.students_started || 0)
                      ],
                      backgroundColor: ['#10B981', '#6366F1'],
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          color: 'rgba(255, 255, 255, 0.8)',
                          boxWidth: 10,
                          padding: 4,
                          font: {
                            size: 11
                          }
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* En Çok Hata Yapılan Sorular */}
            <div className="bg-gray-800 rounded-2xl p-2 shadow-lg flex-1">
              <h3 className="text-base font-medium text-gray-100 mb-1.5">En Çok Hata Yapılan 3 Soru</h3>
              <div className="grid grid-rows-3 gap-1.5">
                {questionResults
                  .map((q, index) => ({
                    ...q,
                    questionNumber: index + 1,
                    errorRate: q.total_answers > 0 
                      ? (q.wrong_answers / q.total_answers) * 100 
                      : 0,
                    successRate: q.total_answers > 0
                      ? (q.correct_answers / q.total_answers) * 100
                      : 0
                  }))
                  .sort((a, b) => b.errorRate - a.errorRate)
                  .slice(0, 3)
                  .map((question) => (
                    <div key={question.question_id} className="bg-gray-700/30 rounded p-1.5">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-white whitespace-nowrap">
                              Soru {question.questionNumber}
                            </span>
                            <span className="text-rose-400 text-xs font-bold whitespace-nowrap">
                              %{question.errorRate.toFixed(1)} Hata
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* İstatistikler */}
                      <div className="grid grid-cols-3 gap-1 my-1">
                        <div className="bg-gray-800/50 rounded px-1 py-0.5">
                          <span className="text-gray-400 text-[10px] block">Toplam</span>
                          <span className="text-white text-xs font-medium">{question.total_answers}</span>
                        </div>
                        <div className="bg-emerald-900/30 rounded px-1 py-0.5">
                          <span className="text-emerald-400/70 text-[10px] block">Doğru</span>
                          <span className="text-emerald-400 text-xs font-medium">{question.correct_answers}</span>
                        </div>
                        <div className="bg-rose-900/30 rounded px-1 py-0.5">
                          <span className="text-rose-400/70 text-[10px] block">Yanlış</span>
                          <span className="text-rose-400 text-xs font-medium">{question.wrong_answers}</span>
                        </div>
                      </div>

                      {/* Progress Bars */}
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>Başarı</span>
                          <span>%{question.successRate.toFixed(1)}</span>
                        </div>
                        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500"
                            style={{ width: `${question.successRate}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400">
                          <span>Hata</span>
                          <span>%{question.errorRate.toFixed(1)}</span>
                        </div>
                        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-rose-500"
                            style={{ width: `${question.errorRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
