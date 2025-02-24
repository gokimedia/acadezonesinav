-- Canlı sonuçları güncelleyen fonksiyon
CREATE OR REPLACE FUNCTION update_live_results()
RETURNS TRIGGER AS $$
BEGIN
    -- Sınav istatistiklerini güncelle
    INSERT INTO exam_live_results AS elr (
        exam_id,
        total_students,
        students_started,
        average_score,
        updated_at
    )
    SELECT 
        NEW.exam_id,
        (SELECT COUNT(*) FROM exam_students WHERE exam_id = NEW.exam_id),
        (SELECT COUNT(DISTINCT student_id) FROM answers WHERE exam_id = NEW.exam_id),
        COALESCE(
            (SELECT AVG(CASE WHEN is_correct THEN 100.0 ELSE 0.0 END) 
             FROM answers 
             WHERE exam_id = NEW.exam_id),
            0
        ),
        CURRENT_TIMESTAMP
    ON CONFLICT (exam_id) 
    DO UPDATE SET
        total_students = (SELECT COUNT(*) FROM exam_students WHERE exam_id = NEW.exam_id),
        students_started = (SELECT COUNT(DISTINCT student_id) FROM answers WHERE exam_id = NEW.exam_id),
        average_score = COALESCE(
            (SELECT AVG(CASE WHEN is_correct THEN 100.0 ELSE 0.0 END) 
             FROM answers 
             WHERE exam_id = NEW.exam_id),
            0
        ),
        updated_at = CURRENT_TIMESTAMP;

    -- Soru istatistiklerini güncelle
    INSERT INTO question_live_results AS qlr (
        exam_id,
        question_id,
        total_answers,
        correct_answers,
        wrong_answers,
        updated_at
    )
    SELECT 
        NEW.exam_id,
        NEW.question_id,
        COUNT(*),
        COUNT(CASE WHEN is_correct THEN 1 END),
        COUNT(CASE WHEN NOT is_correct THEN 1 END),
        CURRENT_TIMESTAMP
    FROM answers
    WHERE exam_id = NEW.exam_id AND question_id = NEW.question_id
    GROUP BY exam_id, question_id
    ON CONFLICT (exam_id, question_id) 
    DO UPDATE SET
        total_answers = EXCLUDED.total_answers,
        correct_answers = EXCLUDED.correct_answers,
        wrong_answers = EXCLUDED.wrong_answers,
        updated_at = CURRENT_TIMESTAMP;

    -- Öğrenci ilerlemesini güncelle
    INSERT INTO student_exam_progress AS sep (
        exam_id,
        student_id,
        answered_questions,
        correct_answers,
        score,
        updated_at
    )
    SELECT 
        NEW.exam_id,
        NEW.student_id,
        COUNT(*),
        COUNT(CASE WHEN is_correct THEN 1 END),
        COALESCE(AVG(CASE WHEN is_correct THEN 100.0 ELSE 0.0 END), 0),
        CURRENT_TIMESTAMP
    FROM answers
    WHERE exam_id = NEW.exam_id AND student_id = NEW.student_id
    GROUP BY exam_id, student_id
    ON CONFLICT (exam_id, student_id) 
    DO UPDATE SET
        answered_questions = EXCLUDED.answered_questions,
        correct_answers = EXCLUDED.correct_answers,
        score = EXCLUDED.score,
        updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
