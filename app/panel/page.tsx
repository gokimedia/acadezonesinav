'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { BarChart3, BookOpen, Users } from 'lucide-react';
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

export default function PanelPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalExams: 0,
    activeExams: 0,
    totalStudents: 0,
    averageScore: 0,
  });
  const [examStats, setExamStats] = useState<ExamStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
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
      } catch (error) {
        console.error('İstatistikler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const handleLogout = async () => {
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Yönetici Paneli</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-6 p-6">
            <h1 className="text-2xl font-semibold text-gray-900">Yönetici Paneli</h1>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <div className="flex items-center space-x-4 p-6">
                  <div className="rounded-full bg-primary-50 p-3">
                    <BookOpen className="h-6 w-6 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Toplam Sınav</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalExams}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center space-x-4 p-6">
                  <div className="rounded-full bg-success-50 p-3">
                    <BookOpen className="h-6 w-6 text-success-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Aktif Sınav</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.activeExams}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center space-x-4 p-6">
                  <div className="rounded-full bg-warning-50 p-3">
                    <Users className="h-6 w-6 text-warning-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Toplam Öğrenci</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center space-x-4 p-6">
                  <div className="rounded-full bg-error-50 p-3">
                    <BarChart3 className="h-6 w-6 text-error-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ortalama Puan</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.averageScore}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Son 5 Sınavın Ortalamaları
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={examStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="ortalama"
                        name="Ortalama Puan"
                        fill="#004E8C"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
