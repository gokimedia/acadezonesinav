'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  ChevronLeft,
  ChevronRight, 
  AlertTriangle,
  XCircle,
  Flag,
  Loader2,
  Check,
  X,
  Send,
  User,
  BookOpen,
  ChevronDown
} from 'lucide-react'
import { Transition } from '@headlessui/react'

interface Question {
  id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'fill'
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  correct_answer: string
  points?: number
  student_answer?: string | null
  options?: string[] // UI için türetilmiş alan
  isMarked?: boolean // Öğrencinin işaretlediği sorular
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
  const [studentId, setStudentId] = useState<string | null>(null)
  const [fillAnswerText, setFillAnswerText] = useState('')
  const [examStartTime, setExamStartTime] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmingFinish, setConfirmingFinish] = useState(false)
  const [showQuestionList, setShowQuestionList] = useState(false)
  
  const answerTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const questionContainerRef = useRef<HTMLDivElement>(null)

  // Fetch exam data when component mounts
  useEffect(() => {
    fetchExamData()
  }, [examId, studentCode])

  // Timer countdown
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

  // Sayfa yeniden yüklendiğinde localStorage'dan süreyi kontrol et
  useEffect(() => {
    // Bu kodu kaldırıyoruz çünkü artık sadece veritabanına güveneceğiz
    // const storedStartTime = localStorage.getItem(`exam_${examId}_start_time`)
    // if (storedStartTime) {
    //   setExamStartTime(storedStartTime)
    //   console.log("LocalStorage'dan başlangıç zamanı alındı:", storedStartTime)
    // }
  }, [examId])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current)
      }
    }
  }, [])

  // Scroll to top when changing questions
  useEffect(() => {
    if (questionContainerRef.current) {
      questionContainerRef.current.scrollTo(0, 0)
    }
  }, [currentQuestionIndex])
  
  // Format time left as mm:ss
  const formatTimeLeft = () => {
    if (timeLeft === null) return "--:--"
    
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    
    return `\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}`
  }

  // Format time left with hours if needed
  const formatTimeLeftVerbose = () => {
    if (timeLeft === null) return "Süre bilgisi yüklenemedi"
    
    const hours = Math.floor(timeLeft / 3600)
    const minutes = Math.floor((timeLeft % 3600) / 60)
    const seconds = timeLeft % 60
    
    if (hours > 0) {
      return `\${hours} saat \${minutes} dakika \${seconds} saniye`
    } else if (minutes > 0) {
      return `\${minutes} dakika \${seconds} saniye`
    } else {
      return `\${seconds} saniye`
    }
  }
  
  // Calculate exam progress
  const calculateProgress = () => {
    const answeredCount = questions.filter(q => q.student_answer !== null && q.student_answer !== '').length
    return (answeredCount / questions.length) * 100
  }

  const fetchExamData = async () => {
    try {
      console.log("Sınav verileri getiriliyor...", examId, studentCode)
      
      // Get student info
      const { data: studentData, error: studentError } = await supabase
        .from('exam_students')
        .select(`
          id,
          student_id,
          students:students(
            name,
            surname
          ),
          exam_start_time
        `)
        .eq('exam_id', examId)
        .eq('student_code', studentCode)
        .single()

      if (studentError) {
        console.error("Öğrenci bilgisi alınırken hata:", studentError)
        throw studentError
      }

      console.log("Öğrenci verisi:", studentData)

      if (studentData) {
        setStudentId(studentData.id)
        if (studentData.students) {
          const student = studentData.students[0] || {}
          setStudentName(`${student.name || ''} ${student.surname || ''}`)
        }
        
        // Veritabanındaki başlangıç zamanını kaydet
        if (studentData.exam_start_time) {
          setExamStartTime(studentData.exam_start_time)
          console.log("Veritabanından başlangıç zamanı alındı:", studentData.exam_start_time)
        }
      }

      // Get exam info
      const { data: examInfo, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single()

      if (examError) {
        console.error("Sınav bilgisi alınırken hata:", examError)
        throw examError
      }

      console.log("Sınav verisi:", examInfo)

      if (!examInfo.is_active) {
        setError('Bu sınav henüz başlatılmadı. Lütfen eğitmeninizin sınavı başlatmasını bekleyin.')
        setLoading(false)
        return
      }

      setExamData(examInfo)
      
      if (!studentData?.id) {
        setError('Öğrenci bilgileri yüklenemedi.')
        setLoading(false)
        return
      }

      // Zamanı hesapla
      const totalExamDuration = examInfo.duration * 60; // Toplam sınav süresi (saniye)
      
      // Sadece veritabanındaki başlangıç zamanını kullan, localStorage'ı tamamen yoksay
      const startTimeToUse = studentData.exam_start_time || null;
      
      console.log("Kullanılacak başlangıç zamanı:", startTimeToUse);
      
      if (startTimeToUse) {
        // Daha önce başlangıç zamanı kaydedilmiş
        const examStartTime = new Date(startTimeToUse).getTime();
        const currentTime = new Date().getTime();
        const elapsedSeconds = Math.floor((currentTime - examStartTime) / 1000);
        
        // Kalan süreyi hesapla, negatif olamaz
        const remainingTime = Math.max(0, totalExamDuration - elapsedSeconds);
        
        console.log(`SÜRE HESAPLAMA:
          Sınav Başlangıç: ${new Date(examStartTime).toLocaleString()}
          Şimdi: ${new Date(currentTime).toLocaleString()}
          Geçen süre: ${elapsedSeconds} sn
          Toplam süre: ${totalExamDuration} sn
          Kalan süre: ${remainingTime} sn`);
        
        setTimeLeft(remainingTime);
      } else {
        // İlk kez sınava başlıyorsa, başlangıç zamanını kaydet
        const now = new Date().toISOString();
        
        // Veritabanına kaydet
        const { error: updateError } = await supabase
          .from('exam_students')
          .update({ exam_start_time: now })
          .eq('id', studentData.id);
          
        if (updateError) {
          console.error('Sınav başlangıç zamanı kaydedilemedi:', updateError);
        } else {
          console.log("Yeni başlangıç zamanı veritabanına kaydedildi:", now);
        }
        
        setExamStartTime(now);
        
        // Tam süreyi ayarla
        setTimeLeft(totalExamDuration);
        console.log("İlk başlangıç - tam süre ayarlandı:", totalExamDuration);
      }

      // Get questions
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, points')
        .eq('exam_id', examId)
        .order('created_at')

      if (questionError) throw questionError

      // Get student's previous answers
      const { data: answerData, error: answerError } = await supabase
        .from('answers')
        .select('question_id, student_answer')
        .eq('exam_id', examId)
        .eq('student_id', studentData.id)

      if (answerError) throw answerError

      // Create options array and combine questions with previous answers
      const questionsWithAnswers = (questionData || []).map(q => {
        // Get non-null options and convert to options array
        const options: string[] = []
        if (q.option_a) options.push(q.option_a)
        if (q.option_b) options.push(q.option_b)
        if (q.option_c) options.push(q.option_c)
        if (q.option_d) options.push(q.option_d)

        return {
          ...q,
          options,
          student_answer: answerData?.find(a => a.question_id === q.id)?.student_answer || null,
          isMarked: false
        }
      })

      setQuestions(questionsWithAnswers)
    } catch (err) {
      console.error('Error loading exam:', err)
      setError('Sınav yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (answer: string) => {
    try {
      if (!studentId || !examId) return

      const currentQuestion = questions[currentQuestionIndex]
      
      // Save answer
      setIsSubmitting(true)
      
      const { error: answerError } = await supabase
        .from('answers')
        .upsert([{
          exam_id: examId,
          question_id: currentQuestion.id,
          student_id: studentId,
          student_answer: answer,
          is_correct: answer === currentQuestion.correct_answer
        }], { onConflict: 'exam_id,question_id,student_id' })

      if (answerError) throw answerError

      // Update question
      const updatedQuestions = [...questions]
      updatedQuestions[currentQuestionIndex] = {
        ...currentQuestion,
        student_answer: answer
      }
      setQuestions(updatedQuestions)
      setIsSubmitting(false)

      // Move to next question automatically for multiple choice and true/false
      if (currentQuestion.question_type !== 'fill' && currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1)
        }, 300)
      }
    } catch (err) {
      console.error('Error saving answer:', err)
      setError('Cevabınız kaydedilirken bir hata oluştu')
      setIsSubmitting(false)
    }
  }

  // Handle fill-in-the-blank questions with debounce
  const handleFillAnswer = (value: string) => {
    setFillAnswerText(value)
    
    // Clear previous timeout
    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current)
    }
    
    // Save answer after 600ms
    answerTimeoutRef.current = setTimeout(() => {
      handleAnswer(value)
    }, 600)
  }

  const finishExam = async () => {
    setIsSubmitting(true)
    
    try {
      if (!studentId || !examId) return

      // Calculate correct and wrong counts
      let correctCount = 0
      let wrongCount = 0
      let totalPoints = 0
      let earnedPoints = 0

      questions.forEach(q => {
        const pointValue = q.points || 1
        totalPoints += pointValue
        
        if (q.student_answer === q.correct_answer) {
          correctCount++
          earnedPoints += pointValue
        } else if (q.student_answer !== null && q.student_answer !== '') {
          wrongCount++
        }
      })

      // Calculate score out of 100
      const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0

      // Save result
      const { error: resultError } = await supabase
        .from('results')
        .insert([{
          exam_id: examId,
          student_id: studentId,
          score,
          correct_count: correctCount,
          wrong_count: wrongCount,
          total_questions: questions.length
        }])

      if (resultError) throw resultError

      setExamFinished(true)
    } catch (err) {
      console.error('Error finishing exam:', err)
      setError('Sınav sonlandırılırken bir hata oluştu')
    } finally {
      setIsSubmitting(false)
      setConfirmingFinish(false)
    }
  }
  
  // Mark a question for review
  const toggleMarkQuestion = (index: number) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      isMarked: !updatedQuestions[index].isMarked
    }
    setQuestions(updatedQuestions)
  }
  
  // Calculate answer status counts
  const getQuestionStatusCounts = () => {
    return {
      answered: questions.filter(q => q.student_answer !== null && q.student_answer !== '').length,
      unanswered: questions.filter(q => q.student_answer === null || q.student_answer === '').length,
      marked: questions.filter(q => q.isMarked).length
    }
  }

  // Render question numbers navigation
  const renderQuestionNumbers = () => {
    return questions.map((question, index) => {
      let bgColor = "bg-slate-200 text-slate-700"
      
      if (question.isMarked) {
        bgColor = "bg-amber-100 text-amber-700 border border-amber-300"
      } else if (question.student_answer !== null && question.student_answer !== '') {
        bgColor = "bg-emerald-100 text-emerald-700"
      }
      
      if (currentQuestionIndex === index) {
        bgColor = "bg-blue-600 text-white"
      }
      
      return (
        <button
          key={index}
          onClick={() => setCurrentQuestionIndex(index)}
          className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm \${bgColor} transition-colors`}
        >
          {index + 1}
        </button>
      )
    })
  }
  
  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-6 max-w-sm mx-auto">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Sınav Yükleniyor</h2>
          <p className="text-slate-600">
            Lütfen bekleyin, sınav soruları hazırlanıyor...
          </p>
        </div>
      </div>
    )
  }

  // Error screen
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6 max-w-lg w-full">
          <div className="flex items-start gap-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Bir Sorun Oluştu</h2>
              <p className="text-slate-700 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Tekrar Deneyin
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Exam finished screen
  if (examFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">Sınav Tamamlandı</h1>
          <p className="text-slate-600 mb-6">
            Cevaplarınız başarıyla kaydedildi. Sonuçlar eğitmeniniz tarafından değerlendirildikten sonra size iletilecektir.
          </p>
          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Pencereyi Kapat
          </button>
        </div>
      </div>
    )
  }

  // No questions available
  if (!questions.length || !examData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-xl shadow-lg border border-amber-100 p-6 max-w-md w-full">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Sınav Soruları Bulunamadı</h2>
              <p className="text-slate-700">
                Bu sınavda henüz soru bulunmamaktadır veya sınav verisi yüklenemedi. Lütfen eğitmeninize başvurun.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const { answered, unanswered, marked } = getQuestionStatusCounts()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header - always visible */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <h1 className="font-semibold text-slate-800 truncate">{examData.title}</h1>
            </div>
            
            {/* Timer */}
            <div 
              className={`flex items-center gap-2 \${
                timeLeft !== null && timeLeft < 300 ? 'text-red-600' : 'text-slate-700'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span className="font-mono font-medium">{formatTimeLeft()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col sm:flex-row">
        {/* Left sidebar on larger screens */}
        <div className="hidden sm:block sm:w-64 md:w-80 p-4 bg-white border-r border-slate-200 overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <User className="h-4 w-4 text-slate-500" />
              <h2 className="font-medium text-slate-900">{studentName}</h2>
            </div>
            <div className="text-sm text-slate-500">
              Kalan süre: <span className="font-medium">{formatTimeLeftVerbose()}</span>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-slate-900">İlerleme Durumu</h3>
              <span className="text-sm font-medium text-blue-600">{Math.round(calculateProgress())}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `\${calculateProgress()}%` }}
              />
            </div>
            
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-1.5 bg-slate-100 rounded">
                <div className="font-medium">{answered}</div>
                <div className="text-slate-500">Yanıtlanan</div>
              </div>
              <div className="p-1.5 bg-slate-100 rounded">
                <div className="font-medium">{unanswered}</div>
                <div className="text-slate-500">Boş</div>
              </div>
              <div className="p-1.5 bg-amber-50 rounded">
                <div className="font-medium text-amber-700">{marked}</div>
                <div className="text-amber-600">İşaretli</div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium text-slate-900 mb-3">Tüm Sorular</h3>
            <div className="grid grid-cols-4 gap-2">
              {renderQuestionNumbers()}
            </div>
          </div>
          
          <button
            onClick={() => setConfirmingFinish(true)}
            className="w-full mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Sınavı Bitir
          </button>
        </div>
        
        {/* Main content area */}
        <main 
          ref={questionContainerRef} 
          className="flex-1 p-4 sm:p-6 pb-28 sm:pb-6 overflow-y-auto relative"
        >
          <div className="max-w-3xl mx-auto">
            {/* Progress info (mobile) */}
            <div className="sm:hidden bg-white rounded-xl shadow-sm p-4 mb-4 border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">
                  Soru {currentQuestionIndex + 1} / {questions.length}
                </span>
                <button 
                  onClick={() => setShowQuestionList(prev => !prev)}
                  className="text-sm text-blue-600 font-medium flex items-center gap-1"
                >
                  {showQuestionList ? 'Gizle' : 'Tüm Sorular'}
                  <ChevronDown className={`h-4 w-4 transition-transform \${showQuestionList ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `\${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
              
              {/* Show questions list on mobile */}
              {showQuestionList && (
                <div className="mt-3 grid grid-cols-6 gap-2 max-h-32 overflow-y-auto pt-2 border-t border-slate-100">
                  {renderQuestionNumbers()}
                </div>
              )}
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 mb-6">
              {/* Question number and mark button */}
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
                  Soru {currentQuestionIndex + 1}
                </div>
                <button
                  onClick={() => toggleMarkQuestion(currentQuestionIndex)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium \${
                    currentQuestion.isMarked
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Flag className="h-4 w-4" />
                  {currentQuestion.isMarked ? 'İşareti Kaldır' : 'İşaretle'}
                </button>
              </div>
              
              {/* Question text */}
              <h2 className="text-lg sm:text-xl font-medium text-slate-800 mb-6">
                {currentQuestion.question_text}
              </h2>

              {/* Multiple choice answers */}
              {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = currentQuestion.student_answer === option;
                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswer(option)}
                        disabled={isSubmitting}
                        className={`w-full p-4 text-left rounded-lg border transition-all \${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center \${
                            isSelected 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True/False answers */}
              {currentQuestion.question_type === 'true_false' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAnswer('true')}
                    disabled={isSubmitting}
                    className={`px-5 py-4 rounded-lg border flex items-center gap-3 transition-all \${
                      currentQuestion.student_answer === 'true'
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center \${
                      currentQuestion.student_answer === 'true'
                        ? 'bg-blue-600'
                        : 'bg-slate-100'
                    }`}>
                      <Check className={`w-4 h-4 \${
                        currentQuestion.student_answer === 'true' ? 'text-white' : 'text-slate-400'
                      }`} />
                    </div>
                    <span>Doğru</span>
                  </button>
                  
                  <button
                    onClick={() => handleAnswer('false')}
                    disabled={isSubmitting}
                    className={`px-5 py-4 rounded-lg border flex items-center gap-3 transition-all \${
                      currentQuestion.student_answer === 'false'
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center \${
                      currentQuestion.student_answer === 'false'
                        ? 'bg-blue-600'
                        : 'bg-slate-100'
                    }`}>
                      <X className={`w-4 h-4 \${
                        currentQuestion.student_answer === 'false' ? 'text-white' : 'text-slate-400'
                      }`} />
                    </div>
                    <span>Yanlış</span>
                  </button>
                </div>
              )}

              {/* Fill in the blank answer */}
              {currentQuestion.question_type === 'fill' && (
                <div className="mt-2">
                  <label className="block mb-1.5 text-sm text-slate-500">
                    Cevabınızı aşağıya yazın
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={currentQuestion.student_answer || fillAnswerText}
                      onChange={(e) => handleFillAnswer(e.target.value)}
                      className="w-full p-4 pr-12 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Cevabınızı buraya yazın..."
                      autoComplete="off"
                    />
                    {isSubmitting ? (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                      </div>
                    ) : currentQuestion.student_answer ? (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Cevabınız otomatik olarak kaydedilecektir.
                  </p>
                </div>
              )}
            </div>
            
            {/* Navigation buttons - larger screens */}
            <div className="hidden sm:flex justify-between items-center">
              <button
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                disabled={currentQuestionIndex === 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors \${
                  currentQuestionIndex === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Önceki Soru</span>
              </button>
              
              <div className="flex gap-2">
                {currentQuestionIndex === questions.length - 1 && (
                  <button
                    onClick={() => setConfirmingFinish(true)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sınavı Bitir
                  </button>
                )}
                
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors \${
                    currentQuestionIndex === questions.length - 1
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <span>Sonraki Soru</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Mobile navigation bar - fixed at bottom */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 z-10">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
            disabled={currentQuestionIndex === 0}
            className={`w-12 h-12 flex items-center justify-center rounded-full \${
              currentQuestionIndex === 0
                ? 'bg-slate-100 text-slate-400'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => setConfirmingFinish(true)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg"
          >
            Sınavı Bitir
          </button>
          
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            disabled={currentQuestionIndex === questions.length - 1}
            className={`w-12 h-12 flex items-center justify-center rounded-full \${
              currentQuestionIndex === questions.length - 1
                ? 'bg-slate-100 text-slate-400'
                : 'bg-blue-600 text-white'
            }`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Confirm finish exam modal */}
      <Transition show={confirmingFinish} as={Fragment}>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-25" />
            </Transition.Child>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">
                    Sınavı Bitirmek İstiyor musunuz?
                  </h3>
                </div>
                
                <p className="text-slate-600 mb-3">
                  Sınavı bitirdiğinizde geri dönüp yanıtlarınızı değiştiremezsiniz.
                </p>
                
                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    onClick={() => setConfirmingFinish(false)}
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    onClick={finishExam}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Tamamlanıyor...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Evet, Sınavı Bitir</span>
                      </>
                    )}
                  </button>
                </div>
                
                {unanswered > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm text-amber-700">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>
                        <strong>Uyarı:</strong> Henüz cevaplanmamış {unanswered} soru bulunmaktadır.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Transition.Child>
          </div>
        </div>
      </Transition>
    </div>
  )
}