import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ExamClient from './ExamClient';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import ClientButton from '@/app/components/ClientButton';

interface PageProps {
  params: { examId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: { params: { examId: string } }): Promise<Metadata> {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: exam } = await supabase
    .from('exams')
    .select('title')
    .eq('id', params.examId)
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
  // Correctly await cookies and get the exam token
  const cookieStore = cookies();
  const examToken = await cookieStore.get('exam_token');
  const examId = params.examId;

  if (!examToken?.value) {
    redirect('/exam-login');
  }

  try {
    // Token'dan öğrenci bilgilerini al (daha güvenli bir yöntem)
    let tokenData;
    try {
      // Server tarafında Buffer kullan
      tokenData = JSON.parse(Buffer.from(examToken.value, 'base64').toString('utf-8'));
    } catch (parseError) {
      console.error('Token parse error:', parseError);
      
      // base64 değilse doğrudan parse etmeyi dene
      try {
        if (examToken.value.startsWith('base64-')) {
          const base64Part = examToken.value.replace('base64-', '');
          tokenData = JSON.parse(Buffer.from(base64Part, 'base64').toString('utf-8'));
        } else {
          tokenData = JSON.parse(examToken.value);
        }
      } catch (fallbackError) {
        console.error('Token fallback parse error:', fallbackError);
        redirect('/exam-login');
      }
    }
    
    // Token içeriğini kontrol et
    if (!tokenData || !tokenData.studentId || !tokenData.examId) {
      console.error('Invalid token data:', tokenData);
      redirect('/exam-login');
    }

    const supabase = createServerComponentClient({ 
      cookies,
    });

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
      .eq('student_id', tokenData.studentId)
      .eq('exam_id', tokenData.examId)
      .single();

    if (examStudentError) {
      console.error('Sınav bilgileri alınamadı:', examStudentError);
      
      return (
        <div className="text-red-500 p-6 flex items-center justify-center min-h-screen bg-gray-900">
          <div className="bg-red-700 text-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-4">Sınav bilgileri alınamadı</h2>
            <p className="mb-4">Lütfen daha sonra tekrar deneyin veya yöneticinizle iletişime geçin.</p>
            <p className="text-sm opacity-75">Hata: {examStudentError.message}</p>
            <ClientButton 
              href="/exam-login" 
              className="mt-4 bg-white text-red-700 px-4 py-2 rounded hover:bg-gray-100"
            >
              Giriş Sayfasına Dön
            </ClientButton>
          </div>
        </div>
      );
    }

    if (!examStudentData || !examStudentData.exams || !examStudentData.students) {
      return (
        <div className="text-red-500 p-6 flex items-center justify-center min-h-screen bg-gray-900">
          <div className="bg-red-700 text-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-4">Bu sınava kaydınız bulunmamaktadır</h2>
            <ClientButton 
              href="/exam-login" 
              className="mt-4 bg-white text-red-700 px-4 py-2 rounded hover:bg-gray-100"
            >
              Giriş Sayfasına Dön
            </ClientButton>
          </div>
        </div>
      );
    }

    // Sınav aktif değilse
    if (!examStudentData.exams.is_active) {
      return (
        <div className="text-yellow-500 p-6 flex items-center justify-center min-h-screen bg-gray-900">
          <div className="bg-yellow-700 text-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-4">Bu sınav aktif değil</h2>
            <p className="mb-4">Sınav yönetici tarafından durdurulmuş olabilir. Lütfen yöneticinizle iletişime geçin.</p>
            <ClientButton 
              href="/exam-login" 
              className="mt-4 bg-white text-yellow-700 px-4 py-2 rounded hover:bg-gray-100"
            >
              Giriş Sayfasına Dön
            </ClientButton>
          </div>
        </div>
      );
    }

    // Sınav verilerini Client component'e aktar
    return (
      <ExamClient 
        examId={examId}
        examData={examStudentData.exams} 
        studentData={examStudentData}
      />
    );

  } catch (error) {
    console.error('Token parse error:', error);
    
    return (
      <div className="text-red-500 p-6 flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-red-700 text-white p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-4">Oturum bilgileriniz geçersiz</h2>
          <p className="mb-4">Lütfen tekrar giriş yapın.</p>
          <ClientButton 
            href="/exam-login" 
            className="mt-4 bg-white text-red-700 px-4 py-2 rounded hover:bg-gray-100"
          >
            Giriş Sayfasına Dön
          </ClientButton>
        </div>
      </div>
    );
  }
}