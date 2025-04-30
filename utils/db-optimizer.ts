/**
 * DB-OPTIMIZER
 * Bu modül, veritabanı bağlantılarını optimize etmek için yardımcı fonksiyonlar içerir.
 * Özellikle eş zamanlı çok sayıda bağlantı olan durumlarda performansı artırmak için kullanılır.
 */

import { supabase, getConnectionPool } from '@/lib/supabase';

/**
 * Sınav sorularını sayfalama ile alarak performansı artırır
 * @param examId - Sınav ID'si
 * @param offset - Başlangıç indeksi
 * @param limit - Kaç soru alınacağı
 */
export async function getExamQuestionsWithPagination(
  examId: string, 
  offset: number = 0, 
  limit: number = 10
) {
  try {
    const { data, error, count } = await supabase
      .from('questions')
      .select('id, question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, points', { count: 'exact' })
      .eq('exam_id', examId)
      .range(offset, offset + limit - 1)
      .order('created_at');

    if (error) throw error;

    return { 
      data, 
      count,
      hasMore: count ? offset + limit < count : false
    };
  } catch (error) {
    console.error('Sorular yüklenirken hata:', error);
    throw error;
  }
}

/**
 * Sınavdaki aktif eş zamanlı kullanıcı sayısını alır
 * @param examId - Sınav ID'si
 */
export async function getActiveExamUsers(examId: string) {
  try {
    // SELECT COUNT(DISTINCT student_id) from student_exam_sessions where exam_id = $1 AND last_activity > NOW() - INTERVAL '5 minutes'
    const { count, error } = await supabase
      .from('student_exam_sessions')
      .select('student_id', { count: 'exact', head: true })
      .eq('exam_id', examId)
      .gt('last_activity', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Aktif kullanıcılar sayılırken hata:', error);
    return 0;
  }
}

/**
 * Öğrenci oturumunu günceller (aktif olduğunu belirtir)
 * @param examId - Sınav ID'si
 * @param studentId - Öğrenci ID'si
 */
export async function updateStudentExamSession(examId: string, studentId: string) {
  try {
    const { error } = await supabase
      .from('student_exam_sessions')
      .upsert(
        { 
          exam_id: examId, 
          student_id: studentId, 
          last_activity: new Date().toISOString() 
        },
        { onConflict: 'exam_id,student_id' }
      );

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Oturum güncellenirken hata:', error);
    return false;
  }
}

/**
 * PERFORMANS İYİLEŞTİRME: Toplu işlemler için veritabanı işlemi
 * Çok sayıda cevabı tek seferde kaydederek bağlantı sayısını azaltır
 * @param answers - Cevap dizisi
 */
export async function bulkSaveAnswers(answers: any[]) {
  if (!answers || answers.length === 0) return { success: false };
  
  try {
    // DÜZELTME: 'returning' özelliği kaldırıldı, Supabase desteklemiyor
    const { data, error } = await supabase
      .from('answers')
      .upsert(answers, { 
        onConflict: 'exam_id,question_id,student_id',
        count: 'exact'  // Kaç satırın etkilendiğini say
      });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Cevaplar kaydedilirken hata:', error);
    return { success: false, error };
  }
}

/**
 * PERFORMANS İYİLEŞTİRME: Düşük seviyeli veritabanı sorgusu
 * Özel durumlarda doğrudan SQL çalıştırarak performansı artırır
 * @param examId - Sınav ID'si
 */
export async function getExamStatistics(examId: string) {
  try {
    // Server-side only
    if (typeof window !== 'undefined') {
      throw new Error('Bu fonksiyon sadece sunucu tarafında çalışır');
    }

    const pool = await getConnectionPool();
    if (!pool) {
      throw new Error('Veritabanı bağlantı havuzu oluşturulamadı');
    }

    // SQL ile direkt olarak istatistikleri alıyoruz - daha optimize
    const result = await pool.query(`
      WITH exam_stats AS (
        SELECT 
          count(distinct student_id) as total_students,
          count(distinct question_id) as total_questions
        FROM answers
        WHERE exam_id = $1
      ),
      student_stats AS (
        SELECT 
          student_id,
          count(case when is_correct = true then 1 end) as correct_count,
          count(case when is_correct = false then 1 end) as wrong_count
        FROM answers
        WHERE exam_id = $1
        GROUP BY student_id
      )
      SELECT 
        e.total_students,
        e.total_questions,
        avg(s.correct_count) as avg_correct,
        avg(s.wrong_count) as avg_wrong
      FROM exam_stats e
      CROSS JOIN student_stats s
      GROUP BY e.total_students, e.total_questions
    `, [examId]);

    return result.rows[0] || { 
      total_students: 0, 
      total_questions: 0,
      avg_correct: 0,
      avg_wrong: 0
    };
  } catch (error) {
    console.error('Sınav istatistikleri alınırken hata:', error);
    return { 
      total_students: 0, 
      total_questions: 0,
      avg_correct: 0,
      avg_wrong: 0
    };
  }
}

// Ek tablolar oluşturmak için SQL
export const createPerformanceTablesSQL = `
-- Aktif öğrenci oturumlarını takip etmek için tablo
CREATE TABLE IF NOT EXISTS student_exam_sessions (
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (exam_id, student_id)
);

-- Aktif oturumlar için indeks
CREATE INDEX IF NOT EXISTS idx_student_exam_sessions_activity 
ON student_exam_sessions (last_activity);

-- Performans için cevap tablosuna indeks
CREATE INDEX IF NOT EXISTS idx_answers_exam_student
ON answers (exam_id, student_id);

-- Performans için soru tablosuna indeks
CREATE INDEX IF NOT EXISTS idx_questions_exam_id
ON questions (exam_id);
`; 