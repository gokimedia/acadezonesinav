'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ExamLogin() {
  const router = useRouter()
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleExamLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Öğrenci ID'sini kontrol et
      const { data: student, error } = await supabase
        .from('students')
        .select('id, name')
        .eq('student_id', studentId)
        .single()

      if (error || !student) {
        throw new Error('Öğrenci bulunamadı. Lütfen ID numaranızı kontrol edin.')
      }

      // Öğrencinin aktif sınavını kontrol et
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .select('id, title')
        .eq('is_active', true)
        .single()

      if (examError || !exam) {
        throw new Error('Aktif sınav bulunamadı.')
      }

      // Sınav sayfasına yönlendir
      router.push(`/exam/${exam.id}?student=${student.id}`)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sınav Girişi
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sınava girmek için öğrenci numaranızı giriniz
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleExamLogin}>
          <div>
            <label htmlFor="studentId" className="sr-only">
              Öğrenci Numarası
            </label>
            <input
              id="studentId"
              name="studentId"
              type="text"
              required
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Öğrenci Numarası"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? 'Kontrol ediliyor...' : 'Sınava Gir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
