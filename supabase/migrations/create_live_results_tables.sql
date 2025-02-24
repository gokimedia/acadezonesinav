-- Canlı sonuçlar için gerekli tabloları oluştur
CREATE TABLE IF NOT EXISTS exam_live_results (
    exam_id UUID REFERENCES exams(id) PRIMARY KEY,
    total_students INTEGER DEFAULT 0,
    students_started INTEGER DEFAULT 0,
    average_score NUMERIC DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_live_results (
    exam_id UUID REFERENCES exams(id),
    question_id UUID REFERENCES questions(id),
    total_answers INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    wrong_answers INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (exam_id, question_id)
);

CREATE TABLE IF NOT EXISTS student_exam_progress (
    exam_id UUID REFERENCES exams(id),
    student_id UUID REFERENCES exam_students(id),
    answered_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    score NUMERIC DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (exam_id, student_id)
);
