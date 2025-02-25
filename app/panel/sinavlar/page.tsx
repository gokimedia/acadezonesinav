'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/formatDate'
import { Plus, Edit, Trash2, Play, Pause, Users, BarChart3, ExternalLink, Clock, Calendar } from 'lucide-react'
import { Tooltip } from '@/components/common/Tooltip'

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
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
      setActionLoading(examId);
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
      showNotification(
        currentStatus ? 'Sınav durduruldu' : 'Sınav başlatıldı',
        currentStatus ? 'red' : 'green'
      );

    } catch (err) {
      console.error('Sınav durumu güncellenirken hata:', err);
      setError('Sınav durumu güncellenirken bir hata oluştu');
    } finally {
      setActionLoading(null);
    }
  }

  const deleteExam = async (examId: string) => {
    if (!confirm('Bu sınavı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    
    try {
      setActionLoading(examId);
      
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
      
      showNotification('Sınav başarıyla silindi', 'blue');
    } catch (err) {
      console.error('Sınav silinirken hata:', err);
      setError('Sınav silinirken bir hata oluştu');
    } finally {
      setActionLoading(null);
    }
  }

  const showNotification = (message: string, color: string) => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 bg-${color}-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-500 translate-y-0 opacity-100 flex items-center`;
    
    // Başarı ikonu ekle
    const icon = document.createElement('span');
    icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
    `;
    toast.appendChild(icon);
    
    // Mesaj ekle
    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);
    
    document.body.appendChild(toast);

    // Toast'ı 3 saniye sonra kaldır
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(100%)';
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

  // Filtreleme ve arama işlemleri
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && exam.is_active) || 
                          (statusFilter === 'inactive' && !exam.is_active);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Sınavlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Başlık ve Yeni Sınav Butonu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sınavlar</h1>
          <p className="text-gray-500 mt-1">Tüm sınavlarınızı yönetin ve izleyin</p>
        </div>
        <Link href="/panel/sinavlar/create">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center">
            <Plus size={18} className="mr-2" />
            <span>Yeni Sınav</span>
          </button>
        </Link>
      </div>

      {/* Filtreler ve Arama */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <div className="relative">
              <input
                type="text"
                placeholder="Sınav ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="all">Tüm Sınavlar</option>
              <option value="active">Aktif Sınavlar</option>
              <option value="inactive">Pasif Sınavlar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hata Mesajı */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sınavlar Tablosu */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredExams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sınav Adı
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Tarihler
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Süre
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{exam.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{exam.department_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="flex flex-col text-sm">
                        <div className="flex items-center text-gray-700">
                          <Calendar size={14} className="mr-1 text-green-600" />
                          <span>Başlangıç: {formatDate(exam.start_date)}</span>
                        </div>
                        <div className="flex items-center text-gray-700 mt-1">
                          <Calendar size={14} className="mr-1 text-red-600" />
                          <span>Bitiş: {formatDate(exam.end_date)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock size={16} className="mr-2 text-blue-600" />
                        <span>{exam.duration} dakika</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {exam.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <span className="w-2 h-2 bg-gray-400 rounded-full mr-1.5"></span>
                          Pasif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-1">
                        {/* Başlat/Durdur Butonu */}
                        <Tooltip content={exam.is_active ? "Sınavı Durdur" : "Sınavı Başlat"}>
                          <button
                            onClick={() => toggleExamStatus(exam.id, exam.is_active)}
                            disabled={actionLoading === exam.id}
                            className={`p-2 rounded-full ${
                              exam.is_active 
                                ? 'text-red-600 hover:bg-red-50' 
                                : 'text-green-600 hover:bg-green-50'
                            } transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              exam.is_active ? 'focus:ring-red-500' : 'focus:ring-green-500'
                            }`}
                          >
                            {actionLoading === exam.id ? (
                              <div className="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full"></div>
                            ) : (
                              exam.is_active ? <Pause size={18} /> : <Play size={18} />
                            )}
                          </button>
                        </Tooltip>

                        {/* Öğrenciler Butonu */}
                        <Tooltip content="Öğrenciler">
                          <Link href={`/panel/sinavlar/${exam.id}/settings`}>
                            <button
                              className="p-2 rounded-full text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <Users size={18} />
                            </button>
                          </Link>
                        </Tooltip>

                        {/* Canlı Sonuçlar Butonu */}
                        <Tooltip content="Canlı Sonuçlar">
                          <Link
                            href={`/live-results/${exam.id}`}
                            target="_blank"
                          >
                            <button
                              className="p-2 rounded-full text-purple-600 hover:bg-purple-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              <BarChart3 size={18} />
                            </button>
                          </Link>
                        </Tooltip>

                        {/* Düzenle Butonu */}
                        <Tooltip content="Düzenle">
                          <Link href={`/exam-edit/${exam.id}`}>
                            <button
                              className="p-2 rounded-full text-amber-600 hover:bg-amber-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            >
                              <Edit size={18} />
                            </button>
                          </Link>
                        </Tooltip>

                        {/* Sil Butonu */}
                        <Tooltip content="Sil">
                          <button
                            onClick={() => deleteExam(exam.id)}
                            disabled={actionLoading === exam.id}
                            className="p-2 rounded-full text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            {actionLoading === exam.id ? (
                              <div className="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full"></div>
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sınav bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Arama kriterleriyle eşleşen sınav bulunamadı. Filtreleri değiştirin veya yeni bir sınav oluşturun.' 
                : 'Henüz hiç sınav oluşturmadınız. Yeni bir sınav oluşturmak için "Yeni Sınav" butonuna tıklayın.'}
            </p>
            <div className="mt-6">
              <Link href="/panel/sinavlar/create">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Yeni Sınav Oluştur
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}