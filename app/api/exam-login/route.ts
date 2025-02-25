import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

    const { data: examStudentData, error: examStudentError } = await supabase
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

    if (!examStudentData.exam.is_active) {
      return NextResponse.json(
        { error: 'Bu sınav henüz aktif değil' },
        { status: 403 }
      )
    }

    // Sınav token'ını cookie'ye kaydet
    const token = btoa(JSON.stringify({
      examId: examStudentData.exam_id,
      studentId: examStudentData.student_id,
      studentCode: examStudentData.student_code
    }))

    // Cookie'yi ayarla
    const response = NextResponse.redirect(`/exam/${examStudentData.exam_id}`)
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
