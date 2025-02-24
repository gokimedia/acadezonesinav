'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/common/Button'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/formatDate'

interface Exam {
  id: string
  title: string
  department_name: string
  duration: number
  is_active: boolean
  created_at: string
  start_date: string
  end_date: string
}

export default function Sinavlar() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select(`
          *,
          departments (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedExams = data?.map(exam => ({
        ...exam,
        department_name: exam.departments?.name || 'Bilinmiyor'
      })) || [];

      setExams(formattedExams);
    } catch (err) {
      console.error('Sınavlar yüklenirken hata:', err);
      setError('Sınavlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  const toggleExamStatus = async (examId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'durdurmak' : 'başlatmak';
    if (!confirm(`Sınavı ${action} istediğinize emin misiniz?`)) return;

    try {
      setLoading(true);
      setError('');

      // Sınavın durumunu güncelle
      const { error: examError } = await supabase
        .from('exams')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', examId);

      if (examError) throw examError;

      // State'i güncelle
      setExams(exams.map(exam => 
        exam.id === examId 
          ? { ...exam, is_active: !currentStatus }
          : exam
      ));

      // Başarı mesajı göster
      const message = currentStatus ? 'Sınav durduruldu' : 'Sınav başlatıldı';
      const toast = document.createElement('div');
      toast.className = `fixed bottom-4 right-4 bg-${currentStatus ? 'red' : 'green'}-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-500 translate-y-0 opacity-100`;
      toast.innerHTML = message;
      document.body.appendChild(toast);

      // Toast'ı 3 saniye sonra kaldır
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(100%)';
        setTimeout(() => toast.remove(), 500);
      }, 3000);

    } catch (err) {
      console.error('Sınav durumu güncellenirken hata:', err);
      setError('Sınav durumu güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  const deleteExam = async (examId: string) => {
    if (!confirm('Bu sınavı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    
    try {
      // Önce sınavla ilişkili tüm soruları sil
      const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('exam_id', examId);

      if (questionsError) throw questionsError;

      // Sonra sınavı sil
      const { error: examError } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (examError) throw examError;

      setExams(exams.filter(exam => exam.id !== examId));
    } catch (err) {
      console.error('Sınav silinirken hata:', err);
      setError('Sınav silinirken bir hata oluştu');
    }
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sınavlar</h1>
        <Link 
          href="/panel/sinavlar/create"
          className="inline-block"
        >
          <Button>Yeni Sınav</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sınav Adı
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Başlangıç
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bitiş
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Süre (dk)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exams.map((exam) => (
              <tr key={exam.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{exam.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(exam.start_date)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(exam.end_date)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{exam.duration}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    exam.is_active 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {exam.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExamStatus(exam.id, exam.is_active)}
                      className={`${exam.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} transition-colors duration-200`}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {exam.is_active ? 'Durduruluyor...' : 'Başlatılıyor...'}
                        </span>
                      ) : (
                        exam.is_active ? 'Durdur' : 'Başlat'
                      )}
                    </Button>
                    <Link href={`/panel/sinavlar/${exam.id}/settings`}>
                      <Button variant="ghost" size="sm">Öğrenciler</Button>
                    </Link>
                    <Link
                      href={`/live-results/${exam.id}`}
                      target="_blank"
                      className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Canlı Sonuçlar
                    </Link>
                    <Link href={`/exam-edit/${exam.id}`}>
                      <Button variant="ghost" size="sm">Düzenle</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteExam(exam.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Sil
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {exams.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Henüz sınav eklenmemiş
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
