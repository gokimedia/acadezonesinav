'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'

// Tip tanımlamaları
type ExamType = {
  id: string;
  title: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
}

type StudentType = {
  id: string;
  name: string;
  surname: string;
}

type ExamStudentData = {
  id: string;
  exam_id: string;
  student_id: string;
  student_code: string;
  exam: ExamType;
  student: StudentType;
}

export default function ExamLogin() {
  const [studentCode, setStudentCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
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
      // İlk olarak exam_students tablosunda bu kodu arayalım
      const { data: examStudentsData, error: examStudentError } = await supabase
        .from('exam_students')
        .select(`
          id,
          exam_id,
          student_id,
          student_code,
          exam:exams!inner (
            id,
            title,
            is_active,
            start_date,
            end_date
          ),
          student:students!inner (
            id,
            name,
            surname
          )
        `)
        .eq('student_code', studentCode.trim())
        .single()

      // Hata kontrolü
      if (examStudentError) {
        // Hata kodlarına göre özel mesajlar gösterelim
        if (examStudentError.code === 'PGRST116') {
          // PGRST116: No rows returned (veri bulunamadı)
          setError('Girdiğiniz öğrenci numarası sistemde bulunamadı. Lütfen kodu kontrol edin veya sınav yöneticinize başvurun.')
        } else if (examStudentError.code === 'PGRST104') {
          // Syntax hatası
          setError('Girdiğiniz kodda geçersiz karakterler var. Lütfen doğru formatı kullanın.')
        } else {
          // Diğer hatalar
          setError(`Sınav kaydı aranırken bir hata oluştu: ${examStudentError.message || 'Bilinmeyen hata'}`)
        }
        
        return
      }
      
      if (!examStudentsData) {
        setError('Girdiğiniz kod ile eşleşen bir sınav kaydı bulunamadı. Lütfen kodu kontrol edin veya sınav yöneticinize başvurun.')
        return
      }

      const typedExamStudentData = examStudentsData as unknown as ExamStudentData;

      // Sınav aktif mi kontrol et
      if (!typedExamStudentData.exam.is_active) {
        setError('Bu sınav aktif değil. Sınav yöneticinizin sınavı başlatmasını bekleyin.')
        return
      }
      
      // Bitiş tarihi varsa ve geçmişse sınava artık girilemez
      if (typedExamStudentData.exam.end_date && new Date(typedExamStudentData.exam.end_date) < new Date()) {
        setError('Bu sınavın süresi dolmuş. Artık giriş yapamazsınız.')
        return
      }

      // Sınav token'ını cookie'ye kaydet
      const tokenData = {
        examId: typedExamStudentData.exam_id,
        studentId: typedExamStudentData.student_id,
        studentCode: typedExamStudentData.student_code,
        studentName: typedExamStudentData.student.name,
        studentSurname: typedExamStudentData.student.surname
      };

      const token = btoa(JSON.stringify(tokenData));
      
      // Cookie'yi httpOnly olmadan ayarla
      document.cookie = `exam_token=${token}; path=/`;
      
      // Sınav sayfasına yönlendir
      router.push(`/exam/${typedExamStudentData.exam_id}`)

    } catch (error: any) {
      // Genel hata mesajı gösterilir, detaylar konsola yazılmaz
      setError('Giriş yapılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-gray-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex justify-center">
              <Image 
                src="https://acadezone.s3.eu-central-1.amazonaws.com/email-assets/mavi.png" 
                alt="Acadezone Logo" 
                width={120} 
                height={40}
                className="h-12 w-auto"
                priority
              />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Sınav Girişi</h2>
            <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="studentCode" className="block text-sm font-medium text-white/90 mb-2">
                Öğrenci Numarası
              </label>
              <div className="relative">
                <input
                  id="studentCode"
                  type="text"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Öğrenci numaranızı giriniz"
                  required
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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

            <div className="mt-6 text-center">
              <p className="text-white/40 text-sm">
                Sınav sistemine hoş geldiniz
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
