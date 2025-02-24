import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ExamClient from './ExamClient';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

interface PageProps {
  params: { examId: string };
  searchParams: { student?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const cookieStore = cookies();
  const examId = String(await Promise.resolve(params.examId));
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: exam } = await supabase
    .from('exams')
    .select('title')
    .eq('id', examId)
    .single();

  return {
    title: exam?.title || 'Sınav',
    description: 'Öğrenci Sınav Sayfası',
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ExamPage({
  params,
  searchParams,
}: PageProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore,
  });

  try {
    const studentId = await Promise.resolve(searchParams.student);
    const examId = await Promise.resolve(params.examId);

    if (!studentId) {
      return <div className="text-red-500">Öğrenci ID'si bulunamadı</div>;
    }

    // Sınav ve öğrenci bilgilerini tek sorguda al
    const { data: examStudentData, error: examStudentError } = await supabase
      .from('exam_students')
      .select(`
        id,
        student_id,
        exam_id,
        students (
          id,
          name,
          surname,
          phone
        ),
        exams (
          id,
          title,
          description,
          duration,
          is_active,
          passing_grade,
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
        )
      `)
      .eq('student_id', studentId)
      .eq('exam_id', examId)
      .single();

    if (examStudentError) {
      console.error('Sınav bilgileri alınamadı:', examStudentError);
      return (
        <div className="text-red-500">
          Sınav bilgileri alınamadı. Lütfen daha sonra tekrar deneyin.
        </div>
      );
    }

    if (!examStudentData || !examStudentData.exams || !examStudentData.students) {
      return (
        <div className="text-red-500">
          Bu sınava kaydınız bulunmamaktadır.
        </div>
      );
    }

    if (!examStudentData.exams.questions || examStudentData.exams.questions.length === 0) {
      return (
        <div className="text-red-500">
          Bu sınava henüz soru eklenmemiş.
        </div>
      );
    }

    const examData = {
      id: examStudentData.exams.id,
      title: examStudentData.exams.title,
      description: examStudentData.exams.description,
      duration: examStudentData.exams.duration,
      questions: examStudentData.exams.questions,
      is_active: examStudentData.exams.is_active,
      passing_grade: examStudentData.exams.passing_grade
    };

    const studentData = {
      id: examStudentData.id,
      student_id: examStudentData.student_id,
      exam_id: examStudentData.exam_id,
      students: examStudentData.students
    };

    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <ExamClient
          examId={examId}
          examData={examData}
          studentData={studentData}
        />
      </div>
    );
  } catch (error) {
    console.error('Beklenmeyen bir hata oluştu:', error);
    return (
      <div className="text-red-500">
        Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.
      </div>
    );
  }
}
