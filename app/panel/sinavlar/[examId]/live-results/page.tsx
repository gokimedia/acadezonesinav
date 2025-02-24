'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
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
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ExamStats {
  totalStudents: number;
  completedStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  questionStats: {
    questionId: string;
    correctCount: number;
    wrongCount: number;
  }[];
  scoreDistribution: {
    range: string;
    count: number;
  }[];
  completionRate: number;
}

const gradientColors = [
  'rgba(255, 99, 132, 0.8)',
  'rgba(54, 162, 235, 0.8)',
  'rgba(255, 206, 86, 0.8)',
  'rgba(75, 192, 192, 0.8)',
  'rgba(153, 102, 255, 0.8)',
];

export default function LiveResultsPage() {
  const { examId } = useParams();
  const [stats, setStats] = useState<ExamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchInitialStats = async () => {
      await loadExamStats();
    };

    fetchInitialStats();

    // Supabase real-time subscription
    const answersChannel = supabase
      .channel('answers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'answers'
        },
        () => {
          setIsUpdating(true);
          loadExamStats().finally(() => {
            setTimeout(() => setIsUpdating(false), 1000);
          });
        }
      )
      .subscribe();

    return () => {
      answersChannel.unsubscribe();
    };
  }, [examId]);

  const loadExamStats = async () => {
    try {
      // 1. Get all exam questions
      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId);

      // 2. Get all exam students
      const { data: examStudents } = await supabase
        .from('exam_students')
        .select('*')
        .eq('exam_id', examId);

      // 3. Get all answers
      const { data: answers } = await supabase
        .from('answers')
        .select('*')
        .eq('exam_id', examId);

      if (!questions || !examStudents || !answers) return;

      // Calculate statistics
      const totalStudents = examStudents.length;
      const studentsWithAnswers = new Set(answers.map(a => a.student_id)).size;
      
      // Calculate scores for each student
      const studentScores = examStudents.map(student => {
        const studentAnswers = answers.filter(a => a.student_id === student.student_id);
        const score = studentAnswers.reduce((acc, answer) => {
          const question = questions.find(q => q.id === answer.question_id);
          return acc + (answer.is_correct ? (question?.points || 0) : 0);
        }, 0);
        return score;
      }).filter(score => score > 0);

      // Calculate question statistics
      const questionStats = questions.map(question => {
        const questionAnswers = answers.filter(a => a.question_id === question.id);
        return {
          questionId: question.id,
          correctCount: questionAnswers.filter(a => a.is_correct).length,
          wrongCount: questionAnswers.filter(a => !a.is_correct).length
        };
      });

      // Calculate score distribution
      const ranges = ['0-20', '21-40', '41-60', '61-80', '81-100'];
      const scoreDistribution = ranges.map(range => {
        const [min, max] = range.split('-').map(Number);
        return {
          range,
          count: studentScores.filter(s => s >= min && s <= max).length
        };
      });

      const stats: ExamStats = {
        totalStudents,
        completedStudents: studentsWithAnswers,
        averageScore: studentScores.length > 0 
          ? studentScores.reduce((acc, s) => acc + s, 0) / studentScores.length 
          : 0,
        highestScore: Math.max(...studentScores, 0),
        lowestScore: Math.min(...studentScores, 0),
        questionStats,
        scoreDistribution,
        completionRate: (studentsWithAnswers / totalStudents) * 100
      };

      setStats(stats);
      setLoading(false);
    } catch (error) {
      console.error('Stats yüklenirken hata:', error);
    }
  };

  if (loading || !stats) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Sonuçlar Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'white',
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleFont: {
          size: 16
        },
        bodyFont: {
          size: 14
        },
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.dataset.label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { 
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 14
          }
        },
        grid: { 
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        }
      },
      x: {
        ticks: { 
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            size: 14
          }
        },
        grid: { 
          display: false,
          drawBorder: false
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-[#111827] text-white">
      <div className={`h-full w-full p-4 transition-opacity duration-300 ${isUpdating ? 'opacity-50' : 'opacity-100'}`}>
        {isUpdating && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full animate-pulse">
            Güncelleniyor...
          </div>
        )}
        {/* Header Stats */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="bg-gradient-to-br from-purple-600/90 to-purple-900/90 rounded-lg p-4 shadow-lg">
            <h3 className="text-purple-100 mb-1 text-base font-medium">Toplam Öğrenci</h3>
            <p className="text-3xl font-bold text-white">{stats.totalStudents}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600/90 to-blue-900/90 rounded-lg p-4 shadow-lg">
            <h3 className="text-blue-100 mb-1 text-base font-medium">Tamamlayan</h3>
            <p className="text-3xl font-bold text-white">{stats.completedStudents}</p>
            <p className="text-sm text-blue-100 mt-1">
              {((stats.completedStudents / stats.totalStudents) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-600/90 to-emerald-900/90 rounded-lg p-4 shadow-lg">
            <h3 className="text-emerald-100 mb-1 text-base font-medium">Ortalama</h3>
            <p className="text-3xl font-bold text-white">{stats.averageScore.toFixed(1)}</p>
            <p className="text-sm text-emerald-100 mt-1">
              {((stats.averageScore / 100) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-600/90 to-amber-900/90 rounded-lg p-4 shadow-lg">
            <h3 className="text-amber-100 mb-1 text-base font-medium">En Yüksek</h3>
            <p className="text-3xl font-bold text-white">{stats.highestScore}</p>
            <p className="text-sm text-amber-100 mt-1">
              {((stats.highestScore / 100) * 100).toFixed(1)}%
            </p>
          </div>
          <div className="bg-gradient-to-br from-rose-600/90 to-rose-900/90 rounded-lg p-4 shadow-lg">
            <h3 className="text-rose-100 mb-1 text-base font-medium">En Düşük</h3>
            <p className="text-3xl font-bold text-white">{stats.lowestScore}</p>
            <p className="text-sm text-rose-100 mt-1">
              {((stats.lowestScore / 100) * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 h-[calc(100vh-8.5rem)]">
          {/* Puan Dağılımı */}
          <div className="bg-gray-900/50 backdrop-blur rounded-lg p-3 shadow-lg">
            <h2 className="text-lg font-bold mb-2 text-center text-gray-100">Puan Dağılımı</h2>
            <div className="h-[calc(100%-2.5rem)]">
              <Bar
                data={{
                  labels: stats.scoreDistribution.map(d => d.range),
                  datasets: [
                    {
                      label: 'Öğrenci Sayısı',
                      data: stats.scoreDistribution.map(d => d.count),
                      backgroundColor: gradientColors
                    }
                  ]
                }}
                options={chartOptions}
              />
            </div>
          </div>

          {/* Soru Başarı Oranları */}
          <div className="bg-gray-900/50 backdrop-blur rounded-lg p-3 shadow-lg">
            <h2 className="text-lg font-bold mb-2 text-center text-gray-100">Soru Başarı Oranları</h2>
            <div className="h-[calc(100%-2.5rem)]">
              <Bar
                data={{
                  labels: stats.questionStats.map((_, idx) => `S${idx + 1}`),
                  datasets: [
                    {
                      label: 'Doğru',
                      data: stats.questionStats.map(q => q.correctCount),
                      backgroundColor: 'rgba(34, 197, 94, 0.8)'
                    },
                    {
                      label: 'Yanlış',
                      data: stats.questionStats.map(q => q.wrongCount),
                      backgroundColor: 'rgba(239, 68, 68, 0.8)'
                    }
                  ]
                }}
                options={chartOptions}
              />
            </div>
          </div>

          {/* Tamamlanma Oranı */}
          <div className="bg-gray-900/50 backdrop-blur rounded-lg p-3 shadow-lg">
            <h2 className="text-lg font-bold mb-2 text-center text-gray-100">Tamamlanma Oranı</h2>
            <div className="h-[calc(100%-2.5rem)] flex items-center justify-center">
              <div className="w-4/5 h-4/5">
                <Doughnut
                  data={{
                    labels: ['Tamamlandı', 'Devam Ediyor'],
                    datasets: [
                      {
                        data: [
                          stats.completedStudents,
                          stats.totalStudents - stats.completedStudents
                        ],
                        backgroundColor: [
                          'rgba(34, 197, 94, 0.8)',
                          'rgba(100, 116, 139, 0.8)'
                        ],
                        borderColor: [
                          'rgba(34, 197, 94, 1)',
                          'rgba(100, 116, 139, 1)'
                        ],
                        borderWidth: 1
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: 'white',
                          font: {
                            size: 14
                          },
                          padding: 20
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
