import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Tip tanımlarını daha esnek hale getirelim
interface ExamData {
  id: any;
  title: any;
  is_active: boolean;
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

    const supabase = createRouteHandlerClient({ cookies })

    // İlişkisel veriyi olduğu gibi kabul ediyoruz
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
      .eq('student_code', studentCode.toString().trim())
      .single()

    if (examStudentError) {
      console.error('Exam student error:', examStudentError)
      return NextResponse.json(
        { error: 'Öğrenci numarası bulunamadı' },
        { status: 404 }
      )
    }

    // Veri kontrolü
    if (!data || !data.exam) {
      return NextResponse.json(
        { error: 'Sınav bilgisi bulunamadı' },
        { status: 404 }
      )
    }

    // Sınav aktifliğini kontrol edelim
    // any tipini kullanarak TypeScript tip kontrolünü geçici olarak atlayalım
    const examData: any = data.exam;
    let isExamActive = false;
    
    if (Array.isArray(examData)) {
      isExamActive = examData.length > 0 ? Boolean(examData[0].is_active) : false;
    } else {
      isExamActive = Boolean(examData.is_active);
    }

    if (!isExamActive) {
      return NextResponse.json(
        { error: 'Bu sınav henüz aktif değil' },
        { status: 403 }
      )
    }

    // Sınav token'ını cookie'ye kaydet
    const token = btoa(JSON.stringify({
      examId: data.exam_id,
      studentId: data.student_id,
      studentCode: data.student_code
    }))

    // Cookie'yi ayarla
    const response = NextResponse.redirect(`/exam/${data.exam_id}`)
    response.cookies.set('exam_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
