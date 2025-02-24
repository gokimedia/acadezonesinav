'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ExamLogin() {
  const [studentCode, setStudentCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const examId = searchParams.get('exam')
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!studentCode || studentCode.trim() === '') {
      setError('Lütfen öğrenci numaranızı giriniz')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Önce exam_students tablosundan öğrenci kodunu kontrol et
      const { data: examStudentData, error: examStudentError } = await supabase
        .from('exam_students')
        .select(`
          id,
          exam_id,
          student_id,
          student_code,
          exam:exams (
            id,
            title,
            is_active
          )
        `)
        .eq('student_code', studentCode.trim())
        .single()

      if (examStudentError) {
        console.error('Exam student error:', examStudentError)
        setError('Öğrenci numarası bulunamadı')
        setLoading(false)
        return
      }

      if (!examStudentData) {
        setError('Öğrenci numarası bulunamadı')
        setLoading(false)
        return
      }

      // Şimdi öğrenci bilgilerini al
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', examStudentData.student_id)
        .single()

      if (studentError || !studentData) {
        console.error('Student error:', studentError)
        setError('Öğrenci bilgileri alınamadı')
        setLoading(false)
        return
      }

      // Belirli bir sınav için giriş yapılıyorsa kontrol et
      if (examId && examStudentData.exam_id !== examId) {
        setError('Bu öğrenci numarası bu sınava kayıtlı değil')
        setLoading(false)
        return
      }

      // Sınavın aktif olup olmadığını kontrol et
      if (!examStudentData.exam.is_active) {
        setError('Bu sınav henüz başlatılmamış')
        setLoading(false)
        return
      }

      // Öğrenci bilgilerini cookie'ye kaydet
      const studentInfo = {
        id: studentData.id,
        name: studentData.name,
        surname: studentData.surname,
        code: studentData.code,
        examStudentId: examStudentData.id
      }
      
      document.cookie = `exam_student_data=${encodeURIComponent(JSON.stringify(studentInfo))}; path=/`

      // Sınava yönlendir
      router.push(`/exam/${examStudentData.exam_id}?student=${studentData.id}`)
    } catch (err) {
      console.error('Login error:', err)
      setError('Giriş yapılırken bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-blue-600 rounded-2xl flex items-center justify-center transform rotate-45 shadow-xl mb-4">
              <svg 
                className="w-8 h-8 text-white transform -rotate-45" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Sınav Girişi</h2>
            <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="studentCode" className="block text-sm font-medium text-white/80 mb-2">
                Öğrenci Numarası
              </label>
              <input
                id="studentCode"
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Öğrenci numaranızı giriniz"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Giriş Yapılıyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/40 text-sm">
              Sınav sistemine hoş geldiniz
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
