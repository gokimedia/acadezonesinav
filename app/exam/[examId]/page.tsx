import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ExamClient from './ExamClient';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import ClientButton from '@/app/components/ClientButton';

// Import edilmiş interface'ler ExamClient ile aynı olacaktır
// Tip hatalarını önlemek için ExamClient'ta tanımlı olanlarla aynı yapıya sahip yeni interface'ler tanımlıyoruz
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
  [key: string]: string | number; // İndeks imzası eklendi ExamClient ile aynı
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  questions: Question[];
  is_active: boolean;
  passing_grade: number;
}

interface Student {
  id: string;
  name: string;
  surname: string;
  phone: string;
}

interface ExamStudentData {
  id: string;
  student_id: string;
  exam_id: string;
  students: Student;
}

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
  const cookieStore = await cookies();
  const examToken = cookieStore.get('exam_token');
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

    // Tek bir Supabase istemcisi oluşturun ve tüm sorguları bu istemci üzerinden yapın
    const supabase = createServerComponentClient({ 
      cookies,
    });

    // Optimize edilmiş sorgu - tek seferde hem sınav hem öğrenci verilerini al
    // İhtiyaç duyulan alanları seçerek ağ trafiğini azalt
    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select(`
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
      `)
      .eq('id', params.examId)
      .single();
      
    if (examError) {
      console.error("Sınav bilgisi alınırken hata:", examError);
      return (
        <div className="text-red-500 p-6 flex items-center justify-center min-h-screen bg-gray-900">
          <div className="bg-red-700 text-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-4">Sınav bilgileri alınamadı</h2>
            <p className="mb-4">Lütfen daha sonra tekrar deneyin veya yöneticinizle iletişime geçin.</p>
            <p className="text-sm opacity-75">Hata: {examError.message}</p>
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
    
    if (!examData) {
      console.error("Sınav bulunamadı");
      return (
        <div className="text-red-500 p-6 flex items-center justify-center min-h-screen bg-gray-900">
          <div className="bg-red-700 text-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-4">Sınav bulunamadı</h2>
            <p className="mb-4">Bu sınav ID'si ile eşleşen bir sınav bulunamadı.</p>
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
    
    // Öğrenci bilgilerini al - studentCode veya student_id ile deneyin, iki sorgu yerine tek sorgu
    let queryField = 'student_code';
    let queryValue = tokenData.studentCode;
    
    // Token'da studentCode yoksa student_id kullan
    if (!tokenData.studentCode && tokenData.studentId) {
      queryField = 'student_id';
      queryValue = tokenData.studentId;
    }
    
    const { data: studentData, error: studentError } = await supabase
      .from('exam_students')
      .select(`
        id,
        student_id,
        students (
          id,
          name, 
          surname,
          phone
        )
      `)
      .eq('exam_id', params.examId)
      .eq(queryField, queryValue)
      .single();
      
    if (studentError || !studentData) {
      console.error("Öğrenci bilgisi alınırken hata:", studentError);
      
      return (
        <div className="text-red-500 p-6 flex items-center justify-center min-h-screen bg-gray-900">
          <div className="bg-red-700 text-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-4">Öğrenci kaydı bulunamadı</h2>
            <p className="mb-4">Bu sınava kayıtlı öğrenci bilgisi bulunamadı.</p>
            <p className="text-sm opacity-75">Hata: {studentError?.message}</p>
            <p className="text-sm opacity-75 mt-2">Sınav ID: {params.examId}</p>
            <p className="text-sm opacity-75">Token Öğrenci Kodu: {tokenData.studentCode || tokenData.studentId}</p>
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
    
    return processAndRenderExam(examData, studentData, examId);
    
  } catch (error) {
    console.error("Beklenmeyen hata:", error);
    return (
      <div className="text-red-500 p-6 flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-red-700 text-white p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-4">Bir hata oluştu</h2>
          <p className="mb-4">Sınav yüklenirken beklenmeyen bir hata oluştu.</p>
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

// processAndRenderExam fonksiyonu ekleyelim
function processAndRenderExam(examData: any, studentData: any, examId: string) {
  // Sınav aktif değilse
  if (!examData.is_active) {
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
  
  // Soru verilerini dönüştür ve indeks imzası ekle
  const processedQuestions: Question[] = examData.questions.map((q: any) => ({
    id: q.id,
    question_text: q.question_text,
    option_a: q.option_a,
    option_b: q.option_b,
    option_c: q.option_c,
    option_d: q.option_d,
    correct_answer: q.correct_answer,
    points: q.points,
    question_type: q.question_type
  }));
  
  // Sınav verilerini düzenle
  const processedExamData: Exam = {
    id: examData.id,
    title: examData.title,
    description: examData.description,
    duration: examData.duration,
    is_active: examData.is_active,
    passing_grade: examData.passing_grade,
    questions: processedQuestions
  };
  
  // Öğrenci verisi için bir dizi değil tek bir öğrenciye ihtiyaç var
  const student = Array.isArray(studentData.students) 
    ? studentData.students[0] 
    : studentData.students;
  
  // Öğrenci verilerini düzenle  
  const processedStudentData: ExamStudentData = {
    id: studentData.id,
    student_id: studentData.student_id,
    exam_id: examId,
    students: {
      id: student.id,
      name: student.name,
      surname: student.surname,
      phone: student.phone || ""
    }
  };

  // Sınav verilerini Client component'e aktar
  return (
    <ExamClient 
      examId={examId}
      examData={processedExamData} 
      studentData={processedStudentData}
    />
  );
}