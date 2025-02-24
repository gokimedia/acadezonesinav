import { createClient } from '@supabase/supabase-js';
import ExamEditClient from './ExamEditClient';

export default async function ExamEditPage({
  params,
}: {
  params: { examId: string };
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Sınav ve soru bilgilerini al
  const { data: exam } = await supabase
    .from('exams')
    .select(`
      id,
      title,
      description,
      duration,
      passing_grade,
      start_date,
      end_date,
      questions (
        id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        points,
        question_type
      )
    `)
    .eq('id', params.examId)
    .single();

  if (!exam) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sınav Bulunamadı</h1>
          <p>Belirtilen sınav sistemde bulunamadı.</p>
        </div>
      </div>
    );
  }

  return <ExamEditClient exam={exam} />;
}
