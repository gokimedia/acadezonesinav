'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Question {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'fill'
  options: string[]
  correct_answer: string
  student_answer?: string | null
}

export default function ExamPage() {
  const { examId } = useParams()
  const searchParams = useSearchParams()
  const studentCode = searchParams.get('code')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [examData, setExamData] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [examFinished, setExamFinished] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [studentId, setStudentId] = useState('')

  useEffect(() => {
    fetchExamData()
  }, [examId, studentCode])

  useEffect(() => {
    if (timeLeft === null) return

    if (timeLeft <= 0) {
      finishExam()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev !== null ? prev - 1 : null)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const fetchExamData = async () => {
    try {
      // Öğrenci bilgilerini al
      const { data: studentData, error: studentError } = await supabase
        .from('exam_students')
        .select(`
          id,
          students (
            name,
            surname
          )
        `)
        .eq('exam_id', examId)
        .eq('student_code', studentCode)
        .single()

      if (studentError) throw studentError

      if (studentData) {
        setStudentId(studentData.id)
        if (studentData.students) {
          setStudentName(`${studentData.students.name} ${studentData.students.surname}`)
        }
      }

      // Sınav bilgilerini al
      const { data: examInfo, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (examError) throw examError

      if (!examInfo.is_active) {
        setError('Bu sınav henüz başlatılmadı. Lütfen eğitmeninizin sınavı başlatmasını bekleyin.')
        return
      }

      setExamData(examInfo)
      setTimeLeft(examInfo.duration * 60) // Dakikayı saniyeye çevir

      // Soruları al
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('id, question_text, question_type, options, correct_answer')
        .eq('exam_id', examId)
        .order('created_at')

      if (questionError) throw questionError

      // Öğrencinin önceki cevaplarını al
      const { data: answerData, error: answerError } = await supabase
        .from('answers')
        .select('question_id, student_answer')
        .eq('exam_id', examId)
        .eq('student_id', studentId)

      if (answerError) throw answerError

      // Soruları önceki cevaplarla birleştir
      const questionsWithAnswers = (questionData || []).map(q => ({
        ...q,
        student_answer: answerData?.find(a => a.question_id === q.id)?.student_answer || null
      }))

      setQuestions(questionsWithAnswers)
    } catch (err) {
      console.error('Sınav yüklenirken hata:', err)
      setError('Sınav yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (answer: string) => {
    try {
      const currentQuestion = questions[currentQuestionIndex]
      
      // Cevabı kaydet
      const { error: answerError } = await supabase
        .from('answers')
        .insert([{
          exam_id: examId,
          question_id: currentQuestion.id,
          student_id: studentId,
          student_answer: answer,
          is_correct: answer === currentQuestion.correct_answer
        }])

      if (answerError) throw answerError

      // Soruyu güncelle
      const updatedQuestions = [...questions]
      updatedQuestions[currentQuestionIndex] = {
        ...currentQuestion,
        student_answer: answer
      }
      setQuestions(updatedQuestions)

      // Sonraki soruya geç
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
      }
    } catch (err) {
      console.error('Cevap kaydedilirken hata:', err)
      setError('Cevabınız kaydedilirken bir hata oluştu')
    }
  }

  const finishExam = async () => {
    try {
      // Doğru ve yanlış sayılarını hesapla
      let correctCount = 0
      let wrongCount = 0

      questions.forEach(q => {
        if (q.student_answer === q.correct_answer) {
          correctCount++
        } else if (q.student_answer !== null) {
          wrongCount++
        }
      })

      // 100 üzerinden puanı hesapla
      const totalAnswered = correctCount + wrongCount
      const score = totalAnswered > 0 ? (correctCount / totalAnswered) * 100 : 0

      // Sonucu kaydet
      const { error: resultError } = await supabase
        .from('results')
        .insert([{
          exam_id: examId,
          score,
          correct_count: correctCount,
          wrong_count: wrongCount
        }])

      if (resultError) throw resultError

      setExamFinished(true)
    } catch (err) {
      console.error('Sınav sonlandırılırken hata:', err)
      setError('Sınav sonlandırılırken bir hata oluştu')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Sınav yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-8 rounded-lg max-w-md">
          {error}
        </div>
      </div>
    )
  }

  if (examFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Sınav Tamamlandı</h1>
          <p className="text-gray-600">
            Cevaplarınız kaydedildi. Sonuçlar eğitmeniniz tarafından değerlendirilecektir.
          </p>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Öğrenci Bilgisi ve Süre */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{examData.title}</h2>
              <p className="text-gray-600">Hoş geldin, {studentName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Kalan Süre</p>
              <p className="text-2xl font-bold text-blue-600">
                {Math.floor(timeLeft! / 60)}:{(timeLeft! % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>

        {/* İlerleme Durumu */}
        <div className="bg-white p-4 rounded-lg shadow-lg mb-8">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Soru {currentQuestionIndex + 1} / {questions.length}
            </span>
            <div className="w-64 h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Soru */}
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h3 className="text-xl font-medium mb-6">{currentQuestion.question_text}</h3>

          {currentQuestion.question_type === 'multiple_choice' && (
            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className={`w-full p-4 text-left rounded-lg border ${
                    currentQuestion.student_answer === option
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.question_type === 'true_false' && (
            <div className="space-x-4">
              <button
                onClick={() => handleAnswer('true')}
                className={`px-8 py-3 rounded-lg border ${
                  currentQuestion.student_answer === 'true'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                Doğru
              </button>
              <button
                onClick={() => handleAnswer('false')}
                className={`px-8 py-3 rounded-lg border ${
                  currentQuestion.student_answer === 'false'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                Yanlış
              </button>
            </div>
          )}

          {currentQuestion.question_type === 'fill' && (
            <input
              type="text"
              value={currentQuestion.student_answer || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="Cevabınızı yazın..."
            />
          )}
        </div>

        {/* Soru Navigasyonu */}
        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
            className={`px-6 py-2 rounded-lg ${
              currentQuestionIndex === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Önceki Soru
          </button>

          <div className="flex gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full ${
                  currentQuestionIndex === index
                    ? 'bg-blue-600 text-white'
                    : questions[index].student_answer
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (currentQuestionIndex === questions.length - 1) {
                finishExam()
              } else {
                setCurrentQuestionIndex(prev => prev + 1)
              }
            }}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            {currentQuestionIndex === questions.length - 1 ? 'Sınavı Bitir' : 'Sonraki Soru'}
          </button>
        </div>
      </div>
    </div>
  )
}
