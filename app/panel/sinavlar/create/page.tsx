'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  CalendarDays, 
  Clock, 
  FileText, 
  BookOpen, 
  Trash2, 
  Plus, 
  CheckCircle, 
  HelpCircle, 
  PenTool,
  ArrowLeft,
  ChevronRight,
  GraduationCap,
  ListChecks,
  AlertCircle,
  Info,
  Save,
  Loader2,
  Check,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

// Type definitions
interface Department {
  id: string
  name: string
  active?: boolean
  created_at?: string
  updated_at?: string
}

interface Question {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'fill'
  options: string[]
  correct_answer: string | boolean
  points: number
}

export default function CreateExam() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState<'info' | 'questions'>('info')
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department_id: '',
    duration: 60,
    start_date: '',
    end_date: '',
    passing_grade: 60
  })
  
  // Questions state
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: crypto.randomUUID(),
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1
  })
  
  // Calculate form progress
  const formProgress = useMemo(() => {
    let progress = 0
    
    if (formData.title) progress += 20
    if (formData.department_id) progress += 15
    if (formData.start_date && formData.end_date) progress += 15
    if (formData.duration > 0) progress += 10
    
    // Calculate progress based on questions (40%)
    const MIN_QUESTIONS = 5
    if (questions.length > 0) {
      const questionProgress = Math.min(questions.length / MIN_QUESTIONS, 1) * 40
      progress += questionProgress
    }
    
    return Math.min(Math.round(progress), 100)
  }, [formData, questions])
  
  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments()
  }, [])
  
  // Auto-update end date when start date or duration changes
  useEffect(() => {
    if (formData.start_date && formData.duration) {
      try {
        const start = new Date(formData.start_date)
        if (!isNaN(start.getTime())) {
          const end = new Date(start.getTime() + formData.duration * 60000)
          setFormData(prev => ({
            ...prev,
            end_date: end.toISOString().slice(0, 16)
          }))
        }
      } catch (error) {
        console.error('Error calculating end date:', error)
      }
    }
  }, [formData.start_date, formData.duration])
  
  // Fetch departments from Supabase
  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('active', true)
        .order('name')

      if (error) throw error
      setDepartments(data || [])
    } catch (err: any) {
      console.error('Error fetching departments:', err)
      setError('Bölümler yüklenirken bir hata oluştu')
      toast.error('Bölümler yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }
  
  // Validate exam information
  const validateExamInfo = () => {
    if (!formData.title?.trim()) {
      toast.error('Lütfen sınav adını giriniz')
      return false
    }
    
    if (!formData.department_id) {
      toast.error('Lütfen bir bölüm seçiniz')
      return false
    }
    
    if (!formData.start_date) {
      toast.error('Lütfen başlangıç tarihini giriniz')
      return false
    }
    
    if (!formData.end_date) {
      toast.error('Lütfen bitiş tarihini giriniz')
      return false
    }
    
    try {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      const now = new Date()
      
      if (isNaN(startDate.getTime())) {
        toast.error('Geçersiz başlangıç tarihi')
        return false
      }
      
      if (isNaN(endDate.getTime())) {
        toast.error('Geçersiz bitiş tarihi')
        return false
      }
      
      if (endDate <= startDate) {
        toast.error('Bitiş tarihi başlangıç tarihinden sonra olmalıdır')
        return false
      }
      
      if (startDate < now) {
        toast.error('Başlangıç tarihi şu andan daha ileri olmalıdır')
        return false
      }
    } catch (error) {
      toast.error('Tarih formatı geçersiz')
      return false
    }
    
    return true
  }
  
  // Validate and add a new question
  const handleQuestionAdd = () => {
    if (!currentQuestion.question_text?.trim()) {
      toast.error('Lütfen soru metnini giriniz')
      return
    }

    if (currentQuestion.question_type === 'multiple_choice') {
      const filledOptions = currentQuestion.options.filter(opt => opt.trim() !== '')
      
      if (filledOptions.length < 2) {
        toast.error('Lütfen en az 2 seçenek giriniz')
        return
      }
      
      if (!currentQuestion.correct_answer || typeof currentQuestion.correct_answer !== 'string') {
        toast.error('Lütfen doğru cevabı seçiniz')
        return
      }
      
      // Doğru cevabın tek karakter olduğundan emin ol
      if (currentQuestion.correct_answer.length !== 1) {
        toast.error('Doğru cevap tek bir seçenek olmalıdır')
        return
      }
    } else if (currentQuestion.question_type === 'fill' && 
              (!currentQuestion.correct_answer || 
              (typeof currentQuestion.correct_answer === 'string' && !currentQuestion.correct_answer.trim()))) {
      toast.error('Lütfen doğru cevabı giriniz')
      return
    }
    
    const newQuestion = {
      ...currentQuestion,
      id: crypto.randomUUID(),
      question_text: currentQuestion.question_text.trim(),
      options: currentQuestion.options.map(opt => opt.trim())
    }
    
    setQuestions([...questions, newQuestion])
    
    // Reset current question form
    setCurrentQuestion({
      id: crypto.randomUUID(),
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1
    })
    
    toast.success('Soru başarıyla eklendi')
  }
  
  // Remove question from list
  const handleQuestionRemove = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId))
    toast.success('Soru silindi')
  }
  
  // Format date for database
  const formatDateForDB = (dateString: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    } catch (error) {
      console.error('Date formatting error:', error);
      return null;
    }
  };
  
  // Submit the exam to the database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateExamInfo()) {
      setActiveSection('info')
      return
    }
    
    if (questions.length === 0) {
      toast.error('Lütfen en az bir soru ekleyiniz')
      setActiveSection('questions')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    // Loading toast
    const loadingToast = toast.loading('Sınav oluşturuluyor...')
    
    try {
      // Create exam in database
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          department_id: formData.department_id,
          duration: Number(formData.duration),
          start_date: formatDateForDB(formData.start_date),
          end_date: formatDateForDB(formData.end_date),
          passing_grade: formData.passing_grade,
          is_active: true,  // Set to active by default
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (examError) throw new Error(examError.message)
      if (!examData) throw new Error('Sınav oluşturulamadı')
      
      // Map questions to database schema format
      const questionsToInsert = questions.map(q => {
        let correctAnswer = q.correct_answer;
        
        if (q.question_type === 'multiple_choice') {
          // Çoktan seçmeli sorular için doğru cevabın tek karakter olduğundan emin ol
          if (typeof correctAnswer === 'string') {
            correctAnswer = correctAnswer.toString().charAt(0);
          } else {
            // Geçersiz bir değer varsa varsayılan olarak 'A' kullan
            correctAnswer = 'A';
          }
        } else if (q.question_type === 'true_false') {
          // Boolean değeri string'e çevir
          correctAnswer = correctAnswer === true ? 'true' : 'false';
        }
        
        return {
          exam_id: examData.id,
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          option_a: q.question_type === 'multiple_choice' ? q.options[0]?.trim() || null : null,
          option_b: q.question_type === 'multiple_choice' ? q.options[1]?.trim() || null : null,
          option_c: q.question_type === 'multiple_choice' ? q.options[2]?.trim() || null : null,
          option_d: q.question_type === 'multiple_choice' ? q.options[3]?.trim() || null : null,
          correct_answer: correctAnswer,
          points: q.points || 1,
          created_at: new Date().toISOString()
        }
      })
      
      // Insert questions into database
      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) {
        throw new Error(`Sorular eklenirken hata: ${questionsError.message}`)
      }
      
      // Success!
      toast.dismiss(loadingToast)
      toast.success('Sınav başarıyla oluşturuldu!')
      
      // Navigate to exams list page
      setTimeout(() => {
        router.push('/panel/sinavlar')
      }, 1000)
      
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu'
      console.error('Sınav oluşturulurken hata:', errorMessage)
      setError(errorMessage)
      
      toast.dismiss(loadingToast)
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }
  
  // Calculate total points for all questions
  const totalPoints = useMemo(() => {
    return questions.reduce((sum, q) => sum + q.points, 0)
  }, [questions])

  return (
    <div className="bg-slate-50/80 min-h-screen">
      {/* Header section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          disabled={submitting}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Geri Dön</span>
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Yeni Sınav Oluştur</h1>
            <p className="text-slate-500 mt-1.5">Sınav bilgilerini doldurarak yeni bir değerlendirme oluşturun</p>
          </div>
          
          {/* Progress indicator */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 min-w-[240px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">İşlem Durumu</span>
              <span className={`text-sm font-medium \${
                formProgress === 100 ? 'text-emerald-600' : 'text-blue-600'
              }`}>
                {formProgress}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 \${
                  formProgress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `\${formProgress}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {formProgress < 50 && 'Temel bilgileri doldurun'}
              {formProgress >= 50 && formProgress < 100 && 'Sorular ekleniyor'}
              {formProgress === 100 && (
                <span className="flex items-center text-emerald-600">
                  <Check className="w-3 h-3 mr-1" />
                  <span>Sınav kaydedilmeye hazır</span>
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Steps navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
          <button
            onClick={() => setActiveSection('info')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition \${
              activeSection === 'info'
                ? 'bg-white border-l border-r border-t border-slate-200 text-blue-600'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
            }`}
            disabled={submitting}
          >
            <FileText className="w-4 h-4" />
            <span>Sınav Bilgileri</span>
          </button>
          
          <button
            onClick={() => {
              if (validateExamInfo()) {
                setActiveSection('questions')
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition \${
              activeSection === 'questions'
                ? 'bg-white border-l border-r border-t border-slate-200 text-blue-600'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
            }`}
            disabled={submitting}
          >
            <ListChecks className="w-4 h-4" />
            <span>Sınav Soruları</span>
            {questions.length > 0 && (
              <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {questions.length}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {activeSection === 'info' ? (
          /* Exam Information Form */
          <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-start gap-3 mb-1">
                <div className="p-2 bg-blue-50 rounded-md">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-800">Sınav Bilgileri</h2>
                  <p className="text-slate-500 text-sm">Sınavın temel ayarlarını ve özelliklerini belirleyin</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left column */}
                <div className="space-y-6">
                  {/* Exam title */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Sınav Adı <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Örn: 2024 Bahar Dönemi Vize Sınavı"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={submitting}
                      required
                    />
                  </div>
                  
                  {/* Department selection */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Bölüm <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={submitting || loading}
                      required
                    >
                      <option value="">Bölüm Seçin</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    {loading && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Bölümler yükleniyor...</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Start date */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Başlangıç Tarihi <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <input
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        disabled={submitting}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Duration */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Sınav Süresi (Dakika)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Clock className="w-5 h-5" />
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="240"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        disabled={submitting}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      {formData.duration} dakikalık bir sınav oluşturuyorsunuz
                    </p>
                  </div>
                </div>
                
                {/* Right column */}
                <div className="space-y-6">
                  {/* Description field */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Açıklama
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="Sınav hakkında açıklama yazın..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={submitting}
                    />
                    <p className="text-xs text-slate-500">
                      Öğrencilere iletilecek bilgiler, kurallar veya açıklamalar
                    </p>
                  </div>
                  
                  {/* End date */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Bitiş Tarihi <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <input
                        type="datetime-local"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        disabled={submitting}
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Sınav erişimi bu tarihte sona erecek
                    </p>
                  </div>
                  
                  {/* Passing grade */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Geçme Notu
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.passing_grade}
                        onChange={(e) => setFormData({ ...formData, passing_grade: parseInt(e.target.value) || 60 })}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        disabled={submitting}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Sınavı geçmek için gerekli minimum puan (0-100)
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Form actions */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => {
                    if (validateExamInfo()) {
                      setActiveSection('questions')
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  <span>Sorulara Geç</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Questions Section */
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Questions creation form */}
            <div className="xl:col-span-1">
              <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden sticky top-6">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-start gap-3 mb-1">
                    <div className="p-2 bg-blue-50 rounded-md">
                      <PenTool className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">Yeni Soru Ekle</h2>
                      <p className="text-slate-500 text-sm">Soru bankasına yeni soru ekleyin</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-5">
                  {/* Question type */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Soru Tipi
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border \${
                        currentQuestion.question_type === 'multiple_choice'
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}>
                        <input
                          type="radio" 
                          checked={currentQuestion.question_type === 'multiple_choice'}
                          onChange={() => setCurrentQuestion({
                            ...currentQuestion,
                            question_type: 'multiple_choice',
                            options: ['', '', '', ''],
                            correct_answer: ''
                          })}
                          className="sr-only"
                          disabled={submitting}
                        />
                        <span className="text-sm font-medium">Çoktan Seçmeli</span>
                      </label>
                      
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border \${
                        currentQuestion.question_type === 'true_false'
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}>
                        <input
                          type="radio" 
                          checked={currentQuestion.question_type === 'true_false'}
                          onChange={() => setCurrentQuestion({
                            ...currentQuestion,
                            question_type: 'true_false',
                            options: [],
                            correct_answer: true
                          })}
                          className="sr-only"
                          disabled={submitting}
                        />
                        <span className="text-sm font-medium">Doğru/Yanlış</span>
                      </label>
                      
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border \${
                        currentQuestion.question_type === 'fill'
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}>
                        <input
                          type="radio" 
                          checked={currentQuestion.question_type === 'fill'}
                          onChange={() => setCurrentQuestion({
                            ...currentQuestion,
                            question_type: 'fill',
                            options: [],
                            correct_answer: ''
                          })}
                          className="sr-only"
                          disabled={submitting}
                        />
                        <span className="text-sm font-medium">Boşluk Doldurma</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Question text */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Soru Metni
                    </label>
                    <textarea
                      value={currentQuestion.question_text}
                      onChange={(e) => setCurrentQuestion({
                        ...currentQuestion,
                        question_text: e.target.value
                      })}
                      rows={3}
                      placeholder="Soru metnini yazın..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={submitting}
                    />
                  </div>
                  
                  {/* Options (for multiple choice) */}
                  {currentQuestion.question_type === 'multiple_choice' && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-700">
                        Seçenekler
                      </label>
                      
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg font-medium text-slate-700">
                            {String.fromCharCode(65 + index)}
                          </div>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...currentQuestion.options];
                              newOptions[index] = e.target.value;
                              setCurrentQuestion({
                                ...currentQuestion,
                                options: newOptions
                              });
                            }}
                            placeholder={`\${index + 1}. seçenek`}
                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            disabled={submitting}
                          />
                        </div>
                      ))}
                      
                      {/* Correct answer for multiple choice */}
                      <div className="pt-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                          Doğru Cevap
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['A', 'B', 'C', 'D'].map((letter, index) => (
                            <label key={letter} 
                              className={`px-3 py-2 rounded-md border cursor-pointer \${
                                currentQuestion.correct_answer === letter 
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="radio"
                                className="sr-only"
                                checked={currentQuestion.correct_answer === letter}
                                onChange={() => setCurrentQuestion({
                                  ...currentQuestion,
                                  correct_answer: letter
                                })}
                                disabled={submitting || !currentQuestion.options[index].trim()}
                              />
                              <span className="flex items-center gap-1">
                                <span className="font-medium">{letter}</span>
                                <span className="text-sm truncate max-w-[100px]">
                                  {currentQuestion.options[index] ? 
                                    currentQuestion.options[index].length > 15 
                                      ? currentQuestion.options[index].substring(0, 15) + '...'
                                      : currentQuestion.options[index]
                                    : 'Boş'}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* T/F options */}
                  {currentQuestion.question_type === 'true_false' && (
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        Doğru Cevap
                      </label>
                      <div className="flex gap-3">
                        <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border \${
                          currentQuestion.correct_answer === true
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}>
                          <input
                            type="radio"
                            checked={currentQuestion.correct_answer === true}
                            onChange={() => setCurrentQuestion({
                              ...currentQuestion,
                              correct_answer: true
                            })}
                            className="sr-only"
                            disabled={submitting}
                          />
                          <Check className="w-5 h-5" />
                          <span className="font-medium">Doğru</span>
                        </label>
                        
                        <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border \${
                          currentQuestion.correct_answer === false
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}>
                          <input
                            type="radio"
                            checked={currentQuestion.correct_answer === false}
                            onChange={() => setCurrentQuestion({
                              ...currentQuestion,
                              correct_answer: false
                            })}
                            className="sr-only"
                            disabled={submitting}
                          />
                          <X className="w-5 h-5" />
                          <span className="font-medium">Yanlış</span>
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Fill in the blank answer */}
                  {currentQuestion.question_type === 'fill' && (
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700">
                        Doğru Cevap
                      </label>
                      <input
                        type="text"
                        value={currentQuestion.correct_answer as string}
                        onChange={(e) => setCurrentQuestion({
                          ...currentQuestion,
                          correct_answer: e.target.value
                        })}
                        placeholder="Doğru cevabı yazın"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        disabled={submitting}
                      />
                      <p className="text-xs text-slate-500">
                        Tam eşleşme için öğrenci cevabı bu değerle karşılaştırılacaktır
                      </p>
                    </div>
                  )}
                  
                  {/* Points */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Soru Puanı
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={currentQuestion.points}
                      onChange={(e) => setCurrentQuestion({
                        ...currentQuestion,
                        points: parseInt(e.target.value) || 1
                      })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      disabled={submitting}
                    />
                  </div>
                  
                  {/* Add question button */}
                  <div className="pt-2">
                    <button
                      onClick={handleQuestionAdd}
                      className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                      disabled={submitting}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Soruyu Ekle</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Questions list */}
            <div className="xl:col-span-2">
              <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 rounded-md">
                        <ListChecks className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-800">Eklenen Sorular</h2>
                        <p className="text-slate-500 text-sm">
                          {questions.length > 0 
                            ? `Toplam \${questions.length} soru, \${totalPoints} puan değerinde`
                            : 'Henüz soru eklenmedi'}
                        </p>
                      </div>
                    </div>
                    
                    {questions.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => setActiveSection('info')}
                          className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                          disabled={submitting}
                        >
                          Bilgilere Dön
                        </button>
                        <button
                          onClick={handleSubmit}
                          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                          disabled={submitting}
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Kaydediliyor...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Sınavı Kaydet</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {questions.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {questions.map((question, index) => (
                      <div key={question.id} className="p-5 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-lg font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 mb-1">{question.question_text}</div>
                            
                            {question.question_type === 'multiple_choice' && (
                              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                                {question.options.map((option, optIndex) => (
                                  <div 
                                    key={optIndex}
                                    className={`text-sm flex items-center gap-2 \${
                                      String.fromCharCode(65 + optIndex) === question.correct_answer
                                        ? 'text-emerald-700 font-medium'
                                        : 'text-slate-600'
                                    }`}
                                  >
                                    <div className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-xs \${
                                      String.fromCharCode(65 + optIndex) === question.correct_answer
                                        ? 'bg-emerald-100'
                                        : 'bg-slate-100'
                                    }`}>
                                      {String.fromCharCode(65 + optIndex)}
                                    </div>
                                    <span className="truncate">{option}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {question.question_type === 'true_false' && (
                              <div className="mt-1 flex items-center gap-2 text-sm">
                                <span>Doğru Cevap:</span>
                                <span className={`flex items-center gap-1 font-medium \${
                                  question.correct_answer ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                  {question.correct_answer ? 
                                    <><Check className="w-4 h-4" /> Doğru</> : 
                                    <><X className="w-4 h-4" /> Yanlış</>}
                                </span>
                              </div>
                            )}
                            
                            {question.question_type === 'fill' && (
                              <div className="mt-1 flex items-center gap-2 text-sm">
                                <span>Doğru Cevap:</span>
                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-medium">
                                  {question.correct_answer as string}
                                </span>
                              </div>
                            )}
                            
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <PenTool className="w-3.5 h-3.5" />
                                <span>{
                                  question.question_type === 'multiple_choice' ? 'Çoktan Seçmeli' :
                                  question.question_type === 'true_false' ? 'Doğru/Yanlış' :
                                  'Boşluk Doldurma'
                                }</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>{question.points} Puan</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleQuestionRemove(question.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={submitting}
                            title="Soruyu sil"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-slate-100 rounded-full">
                        <HelpCircle className="w-8 h-8 text-slate-400" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">
                      Henüz Soru Eklenmedi
                    </h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                      Sınava sorular eklemek için sol taraftaki formu kullanın. Sınav kaydetmek için en az bir soru gereklidir.
                    </p>
                    <button
                      onClick={() => setActiveSection('info')}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Bilgilere Dön</span>
                    </button>
                  </div>
                )}
                
                {/* Error display */}
                {error && (
                  <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <div>{error}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Submit button (bottom) */}
              {questions.length > 0 && (
                <div className="mt-4 p-4 bg-white shadow-sm border border-slate-200 rounded-lg">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Info className="w-5 h-5 text-blue-500" />
                      <span>Tüm soruları ekledikten sonra sınavı kaydedin.</span>
                    </div>
                    <button
                      onClick={handleSubmit}
                      className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Kaydediliyor...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Sınavı Kaydet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}