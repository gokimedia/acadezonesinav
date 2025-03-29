'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  BarChart3, 
  BookOpen, 
  Users, 
  Clock, 
  ArrowUpRight,
  CheckCircle,
  BookOpenCheck,
  UserRoundCheck,
  GraduationCap,
  Activity,
  ExternalLink,
  Filter
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
  AreaChart,
  Area
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
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Başlık ve Üst Kısım */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Acadezone Yönetim Paneli</h1>
            <p className="text-slate-500 mt-1">Sınav sistemini bu panel üzerinden yönetebilirsiniz</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50">
              <Filter size={16} />
              <span>Filtrele</span>
            </button>
            <Link 
              href="/panel/sinavlar/create"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <span>Yeni Sınav</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        {/* Ana İstatistikler */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 text-white rounded-lg shadow-md">
                <BookOpenCheck className="h-6 w-6" />
              </div>
              <span className="text-blue-600 text-sm font-medium bg-blue-100 px-2 py-1 rounded-full">Toplam</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-800">{stats.totalExams}</h3>
            <p className="mt-1 text-slate-600">Toplam Sınav</p>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <Link href="/panel/sinavlar" className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center">
                Tüm sınavları görüntüle <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 shadow-sm border border-emerald-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500 text-white rounded-lg shadow-md">
                <Activity className="h-6 w-6" />
              </div>
              <span className="text-emerald-600 text-sm font-medium bg-emerald-100 px-2 py-1 rounded-full">Aktif</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-800">{stats.activeExams}</h3>
            <p className="mt-1 text-slate-600">Aktif Sınav</p>
            <div className="mt-4 pt-4 border-t border-emerald-200">
              <Link href="/panel/canli-sonuclar" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center">
                Canlı sonuçları görüntüle <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 shadow-sm border border-amber-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-500 text-white rounded-lg shadow-md">
                <UserRoundCheck className="h-6 w-6" />
              </div>
              <span className="text-amber-600 text-sm font-medium bg-amber-100 px-2 py-1 rounded-full">Kayıtlı</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-800">{stats.totalStudents}</h3>
            <p className="mt-1 text-slate-600">Toplam Öğrenci</p>
            <div className="mt-4 pt-4 border-t border-amber-200">
              <Link href="/panel/ogrenciler" className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center">
                Tüm öğrencileri görüntüle <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-6 shadow-sm border border-rose-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-rose-500 text-white rounded-lg shadow-md">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="text-rose-600 text-sm font-medium bg-rose-100 px-2 py-1 rounded-full">Ortalama</span>
            </div>
            <h3 className="text-4xl font-bold text-slate-800">{stats.averageScore}</h3>
            <p className="mt-1 text-slate-600">Ortalama Puan</p>
            <div className="mt-4 pt-4 border-t border-rose-200">
              <Link href="/panel/sonuclar" className="text-rose-600 hover:text-rose-700 text-sm font-medium flex items-center">
                Tüm sonuçları görüntüle <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Grafik ve Son Sınavlar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Grafik */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Sınav Sonuç Analizi</h2>
            <p className="text-slate-500 text-sm mt-1">Son 5 sınavın ortalama sonuç değerleri</p>
          </div>
          <div className="p-6">
            {examStats.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={examStats}>
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                    <YAxis tick={{ fill: '#64748b' }} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }} 
                    />
                    <Area
                      type="monotone"
                      name="Ortalama Puan"
                      dataKey="ortalama"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorUv)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <p className="text-slate-500 text-center">
                  Henüz yeterli sınav verisi bulunmamaktadır.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Son Sınavlar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Son Sınavlar</h2>
            <p className="text-slate-500 text-sm mt-1">En son oluşturulan 4 sınav</p>
          </div>
          
          <div className="divide-y divide-slate-100">
            {recentExams.length > 0 ? (
              recentExams.map((exam) => (
                <div key={exam.id} className="p-4 hover:bg-slate-50">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-slate-800 truncate">{exam.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${exam.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                      {exam.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="flex items-center gap-x-6 text-sm text-slate-500 mt-2">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-slate-400" />
                      <span>{formatDate(exam.date)}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1 text-slate-400" />
                      <span>{exam.studentCount} öğrenci</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Link 
                      href={`/panel/sinavlar/${exam.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      Detayları Görüntüle
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500">
                Henüz sınav oluşturulmamış.
              </div>
            )}
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <Link 
              href="/panel/sinavlar"
              className="w-full flex justify-center items-center text-sm text-slate-700 font-medium hover:text-slate-900"
            >
              Tüm Sınavları Görüntüle
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}