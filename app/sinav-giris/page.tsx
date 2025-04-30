'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SinavGiris() {
  const [studentCode, setStudentCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [exams, setExams] = useState<any[]>([])
  const [showExamSelection, setShowExamSelection] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setExams([])
    setShowExamSelection(false)

    try {
      // .single() kaldırıldı, birden fazla sonuç getirebilir
      const { data, error } = await supabase
        .from('exam_students')
        .select('*, exams(*)')
        .eq('student_code', studentCode)

      if (error) throw error

      if (!data || data.length === 0) {
        setError('Geçersiz sınav kodu')
        return
      }

      // Birden fazla sınav varsa seçim ekranı göster
      if (data.length > 1) {
        setExams(data)
        setShowExamSelection(true)
        return
      }

      // Tek sınav varsa direkt yönlendir
      const examData = data[0]
      if (!examData.exams.is_active) {
        setError('Sınav henüz başlatılmadı. Lütfen eğitmeninizin sınavı başlatmasını bekleyin.')
        return
      }

      // Sınava yönlendir
      window.location.href = `/sinav/${examData.exam_id}?code=${studentCode}`
    } catch (err) {
      console.error('Bir hata oluştu:', err)
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const selectExam = (examId: string) => {
    window.location.href = `/sinav/${examId}?code=${studentCode}`
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md p-8 border rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-center">Sınav Girişi</h1>
        
        {!showExamSelection ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="studentCode" className="block text-sm font-medium text-gray-700">
                Sınav Kodunuz (ACAXXX)
              </label>
              <input
                type="text"
                id="studentCode"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                placeholder="ACAXXX"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Kontrol ediliyor...' : 'Sınava Gir'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center mb-4">Katılmak istediğiniz sınavı seçin</h2>
            
            {exams.map((exam) => (
              <div 
                key={exam.exam_id} 
                className="p-4 border rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => selectExam(exam.exam_id)}
              >
                <h3 className="font-medium">{exam.exams.title}</h3>
                <p className="text-sm text-gray-600">
                  {exam.exams.is_active 
                    ? 'Sınav aktif, katılabilirsiniz' 
                    : 'Sınav henüz aktif değil'}
                </p>
              </div>
            ))}
            
            <button
              onClick={() => setShowExamSelection(false)}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
            >
              Geri Dön
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
