'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  BarChart3, 
  BookOpen, 
  Users, 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle,
  PauseCircle,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface DashboardStats {
  totalExams: number;
  activeExams: number;
  totalStudents: number;
  averageScore: number;
}

interface ExamStats {
  name: string;
  ortalama: number;
}

interface RecentExam {
  id: string;
  title: string;
  date: string;
  isActive: boolean;
  studentCount: number;
}

export default function PanelPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalExams: 0,
    activeExams: 0,
    totalStudents: 0,
    averageScore: 0,
  });
  const [examStats, setExamStats] = useState<ExamStats[]>([]);
  const [recentExams, setRecentExams] = useState<RecentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        
        // Fetch total exams count
        const { count: totalExams, error: totalExamsError } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true });

        if (totalExamsError) throw totalExamsError;

        // Fetch active exams count
        const { count: activeExams, error: activeExamsError } = await supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        if (activeExamsError) throw activeExamsError;

        // Fetch total students count
        const { count: totalStudents, error: totalStudentsError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });

        if (totalStudentsError) throw totalStudentsError;

        // Fetch average score data from results
        const { data: resultsData, error: resultsError } = await supabase
          .from('results')
          .select('score');

        if (resultsError) throw resultsError;

        // Calculate average score
        const scores = resultsData.map(r => r.score).filter(s => s !== null) as number[];
        const averageScore = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

        // Update stats state
        setStats({
          totalExams: totalExams || 0,
          activeExams: activeExams || 0,
          totalStudents: totalStudents || 0,
          averageScore: averageScore,
        });

        // Fetch exam statistics for the chart
        const { data: exams, error: examsError } = await supabase
          .from('exams')
          .select(`
            id,
            title
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (examsError) throw examsError;

        // Create array to hold exam stats
        const examStatsData: ExamStats[] = [];

        // For each exam, fetch its average score
        for (const exam of exams || []) {
          const { data: examResults, error: examResultsError } = await supabase
            .from('results')
            .select('score')
            .eq('exam_id', exam.id);

          if (examResultsError) throw examResultsError;

          const examScores = examResults.map(r => r.score).filter(s => s !== null) as number[];
          const examAverage = examScores.length > 0
            ? Math.round(examScores.reduce((a, b) => a + b, 0) / examScores.length)
            : 0;

          examStatsData.push({
            name: exam.title,
            ortalama: examAverage
          });
        }

        setExamStats(examStatsData.reverse()); // Show older exams first

        // Fetch recent exams with student counts
        const { data: recentExamsData, error: recentExamsError } = await supabase
          .from('exams')
          .select(`
            id,
            title,
            is_active,
            start_date
          `)
          .order('created_at', { ascending: false })
          .limit(4);

        if (recentExamsError) throw recentExamsError;

        const recentExamsWithCounts: RecentExam[] = [];

        for (const exam of recentExamsData || []) {
          // Get student count for this exam
          const { count: studentCount, error: studentCountError } = await supabase
            .from('exam_students')
            .select('*', { count: 'exact', head: true })
            .eq('exam_id', exam.id);

          if (studentCountError) throw studentCountError;

          recentExamsWithCounts.push({
            id: exam.id,
            title: exam.title,
            date: exam.start_date || '',
            isActive: exam.is_active,
            studentCount: studentCount || 0
          });
        }

        setRecentExams(recentExamsWithCounts);
      } catch (err) {
        console.error('İstatistikler yüklenirken hata:', err);
        setError('Veriler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Tarih formatını düzenleyen yardımcı fonksiyon
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="space-y-8">
      {/* Sayfa Başlığı */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Yönetim Paneli</h1>
        <Link 
          href="/panel/sinavlar/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <span>Yeni Sınav Oluştur</span>
        </Link>
      </div>

      {/* Ana İstatistikler */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Toplam Sınav</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalExams}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Sistemdeki toplam sınav sayısı
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Aktif Sınav</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeExams}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Şu anda aktif olan sınav sayısı
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Toplam Öğrenci</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Kayıtlı öğrenci sayısı
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ortalama Puan</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.averageScore}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Tüm sınavların ortalama puanı
            </div>
          </div>
        </div>
      </div>

      {/* Grafik ve Son Sınavlar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Grafik */}
        <div className="lg:col-span-2 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Son Sınavların Ortalamaları
            </h2>
          </div>
          <div className="p-6">
            {examStats.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={examStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                    <YAxis tick={{ fill: '#6b7280' }} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
                      }} 
                    />
                    <Bar
                      name="Ortalama Puan"
                      dataKey="ortalama"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  Henüz yeterli sınav verisi bulunmamaktadır.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Son Sınavlar */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Son Sınavlar</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentExams.length > 0 ? (
              recentExams.map((exam) => (
                <div key={exam.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {exam.title}
                      </h3>
                      <div className="mt-1 flex items-center">
                        <span className="text-xs text-gray-500 mr-3">
                          {formatDate(exam.date)}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Users size={12} className="mr-1" />{exam.studentCount} öğrenci
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                      {exam.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={12} className="mr-1" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <PauseCircle size={12} className="mr-1" />
                          Pasif
                        </span>
                      )}
                      <Link
                        href={`/exam-edit/${exam.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                Henüz sınav bulunmamaktadır.
              </div>
            )}
          </div>
          {recentExams.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <Link
                href="/panel/sinavlar"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex justify-center"
              >
                Tüm Sınavları Görüntüle
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}