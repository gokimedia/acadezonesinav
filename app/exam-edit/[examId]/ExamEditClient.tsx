'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  points: number;
  question_type: string;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  passing_grade: number;
  start_date: string;
  end_date: string;
  questions: Question[];
}

export default function ExamEditClient({ exam }: { exam: Exam }) {
  // ISO string'den local datetime-local formatına çevir
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  };

  // datetime-local'den ISO string formatına çevir
  const formatDateForDB = (dateString: string) => {
    if (!dateString) return null;
    return new Date(dateString).toISOString();
  };

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Initial state'i formatlı tarihlerle oluştur
  const [examData, setExamData] = useState({
    ...exam,
    start_date: formatDateForInput(exam.start_date),
    end_date: formatDateForInput(exam.end_date)
  });

  // Sınav bilgilerini güncelle
  const handleExamUpdate = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Sınav bilgilerini güncelle
      const { error: examError } = await supabase
        .from('exams')
        .update({
          title: examData.title,
          description: examData.description,
          duration: examData.duration,
          passing_grade: examData.passing_grade,
          start_date: formatDateForDB(examData.start_date),
          end_date: formatDateForDB(examData.end_date),
        })
        .eq('id', examData.id);

      if (examError) {
        console.error('Exam update error:', examError);
        throw examError;
      }

      // Soruları güncelle veya ekle
      for (const question of examData.questions) {
        if (question.id) {
          // Mevcut soruyu güncelle
          const { error: updateError } = await supabase
            .from('questions')
            .update({
              question_text: question.question_text,
              option_a: question.option_a,
              option_b: question.option_b,
              option_c: question.option_c,
              option_d: question.option_d,
              correct_answer: question.correct_answer,
              points: question.points,
              question_type: question.question_type,
            })
            .eq('id', question.id);

          if (updateError) {
            console.error('Question update error:', updateError);
            throw updateError;
          }
        } else {
          // Yeni soru ekle
          const { data: newQuestion, error: insertError } = await supabase
            .from('questions')
            .insert({
              exam_id: examData.id,
              question_text: question.question_text,
              option_a: question.option_a,
              option_b: question.option_b,
              option_c: question.option_c,
              option_d: question.option_d,
              correct_answer: question.correct_answer,
              points: question.points,
              question_type: question.question_type,
            })
            .select()
            .single();

          if (insertError) {
            console.error('Question insert error:', insertError);
            throw insertError;
          }

          // State'i güncelle
          question.id = newQuestion.id;
        }
      }

      setMessage('Sınav başarıyla güncellendi');
      
      // Sayfayı yenile
      const { data: updatedExam, error: fetchError } = await supabase
        .from('exams')
        .select(`
          *,
          questions (
            *
          )
        `)
        .eq('id', examData.id)
        .single();

      if (fetchError) {
        console.error('Fetch updated exam error:', fetchError);
        throw fetchError;
      }

      // Tarihleri input formatına çevirerek state'i güncelle
      setExamData({
        ...updatedExam,
        start_date: formatDateForInput(updatedExam.start_date),
        end_date: formatDateForInput(updatedExam.end_date)
      });
      router.refresh();
    } catch (error) {
      console.error('Error in handleExamUpdate:', error);
      setMessage('Bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Yeni soru ekle
  const handleAddQuestion = () => {
    setExamData({
      ...examData,
      questions: [
        ...examData.questions,
        {
          id: '',
          question_text: '',
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_answer: '',
          points: 1,
          question_type: 'multiple_choice',
        },
      ],
    });
  };

  // Soruyu sil
  const handleDeleteQuestion = async (questionId: string) => {
    if (!questionId) {
      // Yeni eklenen soru, sadece state'den kaldır
      setExamData({
        ...examData,
        questions: examData.questions.filter(q => q.id !== questionId),
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      setExamData({
        ...examData,
        questions: examData.questions.filter(q => q.id !== questionId),
      });
    } catch (error) {
      setMessage('Soru silinirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Sınav Düzenle</h1>
          <button
            onClick={handleExamUpdate}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('hata') ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
          }`}>
            {message}
          </div>
        )}

        {/* Sınav Bilgileri */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Sınav Bilgileri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Sınav Adı</label>
              <input
                type="text"
                value={examData.title}
                onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Süre (dakika)</label>
              <input
                type="number"
                value={examData.duration}
                onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Başlangıç Tarihi</label>
              <input
                type="datetime-local"
                value={examData.start_date}
                onChange={(e) => setExamData({ ...examData, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bitiş Tarihi</label>
              <input
                type="datetime-local"
                value={examData.end_date}
                onChange={(e) => setExamData({ ...examData, end_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Açıklama</label>
              <textarea
                value={examData.description}
                onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Sorular */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Sorular</h2>
            <button
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
            >
              Yeni Soru Ekle
            </button>
          </div>

          {examData.questions.map((question, index) => (
            <div key={question.id || index} className="bg-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium">Soru {index + 1}</h3>
                <button
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="text-red-500 hover:text-red-400"
                >
                  Sil
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Soru Metni</label>
                  <textarea
                    value={question.question_text}
                    onChange={(e) => {
                      const newQuestions = [...examData.questions];
                      newQuestions[index].question_text = e.target.value;
                      setExamData({ ...examData, questions: newQuestions });
                    }}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['a', 'b', 'c', 'd'].map((option) => (
                    <div key={option}>
                      <label className="block text-sm font-medium mb-2">
                        Seçenek {option.toUpperCase()}
                      </label>
                      <input
                        type="text"
                        value={question[`option_${option}` as keyof Question]}
                        onChange={(e) => {
                          const newQuestions = [...examData.questions];
                          newQuestions[index][`option_${option}` as keyof Question] = e.target.value;
                          setExamData({ ...examData, questions: newQuestions });
                        }}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Doğru Cevap</label>
                    <select
                      value={question.correct_answer}
                      onChange={(e) => {
                        const newQuestions = [...examData.questions];
                        newQuestions[index].correct_answer = e.target.value;
                        setExamData({ ...examData, questions: newQuestions });
                      }}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                    >
                      <option value="">Seçiniz</option>
                      <option value="a">A</option>
                      <option value="b">B</option>
                      <option value="c">C</option>
                      <option value="d">D</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Puan</label>
                    <input
                      type="number"
                      value={question.points}
                      onChange={(e) => {
                        const newQuestions = [...examData.questions];
                        newQuestions[index].points = parseInt(e.target.value);
                        setExamData({ ...examData, questions: newQuestions });
                      }}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Soru Tipi</label>
                    <select
                      value={question.question_type}
                      onChange={(e) => {
                        const newQuestions = [...examData.questions];
                        newQuestions[index].question_type = e.target.value;
                        setExamData({ ...examData, questions: newQuestions });
                      }}
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg"
                    >
                      <option value="multiple_choice">Çoktan Seçmeli</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
