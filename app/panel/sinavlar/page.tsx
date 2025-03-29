'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/formatDate'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Users, 
  BarChart3, 
  ExternalLink, 
  Clock, 
  Calendar,
  Search,
  Filter,
  ArrowUpRight,
  GraduationCap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy
} from 'lucide-react'
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

      const { error: examError } = await supabase
        .from('exams')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', examId);

      if (examError) throw examError;

      setExams(exams.map(exam => 
        exam.id === examId 
          ? { ...exam, is_active: !currentStatus }
          : exam
      ));

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
    if (!window.confirm('Bu sınavı ve tüm sonuçlarını silmek istediğinizden emin misiniz?\nBu işlem geri alınamaz.')) {
      return;
    }

    setActionLoading(examId);
    setError('');

    try {
      // Önce veritabanındaki ilişkili tablolardan bir kontrol yapalım
      const { data: relatedResults, error: checkResultsError } = await supabase
        .from('results')
        .select('id')
        .eq('exam_id', examId);

      if (checkResultsError) {
        console.error('Sonuçlar kontrol edilirken hata:', checkResultsError);
        throw new Error('Sonuçlar kontrol edilirken bir hata oluştu: ' + checkResultsError.message);
      }

      console.log(`${relatedResults?.length || 0} adet sonuç bulundu`);

      if (relatedResults && relatedResults.length > 0) {
        // Önce results tablosundaki kayıtları silmeyi deneyeceğiz
        console.log('Sonuçlar siliniyor...');
        const { error: resultsDeleteError } = await supabase
          .from('results')
          .delete()
          .eq('exam_id', examId);

        if (resultsDeleteError) {
          console.error('Sonuçlar silinirken hata:', resultsDeleteError);
          throw new Error('Sonuçlar silinirken bir hata oluştu: ' + resultsDeleteError.message);
        }
      }

      // SQL sorgusu ile silmeyi deneyelim
      const { error: rpcError } = await supabase.rpc('delete_exam', {
        exam_id: examId
      });

      if (rpcError) {
        console.error('Silme işlemi sırasında hata:', rpcError);
        
        // Alternatif olarak exams tablosundan doğrudan silmeyi deneyelim
        const { error: examError } = await supabase
          .from('exams')
          .delete()
          .eq('id', examId);
        
        if (examError) {
          throw new Error('Sınav silinirken bir hata oluştu: ' + examError.message);
        }
      }

      setExams(exams.filter(exam => exam.id !== examId));
      showNotification('Sınav başarıyla silindi', 'blue');
    } catch (err: any) {
      console.error('Sınav silme işlemi sırasında hata:', err);
      setError(err.message || 'Sınav silinirken beklenmeyen bir hata oluştu');
    } finally {
      setActionLoading(null);
    }
  }

  const cloneExam = async (examId: string) => {
    if (!window.confirm('Bu sınavın bir kopyasını oluşturmak istediğinizden emin misiniz?')) {
      return;
    }

    setActionLoading(examId);
    setError('');

    try {
      // 1. Önce sınavı getir
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) {
        throw new Error('Sınav bilgisi alınırken bir hata oluştu: ' + examError.message);
      }

      if (!examData) {
        throw new Error('Sınav bulunamadı');
      }

      // 2. Soruları getir
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId);

      if (questionsError) {
        throw new Error('Sınav soruları alınırken bir hata oluştu: ' + questionsError.message);
      }

      // 3. Yeni sınav oluştur (kopyasını)
      const newExamData = {
        ...examData,
        id: undefined, // id'yi undefined olarak ayarla ki Supabase yeni bir id oluştursun
        title: `${examData.title} (Kopya)`,
        is_active: false, // Kopyalanan sınav pasif olarak başlasın
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      delete newExamData.id; // id'yi tamamen kaldır

      const { data: newExam, error: newExamError } = await supabase
        .from('exams')
        .insert(newExamData)
        .select()
        .single();

      if (newExamError) {
        throw new Error('Yeni sınav oluşturulurken bir hata oluştu: ' + newExamError.message);
      }

      // 4. Soruları kopyala
      if (questionsData && questionsData.length > 0) {
        const newQuestions = questionsData.map(question => {
          const { id, ...questionWithoutId } = question;
          return {
            ...questionWithoutId,
            exam_id: newExam.id
          };
        });

        const { error: newQuestionsError } = await supabase
          .from('questions')
          .insert(newQuestions);

        if (newQuestionsError) {
          throw new Error('Sınav soruları kopyalanırken bir hata oluştu: ' + newQuestionsError.message);
        }
      }

      // 5. Ekranı güncelle ve sınavlara yeni sınavı ekle
      fetchExams(); // Sınavları yeniden yükle
      showNotification('Sınav başarıyla kopyalandı', 'green');
    } catch (err: any) {
      console.error('Sınav kopyalama işlemi sırasında hata:', err);
      setError(err.message || 'Sınav kopyalanırken beklenmeyen bir hata oluştu');
    } finally {
      setActionLoading(null);
    }
  }

  const showNotification = (message: string, color: string) => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 bg-${color}-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-500 translate-y-0 opacity-100 flex items-center`;
    
    const icon = document.createElement('span');
    icon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
    `;
    toast.appendChild(icon);
    
    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);
    
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(100%)';
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  }

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
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Başlık ve Üst Kısım */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Sınavlar</h1>
            <p className="text-slate-500 mt-1">Tüm sınavlarınızı bu sayfadan yönetebilirsiniz</p>
          </div>
          <Link 
            href="/panel/sinavlar/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={18} />
            <span>Yeni Sınav</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>

        {/* Filtreler ve Arama */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Sınav ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <div className="absolute left-4 top-3.5 text-slate-400">
                  <Search className="h-5 w-5" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="all">Tüm Sınavlar</option>
                <option value="active">Aktif Sınavlar</option>
                <option value="inactive">Pasif Sınavlar</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100">
                <Filter size={18} />
                <span>Filtrele</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hata Mesajı */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Hata Oluştu</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Sınavlar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExams.map((exam) => (
          <div 
            key={exam.id} 
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    exam.is_active 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-slate-50 text-slate-700 border border-slate-200'
                  }`}>
                    {exam.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleExamStatus(exam.id, exam.is_active)}
                    disabled={actionLoading === exam.id}
                    className={`p-1.5 rounded-lg transition-colors ${
                      exam.is_active
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                    title={exam.is_active ? "Sınavı durdur" : "Sınavı başlat"}
                  >
                    {exam.is_active ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <Link
                    href={`/panel/sinavlar/${exam.id}/edit`}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Sınavı düzenle"
                  >
                    <Edit size={18} />
                  </Link>
                  <button
                    onClick={() => cloneExam(exam.id)}
                    disabled={actionLoading === exam.id}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Sınavın kopyasını oluştur"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={() => deleteExam(exam.id)}
                    disabled={actionLoading === exam.id}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Sınavı sil"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-1">
                {exam.title}
              </h3>

              <div className="flex items-center text-sm text-slate-600 mb-4">
                <Users size={16} className="mr-1.5" />
                <span>{exam.department_name}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-slate-500">
                  <Calendar size={16} className="mr-1.5" />
                  <span>Başlangıç: {formatDate(exam.start_date)}</span>
                </div>
                <div className="flex items-center text-sm text-slate-500">
                  <Clock size={16} className="mr-1.5" />
                  <span>Süre: {exam.duration} dakika</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex gap-2">
                  <Link
                    href={`/panel/sinavlar/${exam.id}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <span>Detayları Görüntüle</span>
                    <ExternalLink size={16} />
                  </Link>
                  <Link
                    href={`/panel/sinavlar/${exam.id}/edit?tab=students`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Users size={16} />
                    <span>Öğrenci Ata</span>
                  </Link>
                </div>
                {exam.is_active && (
                  <div className="mt-3 flex flex-col gap-2">
                    <Link
                      href="/exam-login"
                      target="_blank"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <Play size={16} />
                      <span>Sınav Giriş Sayfası</span>
                      <ExternalLink size={14} />
                    </Link>
                    <Link
                      href={`/live-results/${exam.id}`}
                      target="_blank"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <BarChart3 size={16} />
                      <span>Canlı Sonuçları Takip Et</span>
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Boş Durum */}
      {filteredExams.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-slate-100 rounded-full">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-2">
            Sınav Bulunamadı
          </h3>
          <p className="text-slate-500 mb-6">
            {searchTerm 
              ? 'Arama kriterlerinize uygun sınav bulunamadı.' 
              : 'Henüz hiç sınav oluşturulmamış.'}
          </p>
          <Link
            href="/panel/sinavlar/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>Yeni Sınav Oluştur</span>
          </Link>
        </div>
      )}
    </div>
  );
}