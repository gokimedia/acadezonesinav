'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Save, X, Trash2, Plus, AlertCircle, Clock, 
  Calendar, FileText, Edit3, HelpCircle, ChevronDown, 
  ChevronUp, MoreVertical, Copy, Eye, Award
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  points: number;
  question_type: string;
  [key: string]: string | number;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  passing_grade: number;
  start_date: string;
  end_date: string;
  questions: Question[];
}

export default function ExamEditPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.examId as string;
  
  // ISO string'den local datetime-local formatına çevir
  const formatDateForInput = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  };

  // datetime-local'den ISO string formatına çevir
  const formatDateForDB = (dateString: string) => {
    if (!dateString) return null;
    return new Date(dateString).toISOString();
  };

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [previewMode, setPreviewMode] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const supabase = createClientComponentClient();

  // Initial state'i formatlı tarihlerle oluştur
  const [examData, setExamData] = useState<Exam | null>(null);

  // Exam data'yı Supabase'den yükle
  useEffect(() => {
    async function loadExamData() {
      try {
        setLoading(true);
        const { data: exam, error: examError } = await supabase
          .from('exams')
          .select(`
            *,
            questions (
              *
            )
          `)
          .eq('id', examId)
          .single();

        if (examError) {
          toast.error('Sınav yüklenirken bir hata oluştu');
          console.error('Exam fetch error:', examError);
          return;
        }

        if (exam) {
          setExamData({
            ...exam,
            start_date: formatDateForInput(exam.start_date),
            end_date: formatDateForInput(exam.end_date),
            questions: exam.questions || []
          });
        }
      } catch (err) {
        console.error('Error loading exam:', err);
        toast.error('Sınav yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    if (examId) {
      loadExamData();
    }
  }, [examId, supabase]);

  // Toplam puanı hesapla
  useEffect(() => {
    if (examData?.questions) {
      const total = examData.questions.reduce((sum, q) => sum + (q?.points || 0), 0) || 0;
      setTotalPoints(total);
    }
  }, [examData?.questions]);

  // İlk yüklemede tüm soruları genişlet
  useEffect(() => {
    if (examData?.questions) {
      const expanded: Record<string, boolean> = {};
      examData.questions.forEach((q, index) => {
        expanded[q?.id || `new-${index}`] = true;
      });
      setExpandedQuestions(expanded);
    }
  }, [examData?.questions]);

  // Soru genişletme toggle
  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Sınav bilgilerini güncelle
  const handleExamUpdate = async () => {
    // Form doğrulama
    if (!examData) return;
    
    if (!examData.title.trim()) {
      toast.error('Lütfen sınav adını giriniz');
      setActiveTab('info');
      return;
    }

    if (!examData.duration || examData.duration <= 0) {
      toast.error('Lütfen geçerli bir süre giriniz');
      setActiveTab('info');
      return;
    }

    if (!examData.start_date) {
      toast.error('Lütfen başlangıç tarihini giriniz');
      setActiveTab('info');
      return;
    }

    if (!examData.end_date) {
      toast.error('Lütfen bitiş tarihini giriniz');
      setActiveTab('info');
      return;
    }

    // Soruları doğrula
    if (!examData?.questions || examData.questions.length === 0) {
      toast.error('Lütfen en az bir soru ekleyiniz');
      setActiveTab('questions');
      return;
    }

    for (let i = 0; i < examData.questions.length; i++) {
      const q = examData.questions[i];
      if (!q.question_text.trim()) {
        toast.error(`Soru ${i + 1}: Lütfen soru metnini giriniz`);
        setActiveTab('questions');
        toggleQuestion(q.id || `new-${i}`);
        return;
      }

      if (q.question_type === 'multiple_choice') {
        if (!q.option_a.trim() || !q.option_b.trim()) {
          toast.error(`Soru ${i + 1}: Lütfen en az iki seçenek giriniz`);
          setActiveTab('questions');
          toggleQuestion(q.id || `new-${i}`);
          return;
        }

        if (!q.correct_answer) {
          toast.error(`Soru ${i + 1}: Lütfen doğru cevabı seçiniz`);
          setActiveTab('questions');
          toggleQuestion(q.id || `new-${i}`);
          return;
        }
      }
    }

    setLoading(true);
    const updatePromise = updateExam();
    
    toast.promise(updatePromise, {
      loading: 'Sınav güncelleniyor...',
      success: 'Sınav başarıyla güncellendi!',
      error: (err) => `Hata: ${err.message || 'Bilinmeyen bir hata oluştu'}`
    });
  };

  // Sınavı güncelle
  const updateExam = async () => {
    try {
      if (!examData) throw new Error('Sınav bilgisi bulunamadı');
      
      // Sınav bilgilerini güncelle
      const { error: examError } = await supabase
        .from('exams')
        .update({
          title: examData.title,
          description: examData.description,
          duration: examData.duration,
          passing_grade: examData.passing_grade,
          start_date: formatDateForDB(examData.start_date),
          end_date: formatDateForDB(examData.end_date),
        })
        .eq('id', examData.id);

      if (examError) {
        console.error('Exam update error:', examError);
        throw examError;
      }

      // Soruları güncelle veya ekle
      for (const question of examData.questions) {
        if (question.id) {
          // Mevcut soruyu güncelle
          const { error: updateError } = await supabase
            .from('questions')
            .update({
              question_text: question.question_text,
              option_a: question.option_a,
              option_b: question.option_b,
              option_c: question.option_c,
              option_d: question.option_d,
              correct_answer: question.correct_answer,
              points: question.points,
              question_type: question.question_type,
            })
            .eq('id', question.id);

          if (updateError) {
            console.error('Question update error:', updateError);
            throw updateError;
          }
        } else {
          // Yeni soru ekle
          const { data: newQuestion, error: insertError } = await supabase
            .from('questions')
            .insert({
              exam_id: examData.id,
              question_text: question.question_text,
              option_a: question.option_a,
              option_b: question.option_b,
              option_c: question.option_c,
              option_d: question.option_d,
              correct_answer: question.correct_answer,
              points: question.points,
              question_type: question.question_type,
            })
            .select()
            .single();

          if (insertError) {
            console.error('Question insert error:', insertError);
            throw insertError;
          }

          // State'i güncelle
          if (newQuestion) {
            question.id = newQuestion.id;
          }
        }
      }
      
      // Sayfayı yenile
      const { data: updatedExam, error: fetchError } = await supabase
        .from('exams')
        .select(`
          *,
          questions (
            *
          )
        `)
        .eq('id', examData.id)
        .single();

      if (fetchError) {
        console.error('Fetch updated exam error:', fetchError);
        throw fetchError;
      }

      // Tarihleri input formatına çevirerek state'i güncelle
      setExamData({
        ...updatedExam,
        start_date: formatDateForInput(updatedExam.start_date),
        end_date: formatDateForInput(updatedExam.end_date)
      });
      
      router.refresh();
      return true;
    } catch (error) {
      console.error('Error in handleExamUpdate:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Yeni soru ekle
  const handleAddQuestion = () => {
    if (!examData) return;
    
    const newId = `temp-${Date.now()}`;
    
    setExamData({
      ...examData,
      questions: [
        ...examData.questions,
        {
          id: '',
          question_text: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_answer: '',
          points: 1,
          question_type: 'multiple_choice',
        },
      ],
    });
    
    setExpandedQuestions(prev => ({
      ...prev,
      [newId]: true
    }));
    
    setActiveTab('questions');
    
    setTimeout(() => {
      const element = document.getElementById('questions-container');
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
    
    toast.success('Yeni soru eklendi');
  };

  // Soruyu sil
  const handleDeleteQuestion = async (questionId: string, index: number) => {
    if (!examData) return;
    
    // Onay iste
    if (!confirm(`${index + 1}. soruyu silmek istediğinize emin misiniz?`)) {
      return;
    }
    
    if (!questionId) {
      // Yeni eklenen soru, sadece state'den kaldır
      setExamData({
        ...examData,
        questions: examData.questions.filter((q, i) => i !== index),
      });
      toast.success('Soru silindi');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      setExamData({
        ...examData,
        questions: examData.questions.filter((q, i) => i !== index),
      });
      
      toast.success('Soru başarıyla silindi');
    } catch (error) {
      toast.error('Soru silinirken hata oluştu');
      console.error('Error deleting question:', error);
    } finally {
      setLoading(false);
    }
  };

  // Soruyu kopyala
  const handleDuplicateQuestion = (index: number) => {
    if (!examData) return;
    
    const questionToDuplicate = examData.questions[index];
    const newQuestion = {
      ...questionToDuplicate,
      id: '' // Yeni soru olduğunu belirtmek için ID boş
    };
    
    const newQuestions = [...examData.questions];
    newQuestions.splice(index + 1, 0, newQuestion);
    
    setExamData({
      ...examData,
      questions: newQuestions
    });
    
    toast.success('Soru kopyalandı');
  };

  // Sınav önizleme modu
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  if (loading && !examData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold">Sınav bulunamadı</h2>
          <p className="mt-2 text-gray-600">Bu sınav mevcut değil veya erişim izniniz yok.</p>
          <button 
            onClick={() => router.push('/panel/sinavlar')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sınavlara Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
      <Toaster position="top-right" />
      
      {/* Üst Bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/panel/sinavlar')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
              <h1 className="text-xl font-bold truncate max-w-md">{examData.title || 'Yeni Sınav'}</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePreviewMode}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Eye size={16} />
                <span className="hidden sm:inline">{previewMode ? 'Düzenleme Modu' : 'Önizleme'}</span>
              </button>
              
              <button
                onClick={handleExamUpdate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                <span>{loading ? 'Kaydediliyor...' : 'Kaydet'}</span>
              </button>
            </div>
          </div>
          
          {/* Sekmeler */}
          {!previewMode && (
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={`py-3 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'info'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('info')}
              >
                Sınav Bilgileri
              </button>
              <button
                className={`py-3 px-4 border-b-2 font-medium text-sm ${
                  activeTab === 'questions'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('questions')}
              >
                Sorular ({examData?.questions?.length || 0})
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {previewMode ? (
          <ExamPreview exam={examData} />
        ) : (
          <>
            {/* Sınav Bilgileri Tab */}
            {activeTab === 'info' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Sınav Adı</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FileText size={16} className="text-gray-400" />
                        </span>
                        <input
                          type="text"
                          value={examData.title}
                          onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                          className="w-full pl-10 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                          placeholder="Sınav başlığını girin"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Süre (dakika)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Clock size={16} className="text-gray-400" />
                        </span>
                        <input
                          type="number"
                          value={examData.duration}
                          onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) || 0 })}
                          className="w-full pl-10 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                          placeholder="60"
                          min={1}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Geçer Not (%)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Award size={16} className="text-gray-400" />
                        </span>
                        <input
                          type="number"
                          value={examData.passing_grade}
                          onChange={(e) => setExamData({ ...examData, passing_grade: parseInt(e.target.value) || 0 })}
                          className="w-full pl-10 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                          placeholder="60"
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Başlangıç Tarihi</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar size={16} className="text-gray-400" />
                        </span>
                        <input
                          type="datetime-local"
                          value={examData.start_date}
                          onChange={(e) => {
                            setExamData({ ...examData, start_date: e.target.value });
                          }}
                          className="w-full pl-10 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Bitiş Tarihi</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar size={16} className="text-gray-400" />
                        </span>
                        <input
                          type="datetime-local"
                          value={examData.end_date}
                          onChange={(e) => setExamData({ ...examData, end_date: e.target.value })}
                          className="w-full pl-10 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Açıklama</label>
                    <textarea
                      value={examData.description}
                      onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                      rows={4}
                      placeholder="Sınav açıklaması (öğrencilere gösterilecek)"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setActiveTab('questions')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <span>Sorulara İlerle</span>
                    <ChevronDown size={16} />
                  </button>
                </div>
              </motion.div>
            )}
            
            {/* Sorular Tab */}
            {activeTab === 'questions' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
                id="questions-container"
              >
                {/* Üst Bilgi Kartı */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex flex-wrap gap-4 justify-between items-center">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                      <HelpCircle size={14} />
                      <span className="text-sm font-medium">{examData.questions.length} Soru</span>
                    </div>
                    
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                      <Award size={14} />
                      <span className="text-sm font-medium">Toplam {totalPoints} Puan</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleAddQuestion}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors ml-auto"
                  >
                    <Plus size={16} />
                    <span>Yeni Soru</span>
                  </button>
                </div>
                
                {/* Sorular Listesi */}
                <div className="space-y-4">
                  <AnimatePresence>
                    {examData?.questions?.map((question, index) => (
                      <motion.div
                        key={question?.id || `new-${index}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
                      >
                        {/* Soru Başlık Kısmı */}
                        <div 
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                          onClick={() => toggleQuestion(question?.id || `new-${index}`)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1 cursor-move">
                              <MoreVertical size={16} className="text-gray-500" />
                            </div>
                            
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium">
                              {index + 1}
                            </span>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {question?.question_text || '(Boş soru)'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {question?.points || 0} puan
                            </span>
                            
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateQuestion(index);
                              }} 
                              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                            >
                              <Copy size={16} />
                            </button>
                            
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuestion(question?.id || '', index);
                              }} 
                              className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                            
                            <ChevronDown 
                              size={16} 
                              className={`text-gray-500 transition-transform ${
                                expandedQuestions[question?.id || `new-${index}`] ? 'rotate-180' : 'rotate-0'
                              }`} 
                            />
                          </div>
                        </div>
                        
                        {/* Soru Detay Kısmı */}
                        {expandedQuestions[question?.id || `new-${index}`] && (
                          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">Soru Metni</label>
                                <textarea
                                  value={question?.question_text || ''}
                                  onChange={(e) => {
                                    const newQuestions = [...(examData?.questions || [])];
                                    if (newQuestions[index]) {
                                      newQuestions[index].question_text = e.target.value;
                                      setExamData({ ...examData, questions: newQuestions });
                                    }
                                  }}
                                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                                  rows={2}
                                  placeholder="Soru metnini girin"
                                />
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {['a', 'b', 'c', 'd'].map((option) => (
                                  <div key={option}>
                                    <label className="flex items-center text-sm font-medium mb-1">
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-2 text-xs font-bold ${
                                        question?.correct_answer === option 
                                          ? 'bg-green-500 text-white' 
                                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                      }`}>
                                        {option.toUpperCase()}
                                      </div>
                                      Seçenek {option.toUpperCase()}
                                      {question?.correct_answer === option && (
                                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                          <Check size={12} /> Doğru Cevap
                                        </span>
                                      )}
                                    </label>
                                    <input
                                      type="text"
                                      value={question?.[`option_${option}` as keyof Question] as string || ''}
                                      onChange={(e) => {
                                        const newQuestions = [...(examData?.questions || [])];
                                        if (newQuestions[index]) {
                                          newQuestions[index][`option_${option}` as keyof Question] = e.target.value;
                                          setExamData({ ...examData, questions: newQuestions });
                                        }
                                      }}
                                      className={`w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white ${
                                        question?.correct_answer === option 
                                          ? 'border-green-500 dark:border-green-500' 
                                          : 'border-gray-300 dark:border-gray-600'
                                      }`}
                                      placeholder={`Seçenek ${option.toUpperCase()}`}
                                    />
                                  </div>
                                ))}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Doğru Cevap</label>
                                  <select
                                    value={question?.correct_answer || ''}
                                    onChange={(e) => {
                                      const newQuestions = [...(examData?.questions || [])];
                                      if (newQuestions[index]) {
                                        newQuestions[index].correct_answer = e.target.value;
                                        setExamData({ ...examData, questions: newQuestions });
                                      }
                                    }}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                                  >
                                    <option value="">Seçiniz</option>
                                    <option value="a">A</option>
                                    <option value="b">B</option>
                                    <option value="c">C</option>
                                    <option value="d">D</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium mb-1">Puan</label>
                                  <input
                                    type="number"
                                    value={question?.points || 1}
                                    onChange={(e) => {
                                      const newQuestions = [...(examData?.questions || [])];
                                      if (newQuestions[index]) {
                                        newQuestions[index].points = parseInt(e.target.value) || 1;
                                        setExamData({ ...examData, questions: newQuestions });
                                      }
                                    }}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                                    min={1}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium mb-1">Soru Tipi</label>
                                  <select
                                    value={question?.question_type || 'multiple_choice'}
                                    onChange={(e) => {
                                      const newQuestions = [...(examData?.questions || [])];
                                      if (newQuestions[index]) {
                                        newQuestions[index].question_type = e.target.value;
                                        setExamData({ ...examData, questions: newQuestions });
                                      }
                                    }}
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 dark:text-white"
                                  >
                                    <option value="multiple_choice">Çoktan Seçmeli</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                {examData?.questions?.length === 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                    <div className="flex flex-col items-center">
                      <HelpCircle size={48} className="text-gray-400 mb-3" />
                      <h3 className="text-lg font-medium mb-2">Henüz soru eklenmemiş</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Sınava soru eklemek için "Yeni Soru" butonuna tıklayın
                      </p>
                      <button
                        onClick={handleAddQuestion}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Plus size={16} />
                        <span>Yeni Soru Ekle</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {examData?.questions?.length > 0 && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={handleAddQuestion}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Plus size={16} />
                      <span>Yeni Soru Ekle</span>
                    </button>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 py-4">
                  <button
                    onClick={() => setActiveTab('info')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronUp size={16} />
                    <span>Sınav Bilgilerine Dön</span>
                  </button>
                  
                  <button
                    onClick={handleExamUpdate}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <Save size={16} />
                    <span>{loading ? 'Kaydediliyor...' : 'Kaydet'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Sınav Önizleme Bileşeni
function ExamPreview({ exam }: { exam: Exam }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Sınav Başlığı */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold">{exam?.title || 'İsimsiz Sınav'}</h2>
        {exam?.description && (
          <div className="mt-2 text-gray-500 dark:text-gray-400">{exam.description}</div>
        )}
        
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock size={16} />
            <span>Süre: {exam?.duration || 0} dakika</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar size={16} />
            <span>
              {exam?.start_date ? new Date(exam.start_date).toLocaleString() : 'Tarih belirtilmemiş'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Award size={16} />
            <span>Geçer Not: %{exam?.passing_grade || 0}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <HelpCircle size={16} />
            <span>{exam?.questions?.length || 0} Soru / Toplam {exam?.questions?.reduce((sum, q) => sum + (q?.points || 0), 0) || 0} Puan</span>
          </div>
        </div>
      </div>
      
      {/* Sorular */}
      <div className="p-6 space-y-8">
        {!exam?.questions || exam.questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Bu sınavda henüz soru bulunmuyor.</p>
          </div>
        ) : (
          exam.questions.map((question, index) => (
            <div key={question?.id || index} className="pb-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div className="flex gap-3 mb-3">
                <div className="flex-shrink-0">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <div className="font-medium mb-2">{question?.question_text || ''}</div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {['a', 'b', 'c', 'd'].map((option) => (
                      question?.[`option_${option}` as keyof Question] && (
                        <div key={option} className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-6 flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center justify-center">
                              {option.toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-2">{question[`option_${option}` as keyof Question]}</div>
                        </div>
                      )
                    ))}
                  </div>
                  
                  <div className="mt-3 text-sm text-right text-gray-500 dark:text-gray-400">
                    {question?.points || 0} puan
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}