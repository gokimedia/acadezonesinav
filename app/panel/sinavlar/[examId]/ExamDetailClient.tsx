'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  department_id: string;
}

interface Question {
  id: string;
  content: string;
  type: string;
  correct_answer: string;
  options?: string[];
  order: number;
}

export default function ExamDetailClient({ examId }: { examId: string }) {
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    fetchExamData();
  }, []);

  const fetchExamData = async () => {
    try {
      // Fetch exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;

      // Fetch exam questions
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order');

      if (questionError) throw questionError;

      // Fetch student count
      const { count, error: countError } = await supabase
        .from('exam_students')
        .select('*', { count: 'exact' })
        .eq('exam_id', examId);

      if (countError) throw countError;

      setExam(examData);
      setQuestions(questionData || []);
      setStudentCount(count || 0);
    } catch (error) {
      console.error('Error fetching exam data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      let isActive = false;
      
      if (newStatus === 'active') {
        isActive = true;
      } else if (newStatus === 'pending' || newStatus === 'completed') {
        isActive = false;
      }
      
      const { error } = await supabase
        .from('exams')
        .update({ is_active: isActive })
        .eq('id', examId);

      if (error) throw error;
      
      // Yerel durum güncellemesi
      setExam(exam ? { ...exam, is_active: isActive } : null);
    } catch (error) {
      console.error('Error updating exam status:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu sınavı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;
      router.push('/panel/sinavlar');
    } catch (error) {
      console.error('Error deleting exam:', error);
    }
  };

  if (loading) return <div>Yükleniyor...</div>;
  if (!exam) return <div>Sınav bulunamadı</div>;

  const isActive = exam.is_active;
  const isPending = !exam.is_active;
  const isCompleted = !exam.is_active;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{exam.title}</h1>
        <div className="space-x-2">
          <Link
            href={`/panel/sinavlar/${examId}/edit`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Düzenle
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sil
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Sınav Bilgileri</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Açıklama:</span> {exam.description}</p>
            <p><span className="font-medium">Süre:</span> {exam.duration} dakika</p>
            <p><span className="font-medium">Başlangıç:</span> {new Date(exam.start_time).toLocaleString('tr-TR')}</p>
            <p><span className="font-medium">Bitiş:</span> {new Date(exam.end_time).toLocaleString('tr-TR')}</p>
            <p><span className="font-medium">Durum:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                isActive ? 'bg-green-100 text-green-800' :
                isPending ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {isActive ? 'Aktif' : 'Beklemede'}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Hızlı İşlemler</h2>
          <div className="space-y-4">
            <div>
              <p className="mb-2">Sınav Durumu:</p>
              <div className="space-x-2">
                <button
                  onClick={() => handleStatusChange('pending')}
                  className={`px-3 py-1 rounded ${
                    isPending ? 'bg-yellow-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Beklemede
                </button>
                <button
                  onClick={() => handleStatusChange('active')}
                  className={`px-3 py-1 rounded ${
                    isActive ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Aktif
                </button>
                <button
                  onClick={() => handleStatusChange('completed')}
                  className={`px-3 py-1 rounded ${
                    isCompleted ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Tamamlandı
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Link
                href={`/panel/sinavlar/${examId}/ogrenciler`}
                className="block bg-purple-500 text-white px-4 py-2 rounded text-center hover:bg-purple-600"
              >
                Öğrenciler ({studentCount})
              </Link>
              <Link
                href={`/panel/canli-sonuclar/${examId}`}
                className="block bg-green-500 text-white px-4 py-2 rounded text-center hover:bg-green-600"
              >
                Canlı Sonuçlar
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Sorular ({questions.length})</h2>
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="border rounded p-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium">Soru {index + 1}:</span>
                  <p className="mt-1">{question.content}</p>
                  
                  {question.type === 'multiple_choice' && question.options && (
                    <div className="mt-2 ml-4">
                      {question.options.map((option, i) => (
                        <div key={i} className={`${
                          option === question.correct_answer ? 'text-green-600 font-medium' : ''
                        }`}>
                          {String.fromCharCode(65 + i)}. {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-500">{question.type}</span>
              </div>
            </div>
          ))}
          
          {questions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Bu sınava henüz soru eklenmemiş.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
