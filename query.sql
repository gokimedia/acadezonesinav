-- Results tablosuna yeni kolonlar ekleme
ALTER TABLE results 
ADD COLUMN IF NOT EXISTS total_questions integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS correct_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS wrong_count integer DEFAULT 0;

-- Canlı sınav sonuçları için görünüm oluşturma
CREATE OR REPLACE VIEW exam_live_results AS
SELECT 
    e.id as exam_id,
    e.title as exam_title,
    COUNT(DISTINCT es.student_id) as total_students,
    COUNT(DISTINCT a.student_id) as students_started,
    AVG(r.score) as average_score,
    MAX(r.score) as highest_score,
    MIN(r.score) as lowest_score
FROM exams e
LEFT JOIN exam_students es ON e.id = es.exam_id
LEFT JOIN answers a ON e.id = a.exam_id
LEFT JOIN results r ON e.id = r.exam_id
GROUP BY e.id, e.title;

-- Soru bazlı sonuçlar için görünüm
CREATE OR REPLACE VIEW question_live_results AS
SELECT 
    q.id as question_id,
    q.exam_id,
    q.question_text,
    COUNT(a.id) as total_answers,
    SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) as correct_answers,
    SUM(CASE WHEN NOT a.is_correct THEN 1 ELSE 0 END) as wrong_answers
FROM questions q
LEFT JOIN answers a ON q.id = a.question_id
GROUP BY q.id, q.exam_id, q.question_text;

-- Öğrenci ilerleme durumu için görünüm
CREATE OR REPLACE VIEW student_exam_progress AS
SELECT 
    es.exam_id,
    es.student_id,
    s.name,
    s.surname,
    COUNT(DISTINCT a.question_id) as answered_questions,
    SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) as correct_answers,
    r.score
FROM exam_students es
LEFT JOIN students s ON es.student_id = s.id
LEFT JOIN answers a ON es.exam_id = a.exam_id AND es.student_id = a.student_id
LEFT JOIN results r ON es.exam_id = r.exam_id AND es.student_id = r.student_id
GROUP BY es.exam_id, es.student_id, s.name, s.surname, r.score;
