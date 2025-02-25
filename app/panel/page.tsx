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
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        // Gerçek uygulamada bu verileri Supabase'den çekebilirsiniz
        // Mock stats data
        setStats({
          totalExams: 5,
          activeExams: 3,
          totalStudents: 100,
          averageScore: 70,
        });

        // Mock exam stats data
        setExamStats([
          { name: 'Sınav 1', ortalama: 80 },
          { name: 'Sınav 2', ortalama: 75 },
          { name: 'Sınav 3', ortalama: 90 },
          { name: 'Sınav 4', ortalama: 85 },
          { name: 'Sınav 5', ortalama: 95 },
        ]);

        // Mock recent exams
        setRecentExams([
          { id: '1', title: 'Web Programlama Final', date: '2023-06-15', isActive: true, studentCount: 42 },
          { id: '2', title: 'Veri Yapıları Vize', date: '2023-06-10', isActive: true, studentCount: 38 },
          { id: '3', title: 'Algoritma Analizi', date: '2023-06-05', isActive: false, studentCount: 45 },
          { id: '4', title: 'İşletim Sistemleri', date: '2023-06-01', isActive: false, studentCount: 35 },
        ]);
      } catch (error) {
        console.error('İstatistikler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
      </div>
    );
  }

  // Tarih formatını düzenleyen yardımcı fonksiyon
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-8">
      {/* Sayfa Başlığı */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
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
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 flex items-center font-medium">
                <ArrowUp className="h-4 w-4 mr-1" />
                12%
              </span>
              <span className="text-gray-500 ml-2">Son aydan beri</span>
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
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">Güncel durum</span>
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
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 flex items-center font-medium">
                <ArrowUp className="h-4 w-4 mr-1" />
                18%
              </span>
              <span className="text-gray-500 ml-2">Son aydan beri</span>
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
            <div className="mt-4 flex items-center text-sm">
              <span className="text-red-600 flex items-center font-medium">
                <ArrowDown className="h-4 w-4 mr-1" />
                3%
              </span>
              <span className="text-gray-500 ml-2">Son aydan beri</span>
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
              Son 5 Sınavın Ortalamaları
            </h2>
          </div>
          <div className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                  <YAxis tick={{ fill: '#6b7280' }} />
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
          </div>
        </div>

        {/* Son Sınavlar */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Son Sınavlar</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentExams.map((exam) => (
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
                      href={`/panel/sinavlar/${exam.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <Link
              href="/panel/sinavlar"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex justify-center"
            >
              Tüm Sınavları Görüntüle
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}