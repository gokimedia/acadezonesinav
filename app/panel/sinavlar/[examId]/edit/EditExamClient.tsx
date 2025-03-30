'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Tür tanımlarını doğrudan burada yapıyoruz
interface Question {
  id: string;
  exam_id: string;
  content: string;
  order: number;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  start_time: string;
  end_time: string;
}

export default function EditExamClient({ examId }: { examId: string }) {
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExam();
  }, []);

  const fetchExam = async () => {
    try {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;

      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order');

      if (questionError) throw questionError;

      setExam(examData);
      setQuestions(questionData || []);
    } catch (error) {
      console.error('Error fetching exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExamUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('exams')
        .update({
          title: exam?.title,
          description: exam?.description,
          duration: exam?.duration,
          start_time: exam?.start_time,
          end_time: exam?.end_time
        })
        .eq('id', examId);

      if (error) throw error;
      router.push('/panel/sinavlar');
    } catch (error) {
      console.error('Error updating exam:', error);
    }
  };

  if (loading) return <div>Yükleniyor...</div>;
  if (!exam) return <div>Sınav bulunamadı</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sınavı Düzenle</h1>
      
      <form onSubmit={handleExamUpdate} className="space-y-4">
        <div>
          <label className="block mb-2">Sınav Başlığı</label>
          <input
            type="text"
            value={exam.title || ''}
            onChange={(e) => setExam({ ...exam, title: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Açıklama</label>
          <textarea
            value={exam.description || ''}
            onChange={(e) => setExam({ ...exam, description: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Süre (dakika)</label>
          <input
            type="number"
            value={exam.duration || 0}
            onChange={(e) => setExam({ ...exam, duration: parseInt(e.target.value) })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Başlangıç Zamanı</label>
          <input
            type="datetime-local"
            value={exam.start_time?.slice(0, 16) || ''}
            onChange={(e) => setExam({ ...exam, start_time: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Bitiş Zamanı</label>
          <input
            type="datetime-local"
            value={exam.end_time?.slice(0, 16) || ''}
            onChange={(e) => setExam({ ...exam, end_time: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Değişiklikleri Kaydet
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Sorular</h2>
        {questions.map((question, index) => (
          <div key={question.id} className="border p-4 mb-4 rounded">
            <div className="font-bold">Soru {index + 1}</div>
            <div>{question.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
