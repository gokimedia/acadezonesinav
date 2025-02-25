'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { CalendarDays, Clock, FileText, BookOpen, Trash2, Plus, CheckCircle, HelpCircle, PenTool } from 'lucide-react'
import toast from 'react-hot-toast'

// Department tipi direkt olarak tanımlanıyor
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
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState<'info' | 'questions'>('info')
  const [formProgress, setFormProgress] = useState(0)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department_id: '',
    duration: 60,
    start_date: '',
    end_date: '',
    passing_grade: 60
  })

  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: crypto.randomUUID(),
    question_text: '',
    question_type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1
  })

  useEffect(() => {
    fetchDepartments()
  }, [])

  useEffect(() => {
    // Calculate form progress
    let progress = 0
    
    if (formData.title) progress += 20
    if (formData.department_id) progress += 15
    if (formData.start_date) progress += 15
    if (formData.duration > 0) progress += 10
    if (questions.length > 0) progress += 40
    
    setFormProgress(progress)
  }, [formData, questions])

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name')

      if (error) throw error
      setDepartments(data || [])
    } catch (err: any) {
      console.error('Bölümler yüklenirken hata:', err)
      setError('Bölümler yüklenirken bir hata oluştu')
      toast.error('Bölümler yüklenirken bir hata oluştu')
    }
  }

  const validateExamInfo = () => {
    if (!formData.title || !formData.title.trim()) {
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
    
    // Tarih geçerliliğini kontrol et
    try {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)
      
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
    } catch (error) {
      toast.error('Tarih formatı geçersiz')
      return false
    }
    
    return true
  }

  const handleQuestionAdd = () => {
    if (!currentQuestion.question_text || !currentQuestion.question_text.trim()) {
      toast.error('Lütfen soru metnini giriniz')
      return
    }

    if (currentQuestion.question_type === 'multiple_choice') {
      // Check if at least 2 options are filled
      const filledOptions = currentQuestion.options.filter(opt => opt.trim() !== '')
      if (filledOptions.length < 2) {
        toast.error('Lütfen en az 2 seçenek giriniz')
        return
      }
      
      if (!currentQuestion.correct_answer) {
        toast.error('Lütfen doğru cevabı seçiniz')
        return
      }
    } else if (currentQuestion.question_type === 'fill' && 
               (!currentQuestion.correct_answer || 
                (typeof currentQuestion.correct_answer === 'string' && !currentQuestion.correct_answer.trim()))) {
      toast.error('Lütfen doğru cevabı giriniz')
      return
    }

    // UUID benzersiz olmalı
    const newQuestion = {
      ...currentQuestion,
      id: crypto.randomUUID()
    }
    
    setQuestions([...questions, newQuestion])
    
    // Yeni soruyu resetle
    setCurrentQuestion({
      id: crypto.randomUUID(),
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1
    })
    
    toast.success('Soru eklendi')
  }

  const handleQuestionRemove = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId))
    toast.success('Soru silindi')
  }

  const formatDateForDB = (dateString: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      // Invalid date kontrolü
      if (isNaN(date.getTime())) {
        console.error('Invalid date detected:', dateString);
        return null;
      }
      return date.toISOString();
    } catch (error) {
      console.error('Date formatting error:', error);
      return null;
    }
  };

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

    setLoading(true)
    setError('')

    try {
      // First, create the exam
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
          is_active: false
        })
        .select()
        .single()

      if (examError) throw new Error(examError.message)
      if (!examData) throw new Error('Sınav oluşturulamadı')

      // Then, add the questions
      const questionsToInsert = questions.map((q) => {
        // Doğru cevap için karakter kısıtlaması kontrolü
        let correctAnswer = q.correct_answer;
        
        // Eğer karakter(1) sınırlaması varsa ve string ise
        if (typeof correctAnswer === 'string' && q.question_type === 'multiple_choice') {
          // İlk karakteri al
          correctAnswer = correctAnswer.charAt(0);
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
          points: q.points || 1
        }
      })

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) {
        console.error('Sorular eklenirken hata:', questionsError.message)
        throw new Error(`Sorular eklenirken hata: ${questionsError.message}`)
      }

      toast.success('Sınav başarıyla oluşturuldu!')
      router.push('/panel/sinavlar')
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu'
      console.error('Sınav oluşturulurken hata:', errorMessage)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateEndDate = (startDate: string, durationMinutes: number) => {
    try {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) return '';
      
      const end = new Date(start.getTime() + durationMinutes * 60000);
      return end.toISOString().slice(0, 16);
    } catch (error) {
      console.error('End date calculation error:', error);
      return '';
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header with Progress */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Yeni Sınav Oluştur</h1>
            <div className="mt-3 md:mt-0 w-full md:w-64">
              <div className="bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${formProgress}%` }}
                ></div>
              </div>
              <div className="mt-1 text-xs text-gray-500 text-right">{formProgress}% tamamlandı</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6">
              <button
                onClick={() => setActiveSection('info')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeSection === 'info'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="inline-block mr-2 h-5 w-5" />
                Sınav Bilgileri
              </button>
              <button
                onClick={() => {
                  if (validateExamInfo()) {
                    setActiveSection('questions')
                  }
                }}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeSection === 'questions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <HelpCircle className="inline-block mr-2 h-5 w-5" />
                Sorular {questions.length > 0 && `(${questions.length})`}
              </button>
            </nav>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exam Info Section */}
          {activeSection === 'info' && (
            <Card className="p-6 shadow-md border-0">
              <div className="space-y-6">
                <div className="flex items-center">
                  <FileText className="h-6 w-6 text-blue-600 mr-2" />
                  <h2 className="text-xl font-semibold">Sınav Bilgileri</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sınav Adı */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-900">
                      Sınav Adı
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      required
                    />
                  </div>

                  {/* Bölüm */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      <BookOpen className="inline-block mr-2 h-4 w-4" /> Bölüm
                    </label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      required
                    >
                      <option value="">Bölüm Seçin</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Geçer Not */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      <CheckCircle className="inline-block mr-2 h-4 w-4" /> Geçer Not (%)
                    </label>
                    <input
                      type="number"
                      value={formData.passing_grade}
                      onChange={(e) => setFormData({ ...formData, passing_grade: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      min="1"
                      max="100"
                      required
                    />
                  </div>

                  {/* Başlangıç Tarihi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      <CalendarDays className="inline-block mr-2 h-4 w-4" /> Başlangıç Tarihi ve Saati
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => {
                        try {
                          const startDate = e.target.value;
                          const endDate = updateEndDate(startDate, formData.duration);
                          
                          setFormData({ 
                            ...formData, 
                            start_date: startDate,
                            end_date: endDate || formData.end_date
                          });
                        } catch (error) {
                          console.error('Date input error:', error);
                        }
                      }}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Süre (dakika) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      <Clock className="inline-block mr-2 h-4 w-4" /> Süre (dakika)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => {
                        try {
                          const newDuration = parseInt(e.target.value) || 0;
                          let updatedEndDate = formData.end_date;
                          
                          if (newDuration > 0 && formData.start_date) {
                            updatedEndDate = updateEndDate(formData.start_date, newDuration);
                          }
                          
                          setFormData({
                            ...formData,
                            duration: newDuration,
                            end_date: updatedEndDate || formData.end_date
                          });
                        } catch (error) {
                          console.error('Duration change error:', error);
                          setFormData({
                            ...formData,
                            duration: parseInt(e.target.value) || 0
                          });
                        }
                      }}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      min="1"
                      required
                    />
                  </div>

                  {/* Bitiş Tarihi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      <CalendarDays className="inline-block mr-2 h-4 w-4" /> Bitiş Tarihi ve Saati
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Açıklama */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-900">
                      <PenTool className="inline-block mr-2 h-4 w-4" /> Açıklama
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => {
                      if (validateExamInfo()) {
                        setActiveSection('questions');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6"
                  >
                    İleri: Sorular
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Questions Section */}
          {activeSection === 'questions' && (
            <div className="space-y-6">
              {/* Questions List */}
              {questions.length > 0 && (
                <Card className="p-6 shadow-md border-0">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <HelpCircle className="h-6 w-6 text-blue-600 mr-2" />
                        <h2 className="text-xl font-semibold">Sınav Soruları ({questions.length})</h2>
                      </div>
                      <span className="text-sm text-gray-500">
                        Toplam Puan: {questions.reduce((sum, q) => sum + q.points, 0)}
                      </span>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto p-2">
                      {questions.map((q, index) => (
                        <Card key={q.id} className="p-4 border border-gray-200 hover:border-blue-300 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                                  {index + 1}
                                </span>
                                <span className="font-medium">{q.question_text}</span>
                              </div>
                              
                              {q.question_type === 'multiple_choice' && (
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.options.filter(o => o.trim() !== '').map((option, i) => (
                                    <div 
                                      key={i}
                                      className={`p-2 rounded-md text-sm ${option === q.correct_answer 
                                        ? 'bg-green-100 border border-green-300' 
                                        : 'bg-gray-50 border border-gray-200'}`}
                                    >
                                      {option === q.correct_answer && (
                                        <CheckCircle className="inline-block mr-1 h-4 w-4 text-green-600" />
                                      )}
                                      {option}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {q.question_type === 'true_false' && (
                                <div className="mt-3 flex gap-4">
                                  <div className={`p-2 rounded-md text-sm ${q.correct_answer === true 
                                    ? 'bg-green-100 border border-green-300' 
                                    : 'bg-gray-50 border border-gray-200'}`}>
                                    Doğru
                                  </div>
                                  <div className={`p-2 rounded-md text-sm ${q.correct_answer === false 
                                    ? 'bg-green-100 border border-green-300' 
                                    : 'bg-gray-50 border border-gray-200'}`}>
                                    Yanlış
                                  </div>
                                </div>
                              )}
                              
                              {q.question_type === 'fill' && (
                                <div className="mt-3">
                                  <div className="p-2 rounded-md text-sm bg-green-100 border border-green-300 inline-block">
                                    {q.correct_answer}
                                  </div>
                                </div>
                              )}
                              
                              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  {q.question_type === 'multiple_choice' 
                                    ? 'Çoktan Seçmeli' 
                                    : q.question_type === 'true_false' 
                                      ? 'Doğru/Yanlış'
                                      : 'Boşluk Doldurma'}
                                </span>
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                                  {q.points} puan
                                </span>
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleQuestionRemove(q.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Soruyu Sil"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* New Question Form */}
              <Card className="p-6 shadow-md border-0">
                <div className="space-y-6">
                  <div className="flex items-center">
                    <Plus className="h-6 w-6 text-blue-600 mr-2" />
                    <h2 className="text-xl font-semibold">Yeni Soru Ekle</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-900">
                        Soru Tipi
                      </label>
                      <select
                        value={currentQuestion.question_type}
                        onChange={(e) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            question_type: e.target.value as 'multiple_choice' | 'true_false' | 'fill',
                            options: e.target.value === 'multiple_choice' ? ['', '', '', ''] : [],
                            correct_answer: e.target.value === 'true_false' ? true : ''
                          })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="multiple_choice">Çoktan Seçmeli</option>
                        <option value="true_false">Doğru/Yanlış</option>
                        <option value="fill">Boşluk Doldurma</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-900">
                        Soru Metni
                      </label>
                      <textarea
                        value={currentQuestion.question_text}
                        onChange={(e) =>
                          setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        rows={3}
                        placeholder="Soru metnini buraya yazın..."
                      />
                    </div>

                    {/* Çoktan Seçmeli Soru Seçenekleri */}
                    {currentQuestion.question_type === 'multiple_choice' && (
                      <>
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentQuestion.options.map((option, index) => (
                            <div key={index}>
                              <label className="block text-sm font-medium text-gray-900">
                                {index === 0 ? 'A' : index === 1 ? 'B' : index === 2 ? 'C' : 'D'} Seçeneği
                              </label>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...currentQuestion.options]
                                  newOptions[index] = e.target.value
                                  setCurrentQuestion({ ...currentQuestion, options: newOptions })
                                }}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                                placeholder={`Seçenek ${index + 1}`}
                              />
                            </div>
                          ))}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-900">
                            Doğru Cevap
                          </label>
                          <select
                            value={currentQuestion.correct_answer as string}
                            onChange={(e) => {
                              // Doğru cevap olarak tam option değerini değil, sadece seçeneğin kendisini (A, B, C, D) sakla
                              const selectedOption = e.target.value;
                              const optionIndex = currentQuestion.options.findIndex(opt => opt === selectedOption);
                              
                              // Veritabanında character(1) sınırlaması varsa:
                              // const correctAnswer = optionIndex >= 0 ? String.fromCharCode(97 + optionIndex) : '';
                              
                              setCurrentQuestion({ 
                                ...currentQuestion, 
                                correct_answer: selectedOption 
                              });
                            }}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                          >
                            <option value="">Doğru cevabı seçin</option>
                            {currentQuestion.options.map((option, index) => (
                              option.trim() !== '' && (
                                <option key={index} value={option}>
                                  {index === 0 ? 'A: ' : index === 1 ? 'B: ' : index === 2 ? 'C: ' : 'D: '}
                                  {option}
                                </option>
                              )
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {/* Doğru/Yanlış Soru Seçenekleri */}
                    {currentQuestion.question_type === 'true_false' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Doğru Cevap
                        </label>
                        <select
                          value={String(currentQuestion.correct_answer)}
                          onChange={(e) =>
                            setCurrentQuestion({
                              ...currentQuestion,
                              correct_answer: e.target.value === 'true'
                            })
                          }
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="true">Doğru</option>
                          <option value="false">Yanlış</option>
                        </select>
                      </div>
                    )}

                    {/* Boşluk Doldurma Soru Seçenekleri */}
                    {currentQuestion.question_type === 'fill' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Doğru Cevap
                        </label>
                        <input
                          type="text"
                          value={currentQuestion.correct_answer as string}
                          onChange={(e) =>
                            setCurrentQuestion({ ...currentQuestion, correct_answer: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Doğru cevabı girin"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-900">
                        Puan
                      </label>
                      <input
                        type="number"
                        value={currentQuestion.points}
                        onChange={(e) =>
                          setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 1 })
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      onClick={handleQuestionAdd}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      <Plus size={18} className="mr-1" /> Soru Ekle
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="flex justify-between">
                <Button
                  type="button"
                  onClick={() => setActiveSection('info')}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium"
                >
                  Geri: Sınav Bilgileri
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className={`bg-green-600 hover:bg-green-700 text-white font-medium ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Kaydediliyor...' : 'Sınavı Oluştur'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}