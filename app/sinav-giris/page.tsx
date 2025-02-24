'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SinavGiris() {
  const [studentCode, setStudentCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('exam_students')
        .select('*, exams(*)')
        .eq('student_code', studentCode)
        .single()

      if (error) throw error

      if (!data) {
        setError('Geçersiz sınav kodu')
        return
      }

      if (!data.exams.is_active) {
        setError('Sınav henüz başlatılmadı. Lütfen eğitmeninizin sınavı başlatmasını bekleyin.')
        return
      }

      // Sınava yönlendir
      window.location.href = `/sinav/${data.exam_id}?code=${studentCode}`
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md p-8 border rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-8 text-center">Sınav Girişi</h1>
        
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
      </div>
    </main>
  )
}
