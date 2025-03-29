'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Tooltip } from 'react-tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  BarChart3,
  Users,
  Award,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  User,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  PieChart,
  Timer,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Title,
  ChartTooltip,
  Legend
);

// Define types
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
  exam_duration?: number;
  department?: string;
  passing_grade?: number;
};

type QuestionResult = {
  question_id: string;
  question_text: string;
  total_answers: number;
  correct_answers: number;
  wrong_answers: number;
  questionNumber?: number;
  errorRate?: number;
  successRate?: number;
};

type StudentProgress = {
  student_id: string;
  name: string;
  surname: string;
  answered_questions: number;
  correct_answers: number;
  score: number | null;
  completion_time?: number;
};

export default function LiveResultsClient({ examId }: Props) {
  const supabaseClient = createClientComponentClient();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<{ts: number, type: string}[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | '15' | '5'>('all');
  const [showRealTimeIndicator, setShowRealTimeIndicator] = useState(false);
  
  // Refs for tracking updates
  const lastUpdateRef = useRef<number>(Date.now());

  // Chart data
  const [chartData, setChartData] = useState<{
    questionSuccess: any | null;
    completionRate: any | null;
    scoreDistribution: any | null;
  }>({
    questionSuccess: null,
    completionRate: null,
    scoreDistribution: null,
  });

  // Determine if we've had a recent update (within last 5 seconds)
  useEffect(() => {
    if (showRealTimeIndicator) {
      const timer = setTimeout(() => {
        setShowRealTimeIndicator(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showRealTimeIndicator]);

  // Initialize dashboard and set up realtime listeners
  useEffect(() => {
    let mounted = true;

    const fetchData = async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        }
        
        // Fetch exam, results, and answers data in parallel
        const [examResponse, resultsResponse, answersResponse, studentsResponse] = await Promise.all([
          supabaseClient
            .from('exams')
            .select(`
              *,
              questions (
                id,
                question_text,
                question_type,
                correct_answer,
                points
              ),
              departments (name)
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
            .eq('exam_id', examId),
          supabaseClient
            .from('exam_students')
            .select(`
              id, 
              student_id, 
              created_at,
              students (
                name,
                surname
              )
            `)
            .eq('exam_id', examId)
        ]);

        if (!mounted) return;

        if (examResponse.error) throw examResponse.error;
        if (resultsResponse.error) throw resultsResponse.error;
        if (answersResponse.error) throw answersResponse.error;
        if (studentsResponse.error) throw studentsResponse.error;

        // Update dashboard data
        updateStats(
          examResponse.data, 
          resultsResponse.data, 
          answersResponse.data,
          studentsResponse.data
        );
        
        // If this was a user-initiated refresh, show success
        if (showRefresh) {
          setLatestUpdates(prev => [{ts: Date.now(), type: 'refresh'}, ...prev.slice(0, 4)]);
        }

      } catch (err: any) {
        console.error('Error fetching data:', err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchData();

    // Set up realtime subscriptions for live updates
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
        (payload) => {
          console.log('Results change received:', payload);
          lastUpdateRef.current = Date.now();
          setShowRealTimeIndicator(true);
          setLatestUpdates(prev => [{ts: Date.now(), type: 'results'}, ...prev.slice(0, 4)]);
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
        (payload) => {
          console.log('Answers change received:', payload);
          lastUpdateRef.current = Date.now();
          setShowRealTimeIndicator(true);
          setLatestUpdates(prev => [{ts: Date.now(), type: 'answers'}, ...prev.slice(0, 4)]);
          fetchData();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      mounted = false;
      resultsChannel.unsubscribe();
      answersChannel.unsubscribe();
    };
  }, [examId]);

  // Process and update dashboard statistics
  const updateStats = (examInfo: any, resultsData: any[], answersData: any[], studentsData: any[]) => {
    // Calculate exam results
    const totalStudents = studentsData?.length || 0;
    const studentsStarted = resultsData?.length || 0;
    const scores = resultsData?.map(r => r.score || 0) || [];
    const validScores = scores.filter(s => s > 0);
    
    const averageScore = validScores.length > 0 
      ? validScores.reduce((a, b) => a + b, 0) / validScores.length 
      : 0;
      
    const highestScore = validScores.length > 0 ? Math.max(...validScores) : 0;
    const lowestScore = validScores.length > 0 ? Math.min(...validScores) : 0;

    // Set exam result data
    setExamResult({
      exam_id: examId,
      exam_title: examInfo.title,
      total_students: totalStudents,
      students_started: studentsStarted,
      average_score: averageScore,
      highest_score: highestScore,
      lowest_score: lowestScore,
      exam_duration: examInfo.duration,
      department: examInfo.departments?.name,
      passing_grade: examInfo.passing_grade
    });

    // Calculate per-question statistics
    const questionStats = examInfo?.questions?.map((q: any, index: number) => {
      const questionAnswers = answersData?.filter((a: any) => a.question_id === q.id) || [];
      const correctAnswers = questionAnswers.filter((a: any) => a.is_correct).length;
      const wrongAnswers = questionAnswers.length - correctAnswers;
      
      return {
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        total_answers: questionAnswers.length,
        correct_answers: correctAnswers,
        wrong_answers: wrongAnswers,
        questionNumber: index + 1,
        successRate: questionAnswers.length > 0 
          ? (correctAnswers / questionAnswers.length) * 100 
          : 0,
        errorRate: questionAnswers.length > 0 
          ? (wrongAnswers / questionAnswers.length) * 100
          : 0
      };
    }) || [];

    setQuestionResults(questionStats);

    // Calculate student progress data
    const studentStats = resultsData?.map(result => ({
      student_id: result.student_id,
      name: result.students?.name || 'Unknown',
      surname: result.students?.surname || 'User',
      answered_questions: result.total_questions || 0,
      correct_answers: result.correct_count || 0,
      score: result.score,
      completion_time: new Date(result.created_at).getTime()
    })) || [];

    setStudentProgress(studentStats);

    // Prepare chart data
    // 1. Question success rate chart
    const questionSuccessData = {
      labels: questionStats.map((q: any) => `S${q.questionNumber}`),
      datasets: [
        {
          label: 'Doğru',
          data: questionStats.map((q: any) => q.correct_answers),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
          borderRadius: 4,
          categoryPercentage: 0.7,
          barPercentage: 0.8,
        },
        {
          label: 'Yanlış',
          data: questionStats.map((q: any) => q.wrong_answers),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1,
          borderRadius: 4,
          categoryPercentage: 0.7,
          barPercentage: 0.8,
        },
      ],
    };

    // 2. Completion rate chart
    const completionData = {
      labels: ['Tamamlandı', 'Devam Ediyor'],
      datasets: [{
        data: [
          studentsStarted,
          Math.max(0, totalStudents - studentsStarted)
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', 
          'rgba(99, 102, 241, 0.8)'
        ],
        borderColor: [
          'rgb(16, 185, 129)', 
          'rgb(99, 102, 241)'
        ],
        borderWidth: 1,
        hoverOffset: 4,
      }],
    };

    // 3. Score distribution chart
    const scoreRanges = [
      { min: 0, max: 20, label: '0-20' },
      { min: 20, max: 40, label: '20-40' },
      { min: 40, max: 60, label: '40-60' },
      { min: 60, max: 80, label: '60-80' },
      { min: 80, max: 100, label: '80-100' },
    ];

    const scoreDistribution = scoreRanges.map(range => {
      return scores.filter(score => score >= range.min && score < range.max).length;
    });

    const scoreDistributionData = {
      labels: scoreRanges.map(r => r.label),
      datasets: [{
        label: 'Öğrenci Sayısı',
        data: scoreDistribution,
        backgroundColor: 'rgba(251, 146, 60, 0.8)',
        borderColor: 'rgb(251, 146, 60)',
        borderWidth: 1,
        borderRadius: 4,
        categoryPercentage: 0.7,
        barPercentage: 0.8,
      }]
    };

    // Update all chart data
    setChartData({
      questionSuccess: questionSuccessData,
      completionRate: completionData,
      scoreDistribution: scoreDistributionData
    });
  };

  // Chart configuration
  const chartOptions = {
    questionSuccess: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.06)',
            drawBorder: false,
            drawTicks: false,
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.65)',
            font: {
              size: 10
            },
            padding: 8,
            maxTicksLimit: 5,
          },
          stacked: true,
        },
        x: {
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.65)',
            font: {
              size: 10
            },
            padding: 8
          },
          stacked: true,
        },
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            boxWidth: 12,
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
            font: {
              size: 11
            }
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: 'rgba(255, 255, 255, 0.8)',
          padding: 12,
          cornerRadius: 8,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function(context: any) {
              const label = context.dataset.label || '';
              const value = context.parsed.y || 0;
              const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return `${label}: ${value} (%${percentage})`;
            }
          }
        }
      },
      animation: {
        duration: 1000,
      }
    },
    completionRate: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            boxWidth: 12,
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
            font: {
              size: 11
            }
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: 'rgba(255, 255, 255, 0.8)',
          padding: 12,
          cornerRadius: 8,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function(context: any) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
              return `${label}: ${value} (%${percentage})`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
      }
    },
    scoreDistribution: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.06)',
            drawBorder: false,
            drawTicks: false,
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.65)',
            font: {
              size: 10
            },
            padding: 8,
            maxTicksLimit: 5,
          },
        },
        x: {
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.65)',
            font: {
              size: 10
            },
            padding: 8
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: 'rgba(255, 255, 255, 0.8)',
          padding: 12,
          cornerRadius: 8,
          boxPadding: 6
        }
      },
      animation: {
        duration: 1000,
      }
    }
  };

  // Derived metrics for the dashboard
  const dashboardMetrics = useMemo(() => {
    const totalAnswers = questionResults.reduce((sum, q) => sum + q.total_answers, 0);
    const correctAnswers = questionResults.reduce((sum, q) => sum + q.correct_answers, 0);
    const passingGrade = examResult?.passing_grade || 60;
    const studentsAbovePassingGrade = studentProgress.filter(s => 
      s.score !== null && s.score >= passingGrade
    ).length;
    
    // En yüksek puan alan öğrenciyi bul
    const topStudent: {name: string; surname: string; score: number} = { 
      name: '', 
      surname: '', 
      score: 0 
    };
    
    if (studentProgress.length > 0) {
      const validStudents = studentProgress.filter(s => s.score !== null);
      if (validStudents.length > 0) {
        const topScoreStudent = validStudents.reduce((prev, current) => {
          return (prev.score || 0) > (current.score || 0) ? prev : current;
        });
        
        if (topScoreStudent) {
          topStudent.name = topScoreStudent.name;
          topStudent.surname = topScoreStudent.surname;
          topStudent.score = topScoreStudent.score || 0;
        }
      }
    }
    
    return {
      totalAnswers,
      correctAnswers,
      wrongAnswers: totalAnswers - correctAnswers,
      correctAnswerPercentage: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
      passingCount: studentsAbovePassingGrade,
      passingPercentage: studentProgress.length > 0 
        ? (studentsAbovePassingGrade / studentProgress.length) * 100 
        : 0,
      topStudent
    };
  }, [questionResults, studentProgress, examResult]);

  // Most difficult questions
  const mostDifficultQuestions = useMemo(() => {
    return [...questionResults]
      .filter(q => q.total_answers > 0)
      .sort((a, b) => b.errorRate! - a.errorRate!)
      .slice(0, 3);
  }, [questionResults]);

  // Get a human-readable time difference string
  const getTimeDiffString = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    
    if (diff < 1000) return 'şimdi';
    if (diff < 60000) return `${Math.floor(diff / 1000)} sn önce`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`;
    return `${Math.floor(diff / 3600000)} sa önce`;
  };
  
  // Handle manual refresh
  const handleRefresh = () => {
    // Don't allow rapid refreshes
    if (refreshing) return;
    
    const refreshData = async () => {
      try {
        setRefreshing(true);
        
        const [examResponse, resultsResponse, answersResponse, studentsResponse] = await Promise.all([
          supabaseClient
            .from('exams')
            .select(`
              *,
              questions (
                id,
                question_text,
                question_type,
                correct_answer,
                points
              ),
              departments (name)
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
            .eq('exam_id', examId),
          supabaseClient
            .from('exam_students')
            .select(`
              id, 
              student_id, 
              created_at,
              students (
                name,
                surname
              )
            `)
            .eq('exam_id', examId)
        ]);
        
        if (examResponse.error) throw examResponse.error;
        if (resultsResponse.error) throw resultsResponse.error;
        if (answersResponse.error) throw answersResponse.error;
        if (studentsResponse.error) throw studentsResponse.error;
        
        updateStats(
          examResponse.data, 
          resultsResponse.data, 
          answersResponse.data,
          studentsResponse.data
        );
        
        setLatestUpdates(prev => [{ts: Date.now(), type: 'refresh'}, ...prev.slice(0, 4)]);
        
      } catch (err: any) {
        console.error('Error refreshing data:', err);
        setError('Veri yenilenemedi. Lütfen tekrar deneyin.');
      } finally {
        setRefreshing(false);
      }
    };
    
    refreshData();
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6 max-w-sm mx-auto">
          <Loader2 size={42} className="text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Sınav Sonuçları Yükleniyor</h2>
          <p className="text-gray-400">
            Sonuçlar ve istatistikler hesaplanıyor, lütfen bekleyin...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl max-w-lg w-full p-6">
          <div className="flex items-start gap-4">
            <div className="bg-red-500/20 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Veri Yüklenemedi</h2>
              <p className="text-gray-300 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                <span>Tekrar Dene</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c111d] text-gray-100">
      {/* Header with exam info */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-blue-400" />
                <h1 className="text-xl font-bold text-white">{examResult?.exam_title}</h1>
                
                {showRealTimeIndicator && (
                  <span className="flex items-center gap-1.5 bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded-full text-xs font-medium ml-2 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span>Canlı</span>
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center text-sm text-gray-400 mt-0.5 gap-x-4">
                {examResult?.department && (
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>{examResult.department}</span>
                  </div>
                )}
                
                {examResult?.exam_duration && (
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{examResult.exam_duration} dakika</span>
                  </div>
                )}
                
                {examResult?.passing_grade && (
                  <div className="flex items-center gap-1">
                    <Award size={14} />
                    <span>Geçme notu: {examResult.passing_grade}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Updates indicator */}
              {latestUpdates.length > 0 && (
                <div className="text-xs text-gray-400">
                  <div className="flex items-center mb-1">
                    <Zap size={14} className="text-amber-400 mr-1.5" />
                    <span>Son güncelleme: {getTimeDiffString(latestUpdates[0].ts)}</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  refreshing 
                    ? 'bg-blue-700/40 text-blue-300 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {refreshing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Yenileniyor...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Yenile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Key metrics cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-gradient-to-br from-indigo-800/50 to-indigo-900/70 rounded-xl p-5 shadow-lg border border-indigo-700/40 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full"></div>
            <div className="flex items-start justify-between mb-3">
              <Users size={22} className="text-indigo-300" />
              <div className="text-xs bg-indigo-500/20 rounded-md px-2 py-1 text-indigo-300">
                {Math.round(examResult?.students_started! / Math.max(examResult?.total_students!, 1) * 100)}% Katılım
              </div>
            </div>
            <p className="text-sm text-indigo-300 mb-1">Sınava Giren</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-white">{examResult?.students_started || 0}</p>
              <p className="text-sm text-indigo-400 mb-1">/ {examResult?.total_students || 0}</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-gradient-to-br from-emerald-800/50 to-emerald-900/70 rounded-xl p-5 shadow-lg border border-emerald-700/40 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full"></div>
            <div className="flex items-start justify-between mb-3">
              <BarChart3 size={22} className="text-emerald-300" />
              <div className="text-xs bg-emerald-500/20 rounded-md px-2 py-1 text-emerald-300">
                {examResult?.passing_grade && `${dashboardMetrics.passingPercentage.toFixed(1)}% Başarı`}
              </div>
            </div>
            <p className="text-sm text-emerald-300 mb-1">Ortalama Puan</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-white">
                {examResult?.average_score ? examResult.average_score.toFixed(1) : '0.0'}
              </p>
              <p className="text-sm text-emerald-400 mb-1">/ 100</p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-gradient-to-br from-amber-800/50 to-amber-900/70 rounded-xl p-5 shadow-lg border border-amber-700/40 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full"></div>
            <div className="flex items-start justify-between mb-3">
              <TrendingUp size={22} className="text-amber-300" />
              {examResult?.highest_score !== examResult?.average_score && (
                <div className="text-xs bg-amber-500/20 rounded-md px-2 py-1 text-amber-300">
                  <ArrowUpRight size={12} className="inline mr-1" />
                  {(examResult?.highest_score! - examResult?.average_score!).toFixed(1)} puan
                </div>
              )}
            </div>
            <p className="text-sm text-amber-300 mb-1">En Yüksek Puan</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-white">{examResult?.highest_score || 0}</p>
              <p className="text-sm text-amber-400 mb-1">/ 100</p>
            </div>
            {dashboardMetrics.topStudent.name && (
              <div className="mt-2 text-center bg-amber-500/10 rounded-lg py-1 px-2">
                <p className="text-sm text-amber-300 font-medium truncate">
                  {dashboardMetrics.topStudent.name} {dashboardMetrics.topStudent.surname}
                </p>
              </div>
            )}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-gradient-to-br from-rose-800/50 to-rose-900/70 rounded-xl p-5 shadow-lg border border-rose-700/40 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-bl-full"></div>
            <div className="flex items-start justify-between mb-3">
              <TrendingDown size={22} className="text-rose-300" />
              {examResult?.lowest_score !== examResult?.average_score && (
                <div className="text-xs bg-rose-500/20 rounded-md px-2 py-1 text-rose-300">
                  <ArrowDownRight size={12} className="inline mr-1" />
                  {(examResult?.average_score! - examResult?.lowest_score!).toFixed(1)} puan
                </div>
              )}
            </div>
            <p className="text-sm text-rose-300 mb-1">En Düşük Puan</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-white">{examResult?.lowest_score || 0}</p>
              <p className="text-sm text-rose-400 mb-1">/ 100</p>
            </div>
          </motion.div>
        </div>

        {/* Main charts and analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column - Question analytics */}
          <div className="lg:col-span-8 space-y-6">
            {/* Participation stats */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden shadow-lg"
            >
              <div className="border-b border-gray-700/50 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-400" />
                  <h2 className="font-medium text-gray-200">Soru İstatistikleri</h2>
                </div>
                
                <div className="flex items-center text-xs gap-2 bg-gray-700/50 rounded-lg p-1">
                  <button
                    className={`px-2.5 py-1 rounded-md ${
                      selectedTimeRange === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white/80 hover:bg-slate-600'
                    }`}
                    onClick={() => setSelectedTimeRange('all')}
                  >
                    Tümü
                  </button>
                  <button
                    className={`px-2.5 py-1 rounded-md ${
                      selectedTimeRange === '15' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white/80 hover:bg-slate-600'
                    }`}
                    onClick={() => setSelectedTimeRange('15')}
                  >
                    15 dk
                  </button>
                  <button
                    className={`px-2.5 py-1 rounded-md ${
                      selectedTimeRange === '5' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white/80 hover:bg-slate-600'
                    }`}
                    onClick={() => setSelectedTimeRange('5')}
                  >
                    5 dk
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                {/* Summary metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-gray-600/50 p-2 rounded-md">
                        <PieChart size={16} className="text-blue-400" />
                      </div>
                      <span className="text-sm text-gray-300">Toplam Cevap</span>
                    </div>
                    <p className="text-xl font-semibold text-white">{dashboardMetrics.totalAnswers}</p>
                  </div>
                  
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-emerald-900/50 p-2 rounded-md">
                        <CheckCircle size={16} className="text-emerald-400" />
                      </div>
                      <span className="text-sm text-gray-300">Doğru Cevaplar</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-semibold text-emerald-400">{dashboardMetrics.correctAnswers}</p>
                      <span className="text-gray-400 text-sm">
                        (%{dashboardMetrics.correctAnswerPercentage.toFixed(1)})
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-rose-900/50 p-2 rounded-md">
                        <XCircle size={16} className="text-rose-400" />
                      </div>
                      <span className="text-sm text-gray-300">Yanlış Cevaplar</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-semibold text-rose-400">{dashboardMetrics.wrongAnswers}</p>
                      <span className="text-gray-400 text-sm">
                        (%{(100 - dashboardMetrics.correctAnswerPercentage).toFixed(1)})
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Question success chart */}
                <div className="bg-gray-900/60 rounded-xl p-4 h-[280px]">
                  {chartData.questionSuccess ? (
                    <Bar 
                      data={chartData.questionSuccess} 
                      options={chartOptions.questionSuccess}
                      height={250}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">Henüz veri yok</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Score distribution */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden shadow-lg"
            >
              <div className="border-b border-gray-700/50 p-4">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-amber-400" />
                  <h2 className="font-medium text-gray-200">Puan Dağılımı</h2>
                </div>
              </div>
              
              <div className="p-4">
                {/* Score distribution metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-amber-900/50 p-2 rounded-md">
                        <Award size={16} className="text-amber-400" />
                      </div>
                      <span className="text-sm text-gray-300">Ortalama Puan</span>
                    </div>
                    <p className="text-xl font-semibold text-white">{examResult?.average_score.toFixed(1)}</p>
                  </div>
                  
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-gray-600/50 p-2 rounded-md">
                        <Users size={16} className="text-blue-400" />
                      </div>
                      <span className="text-sm text-gray-300">Değerlendirilen</span>
                    </div>
                    <p className="text-xl font-semibold text-white">{examResult?.students_started} öğrenci</p>
                  </div>
                  
                  <div className="bg-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="bg-emerald-900/50 p-2 rounded-md">
                        <CheckCircle size={16} className="text-emerald-400" />
                      </div>
                      <span className="text-sm text-gray-300">Geçenler</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-semibold text-emerald-400">{dashboardMetrics.passingCount}</p>
                      <span className="text-gray-400 text-sm">
                        öğrenci (%{dashboardMetrics.passingPercentage.toFixed(1)})
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Score distribution chart */}
                <div className="bg-gray-900/60 rounded-xl p-4 h-[200px]">
                  {chartData.scoreDistribution ? (
                    <Bar 
                      data={chartData.scoreDistribution} 
                      options={chartOptions.scoreDistribution}
                      height={180}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">Henüz veri yok</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right column - Completion and student metrics */}
          <div className="lg:col-span-4 space-y-6">
            {/* Completion status */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden shadow-lg"
            >
              <div className="border-b border-gray-700/50 p-4">
                <div className="flex items-center gap-2">
                  <Timer size={18} className="text-purple-400" />
                  <h2 className="font-medium text-gray-200">Tamamlanma Durumu</h2>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Tamamlama Oranı</p>
                    <p className="text-3xl font-bold text-white">
                      %{Math.round(examResult?.students_started! / Math.max(examResult?.total_students!, 1) * 100)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-1">Kalan Öğrenciler</p>
                    <p className="text-xl font-semibold text-indigo-400">
                      {Math.max(0, (examResult?.total_students || 0) - (examResult?.students_started || 0))}
                    </p>
                  </div>
                </div>
                
                <div className="h-[200px]">
                  {chartData.completionRate ? (
                    <Doughnut 
                      data={chartData.completionRate} 
                      options={chartOptions.completionRate} 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">Henüz veri yok</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Most difficult questions */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden shadow-lg"
            >
              <div className="border-b border-gray-700/50 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-400" />
                  <h2 className="font-medium text-gray-200">Zorlu Sorular</h2>
                </div>
              </div>
              
              <div className="p-2">
                {mostDifficultQuestions.length > 0 ? (
                  <div className="divide-y divide-gray-700/30">
                    {mostDifficultQuestions.map((question, index) => (
                      <div key={question.question_id} className="p-3 hover:bg-gray-700/20 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="bg-amber-900/50 text-amber-300 text-xs font-medium px-2 py-0.5 rounded-md">
                                Soru {question.questionNumber}
                              </span>
                              <span className="bg-rose-900/30 text-rose-300 text-xs font-medium px-2 py-0.5 rounded-md">
                                %{question.errorRate!.toFixed(1)} Hata
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 line-clamp-2" 
                              data-tooltip-id={`question-${question.questionNumber}`}
                              data-tooltip-content={question.question_text}
                            >
                              {question.question_text}
                            </p>
                            <Tooltip id={`question-${question.questionNumber}`} place="bottom" className="max-w-xs bg-gray-900/95 border border-gray-700" />
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div className="bg-gray-900/60 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-400 mb-0.5">Toplam</p>
                            <p className="text-sm font-medium text-white">{question.total_answers}</p>
                          </div>
                          <div className="bg-emerald-900/30 rounded-lg p-2 text-center">
                            <p className="text-xs text-emerald-400/80 mb-0.5">Doğru</p>
                            <p className="text-sm font-medium text-emerald-400">{question.correct_answers}</p>
                          </div>
                          <div className="bg-rose-900/30 rounded-lg p-2 text-center">
                            <p className="text-xs text-rose-400/80 mb-0.5">Yanlış</p>
                            <p className="text-sm font-medium text-rose-400">{question.wrong_answers}</p>
                          </div>
                        </div>

                        {/* Progress bars */}
                        <div className="mt-2 space-y-1.5">
                          {/* Success rate */}
                          <div>
                            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                              <span>Başarı Oranı</span>
                              <span>%{question.successRate!.toFixed(1)}</span>
                            </div>
                            <div className="mt-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${question.successRate}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* Error rate */}
                          <div>
                            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                              <span>Hata Oranı</span>
                              <span>%{question.errorRate!.toFixed(1)}</span>
                            </div>
                            <div className="mt-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-500"
                                style={{ width: `${question.errorRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <AlertCircle size={30} className="text-gray-500 mb-2" />
                    <p className="text-gray-400">Henüz yeterli veri yok</p>
                    <p className="text-xs text-gray-500 mt-1">Öğrenci cevapları bekliyor...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Recent student activity */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.9 }}
          className="mt-6 bg-gray-800 rounded-xl border border-gray-700/50 overflow-hidden shadow-lg"
        >
          <div className="border-b border-gray-700/50 p-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-400" />
              <h2 className="font-medium text-gray-200">Öğrenci Sonuçları</h2>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700/50">
              <thead className="bg-gray-800/80">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Öğrenci
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Doğru
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Yanlış
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Puan
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/30">
                {studentProgress.length > 0 ? (
                  studentProgress.map((student) => {
                    const wrongAnswers = student.answered_questions - student.correct_answers;
                    const passingGrade = examResult?.passing_grade || 60;
                    const isPassing = student.score !== null && student.score >= passingGrade;
                    
                    return (
                      <tr key={student.student_id} className="hover:bg-gray-700/20">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium">
                              {student.name[0]}{student.surname[0]}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-white">{student.name} {student.surname}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-emerald-400">{student.correct_answers}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-rose-400">{wrongAnswers}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{student.score?.toFixed(1) || '-'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {student.score !== null ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isPassing ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'
                            }`}>
                              {isPassing ? (
                                <>
                                  <CheckCircle size={12} className="mr-1" />
                                  Başarılı
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} className="mr-1" />
                                  Başarısız
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                              Devam Ediyor
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      Henüz öğrenci sonucu bulunmuyor
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}