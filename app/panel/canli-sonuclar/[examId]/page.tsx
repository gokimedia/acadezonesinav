'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface ExamStats {
  totalStudents: number
  activeStudents: number
  averageScore: number
  correctPercentage: number
  wrongPercentage: number
  scoreDistribution: any[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function LiveResults() {
  const { examId } = useParams()
  const [examData, setExamData] = useState<any>(null)
  const [stats, setStats] = useState<ExamStats>({
    totalStudents: 0,
    activeStudents: 0,
    averageScore: 0,
    correctPercentage: 0,
    wrongPercentage: 0,
    scoreDistribution: []
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchExamData()
    subscribeToChanges()
  }, [examId])

  const fetchExamData = async () => {
    try {
      // Sınav bilgilerini al
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select(`
          *,
          departments (
            name
          )
        `)
        .eq('id', examId)
        .single()

      if (examError) throw examError
      setExamData(exam)

      // İstatistikleri güncelle
      await updateStats()
    } catch (err) {
      console.error('Veri yüklenirken hata:', err)
      setError('Veriler yüklenirken bir hata oluştu')
    }
  }

  const updateStats = async () => {
    try {
      // Toplam öğrenci sayısı
      const { count: totalStudents } = await supabase
        .from('exam_students')
        .select('*', { count: 'exact' })
        .eq('exam_id', examId)

      // Aktif öğrenci sayısı (en az bir soruyu cevaplayan)
      const { count: activeStudents } = await supabase
        .from('answers')
        .select('student_id', { count: 'exact', distinct: true })
        .eq('exam_id', examId)

      // Doğru/Yanlış oranları
      const { data: answers } = await supabase
        .from('answers')
        .select('is_correct')
        .eq('exam_id', examId)

      const correctAnswers = answers?.filter(a => a.is_correct).length || 0
      const totalAnswers = answers?.length || 0

      const correctPercentage = totalAnswers ? (correctAnswers / totalAnswers) * 100 : 0
      const wrongPercentage = totalAnswers ? ((totalAnswers - correctAnswers) / totalAnswers) * 100 : 0

      // Puan dağılımı
      const { data: results } = await supabase
        .from('results')
        .select('score')
        .eq('exam_id', examId)

      const scoreDistribution = [
        { name: '0-20', count: 0 },
        { name: '21-40', count: 0 },
        { name: '41-60', count: 0 },
        { name: '61-80', count: 0 },
        { name: '81-100', count: 0 }
      ]

      results?.forEach(result => {
        if (result.score <= 20) scoreDistribution[0].count++
        else if (result.score <= 40) scoreDistribution[1].count++
        else if (result.score <= 60) scoreDistribution[2].count++
        else if (result.score <= 80) scoreDistribution[3].count++
        else scoreDistribution[4].count++
      })

      const averageScore = results?.length
        ? results.reduce((acc, curr) => acc + curr.score, 0) / results.length
        : 0

      setStats({
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        averageScore,
        correctPercentage,
        wrongPercentage,
        scoreDistribution
      })
    } catch (err) {
      console.error('İstatistikler güncellenirken hata:', err)
    }
  }

  const subscribeToChanges = () => {
    // Cevaplar değiştiğinde istatistikleri güncelle
    const answersSubscription = supabase
      .channel('answers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'answers',
          filter: `exam_id=eq.${examId}`
        },
        () => updateStats()
      )
      .subscribe()

    // Sonuçlar değiştiğinde istatistikleri güncelle
    const resultsSubscription = supabase
      .channel('results-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'results',
          filter: `exam_id=eq.${examId}`
        },
        () => updateStats()
      )
      .subscribe()

    return () => {
      answersSubscription.unsubscribe()
      resultsSubscription.unsubscribe()
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-8 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Başlık */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold">{examData?.title} - Canlı Sonuçlar</h1>
          <p className="text-gray-600">{examData?.departments?.name}</p>
        </div>

        {/* Genel İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-gray-900">Toplam Öğrenci</h3>
            <p className="mt-2 text-3xl font-semibold">{stats.totalStudents}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-gray-900">Aktif Öğrenci</h3>
            <p className="mt-2 text-3xl font-semibold">{stats.activeStudents}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-gray-900">Ortalama Puan</h3>
            <p className="mt-2 text-3xl font-semibold">
              {Math.round(stats.averageScore * 100) / 100}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-gray-900">Doğru Oranı</h3>
            <p className="mt-2 text-3xl font-semibold">
              %{Math.round(stats.correctPercentage)}
            </p>
          </div>
        </div>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Puan Dağılımı */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium mb-4">Puan Dağılımı</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Öğrenci Sayısı" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Doğru/Yanlış Oranı */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium mb-4">Doğru/Yanlış Oranı</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Doğru', value: stats.correctPercentage },
                      { name: 'Yanlış', value: stats.wrongPercentage }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: %${(percent * 100).toFixed(0)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Doğru', color: '#10B981' },
                      { name: 'Yanlış', color: '#EF4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
