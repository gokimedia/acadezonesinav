'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Department } from '@/types/database'

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

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department_id: '',
    duration: 60,
    start_date: '',
    end_date: ''
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

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name')

      if (error) throw error
      setDepartments(data || [])
    } catch (err) {
      console.error('Bölümler yüklenirken hata:', err)
      setError('Bölümler yüklenirken bir hata oluştu')
    }
  }

  const handleQuestionAdd = () => {
    if (
      !currentQuestion.question_text ||
      (currentQuestion.question_type === 'multiple_choice' && !currentQuestion.correct_answer)
    ) {
      alert('Lütfen soru metnini ve doğru cevabı giriniz')
      return
    }

    setQuestions([...questions, currentQuestion])
    setCurrentQuestion({
      id: crypto.randomUUID(),
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1
    })
  }

  const handleQuestionRemove = (questionId: string) => {
    setQuestions(questions.filter((q) => q.id !== questionId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .insert({
          title: formData.title,
          description: formData.description,
          department_id: formData.department_id,
          duration: Number(formData.duration),
          start_date: formData.start_date,
          end_date: formData.end_date,
          is_active: false
        })
        .select()
        .single()

      if (examError) throw new Error(examError.message)
      if (!examData) throw new Error('Sınav oluşturulamadı')

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(
          questions.map((q) => ({
            exam_id: examData.id,
            question_text: q.question_text,
            question_type: q.question_type,
            option_a: q.question_type === 'multiple_choice' ? q.options[0] : null,
            option_b: q.question_type === 'multiple_choice' ? q.options[1] : null,
            option_c: q.question_type === 'multiple_choice' ? q.options[2] : null,
            option_d: q.question_type === 'multiple_choice' ? q.options[3] : null,
            correct_answer: q.correct_answer,
            points: q.points
          }))
        )

      if (questionsError) {
        console.error('Sorular eklenirken hata:', questionsError.message)
        throw new Error(`Sorular eklenirken hata: ${questionsError.message}`)
      }

      router.push('/panel/sinavlar')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu'
      console.error('Sınav oluşturulurken hata:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Yeni Sınav Oluştur</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-xl font-semibold">Sınav Bilgileri</h2>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Sınav Adı */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sınav Adı
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            {/* Başlangıç Tarihi */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Başlangıç Tarihi ve Saati
              </label>
              <input
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => {
                  const startDate = new Date(e.target.value);
                  const endDate = new Date(startDate.getTime() + formData.duration * 60000);
                  setFormData({ 
                    ...formData, 
                    start_date: e.target.value,
                    end_date: endDate.toISOString().slice(0, 16)
                  });
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            {/* Bitiş Tarihi */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bitiş Tarihi ve Saati
              </label>
              <input
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
              />
            </div>

            {/* Bölüm */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bölüm
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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

            {/* Süre (dakika) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Süre (dakika)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => {
                  const newDuration = parseInt(e.target.value);
                  const startDate = new Date(formData.start_date);
                  const endDate = new Date(startDate.getTime() + newDuration * 60000);
                  setFormData({ 
                    ...formData, 
                    duration: newDuration,
                    end_date: endDate.toISOString().slice(0, 16)
                  });
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                min="1"
                required
              />
            </div>
          </div>
        </div>

        {/* Sorular */}
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <h2 className="text-xl font-semibold">Sorular</h2>

          {/* Mevcut Sorular */}
          {questions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Mevcut Sorular</h3>
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{q.question_text}</p>
                      {q.question_type === 'multiple_choice' && (
                        <ul className="mt-2 space-y-1">
                          {q.options.map((option, i) => (
                            <li
                              key={i}
                              className={option === q.correct_answer ? 'text-green-600 font-medium' : ''}
                            >
                              {option}
                            </li>
                          ))}
                        </ul>
                      )}
                      {q.question_type === 'true_false' && (
                        <p className="mt-2">
                          Doğru Cevap: {q.correct_answer ? 'Doğru' : 'Yanlış'}
                        </p>
                      )}
                      {q.question_type === 'fill' && (
                        <p className="mt-2">Doğru Cevap: {q.correct_answer}</p>
                      )}
                      <p className="mt-2">Puan: {q.points}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuestionRemove(q.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Sil
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yeni Soru Ekleme */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Yeni Soru Ekle</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="multiple_choice">Çoktan Seçmeli</option>
                <option value="true_false">Doğru/Yanlış</option>
                <option value="fill">Boşluk Doldurma</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Soru Metni
              </label>
              <textarea
                value={currentQuestion.question_text}
                onChange={(e) =>
                  setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
              />
            </div>

            {/* Çoktan Seçmeli Soru Seçenekleri */}
            {currentQuestion.question_type === 'multiple_choice' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {currentQuestion.options.map((option, index) => (
                    <input
                      key={index}
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...currentQuestion.options]
                        newOptions[index] = e.target.value
                        setCurrentQuestion({ ...currentQuestion, options: newOptions })
                      }}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                      placeholder={`Seçenek ${index + 1}`}
                    />
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Doğru Cevap
                  </label>
                  <select
                    value={currentQuestion.correct_answer as string}
                    onChange={(e) =>
                      setCurrentQuestion({ ...currentQuestion, correct_answer: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Doğru cevabı seçin</option>
                    {currentQuestion.options.map((option, index) => (
                      <option key={index} value={option}>
                        {option || `Seçenek ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="Doğru cevabı girin"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Puan
              </label>
              <input
                type="number"
                value={currentQuestion.points}
                onChange={(e) =>
                  setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                min="1"
              />
            </div>

            <button
              type="button"
              onClick={handleQuestionAdd}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Soru Ekle
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Kaydediliyor...' : 'Sınavı Oluştur'}
          </button>
        </div>
      </form>
    </div>
  )
}
