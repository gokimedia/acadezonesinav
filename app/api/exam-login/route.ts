import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// PERFORMANS İYİLEŞTİRME: Tip tanımlarını daha kesin yapılandırıyoruz
interface Exam {
  id: string;
  title: string;
  is_active: boolean;
}

interface ExamStudent {
  id: string;
  exam_id: string;
  student_id: string;
  student_code: string;
  exam: Exam | Exam[];
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const studentCode = formData.get('student-code')

    if (!studentCode) {
      return NextResponse.json(
        { error: 'Öğrenci numarası gerekli' },
        { status: 400 }
      )
    }

    const trimmedCode = studentCode.toString().trim()
    const supabase = createRouteHandlerClient({ cookies })

    // PERFORMANS İYİLEŞTİRME: Sadece ihtiyacımız olan verileri seçiyoruz
    // RLS güvenliğini koruyarak sorguyu optimize ediyoruz
    const { data, error: examStudentError } = await supabase
      .from('exam_students')
      .select(`
        id,
        exam_id,
        student_id,
        student_code,
        exam:exams (
          id,
          title,
          is_active
        )
      `)
      .eq('student_code', trimmedCode)
      // PERFORMANS İYİLEŞTİRME: Sadece aktif sınavları getiriyoruz
      .filter('exams.is_active', 'eq', true)
      .limit(1) // PERFORMANS İYİLEŞTİRME: Sonuç sayısını sınırlıyoruz

    // PERFORMANS İYİLEŞTİRME: .single() yerine limit kullandığımız için veri işleme yaklaşımı değişti
    if (examStudentError || !data || data.length === 0) {
      console.error('Exam student error:', examStudentError)
      return NextResponse.json(
        { error: 'Öğrenci numarası bulunamadı' },
        { status: 404 }
      )
    }

    const examStudent = data[0] as ExamStudent

    // Veri kontrolü
    if (!examStudent || !examStudent.exam) {
      return NextResponse.json(
        { error: 'Sınav bilgisi bulunamadı' },
        { status: 404 }
      )
    }

    // PERFORMANS İYİLEŞTİRME: Daha net veri tiplemesi ile daha güvenli kontroller yapıyoruz
    // Sınav aktifliğini kontrol edelim (önceden filtre ile belirtmiş olsak da ekstra kontrol)
    let isExamActive = false;
    let examId = '';
    
    if (Array.isArray(examStudent.exam)) {
      if (examStudent.exam.length > 0) {
        isExamActive = examStudent.exam[0].is_active;
        examId = examStudent.exam[0].id;
      }
    } else {
      isExamActive = examStudent.exam.is_active;
      examId = examStudent.exam.id;
    }

    if (!isExamActive) {
      return NextResponse.json(
        { error: 'Bu sınav henüz aktif değil' },
        { status: 403 }
      )
    }

    // PERFORMANS İYİLEŞTİRME: Daha güvenli token oluşturma
    const tokenData = {
      examId: examStudent.exam_id,
      studentId: examStudent.student_id,
      studentCode: examStudent.student_code,
      timestamp: Date.now() // ek güvenlik için zaman damgası ekliyoruz
    };
    
    const token = btoa(JSON.stringify(tokenData))

    // Cookie'yi ayarla ve sınava yönlendir
    const response = NextResponse.redirect(`/sinav/${examId}?code=${trimmedCode}`)
    response.cookies.set('exam_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 3, // 3 saat - güvenlik için token süresini sınırlıyoruz
      sameSite: 'lax'
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Giriş yapılırken bir hata oluştu' },
      { status: 500 }
    )
  }
}
