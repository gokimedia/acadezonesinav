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
      .eq('exam_id', params.examId)
      .single();

    // Hata loglaması ekleyelim
    console.log("Sınav ID:", params.examId);
    console.log("Öğrenci ID:", tokenData.studentId);
    console.log("Token'daki sınav ID:", tokenData.examId);
    console.log("Sorgu sonucu:", examStudentData);
    console.log("Sorgu hatası:", examStudentError);

    if (examStudentError) {
      console.error('Sınav bilgileri alınamadı:', examStudentError);
      
      // URL'deki sınav ID'si ile token'daki sınav ID'si farklıysa alternatif sorgu yap
      if (params.examId !== tokenData.examId) {
        console.log("URL ve token'daki sınav ID'leri farklı, alternatif sorgu yapılıyor");
        
        const { data: altExamStudentData, error: altExamStudentError } = await supabase
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
          .eq('exam_id', tokenData.examId) // Token'dan alınan exam ID'sini kullan
          .single();
          
        // Alternatif sorgu başarılıysa onu kullan
        if (!altExamStudentError && altExamStudentData) {
          console.log("Alternatif sorgu başarılı:", altExamStudentData);
          return processExamData(altExamStudentData, params.examId);
        }
      }
      
      return (
        <div className="text-red-500 p-6 flex items-center justify-center min-h-screen bg-gray-900">
          <div className="bg-red-700 text-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-4">Sınav bilgileri alınamadı</h2>
            <p className="mb-4">Lütfen daha sonra tekrar deneyin veya yöneticinizle iletişime geçin.</p>
            <p className="text-sm opacity-75">Hata: {examStudentError.message}</p>
            <p className="text-sm opacity-75 mt-2">Sınav ID: {params.examId}</p>
            <p className="text-sm opacity-75">Token Sınav ID: {tokenData.examId}</p>
            <p className="text-sm opacity-75">Öğrenci ID: {tokenData.studentId}</p>
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

    // examStudentData.exams bir dizi olduğu için ilk elemanını alıyoruz
    if (Array.isArray(examStudentData.exams) && examStudentData.exams.length > 0) {
      const examData = examStudentData.exams[0];
      
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
      
      // Supabase'den gelen veriyi ExamClient bileşenine uygun şekilde dönüştür
      // as unknown as T şeklinde tip dönüşümü yapmak daha güvenlidir
      
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
      const student = Array.isArray(examStudentData.students) 
        ? examStudentData.students[0] 
        : examStudentData.students;
      
      // Öğrenci verilerini düzenle  
      const processedStudentData: ExamStudentData = {
        id: examStudentData.id,
        student_id: examStudentData.student_id,
        exam_id: examStudentData.exam_id,
        students: {
          id: student.id,
          name: student.name,
          surname: student.surname,
          phone: student.phone
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
    } else {
      return (
        <div className="text-red-500 p-6 flex items-center justify-center min-h-screen bg-gray-900">
          <div className="bg-red-700 text-white p-6 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-4">Sınav bilgileri bulunamadı</h2>
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

// ExamStudent verisini işleme yardımcı fonksiyonu ekleyelim
function processExamData(examStudentData: any, examId: string) {
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

  // examStudentData.exams bir dizi olduğu için ilk elemanını alıyoruz
  if (Array.isArray(examStudentData.exams) && examStudentData.exams.length > 0) {
    const examData = examStudentData.exams[0];
    
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
    
    // Supabase'den gelen veriyi ExamClient bileşenine uygun şekilde dönüştür
    // as unknown as T şeklinde tip dönüşümü yapmak daha güvenlidir
    
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
    const student = Array.isArray(examStudentData.students) 
      ? examStudentData.students[0] 
      : examStudentData.students;
    
    // Öğrenci verilerini düzenle  
    const processedStudentData: ExamStudentData = {
      id: examStudentData.id,
      student_id: examStudentData.student_id,
      exam_id: examStudentData.exam_id,
      students: {
        id: student.id,
        name: student.name,
        surname: student.surname,
        phone: student.phone
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
  } else {
    return (
      <div className="text-red-500 p-6 flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-red-700 text-white p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-4">Sınav bilgileri bulunamadı</h2>
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