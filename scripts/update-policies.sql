-- Tüm mevcut politikaları kaldır
DROP POLICY IF EXISTS "Enable read access for all users" ON departments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON departments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON departments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON departments;

DROP POLICY IF EXISTS "Students are viewable by authenticated users" ON students;
DROP POLICY IF EXISTS "Students are insertable by authenticated users" ON students;
DROP POLICY IF EXISTS "Students are updatable by authenticated users" ON students;
DROP POLICY IF EXISTS "Students are deletable by authenticated users" ON students;

DROP POLICY IF EXISTS "Exams are viewable by authenticated users" ON exams;
DROP POLICY IF EXISTS "Exams are insertable by authenticated users" ON exams;
DROP POLICY IF EXISTS "Exams are updatable by authenticated users" ON exams;
DROP POLICY IF EXISTS "Exams are deletable by authenticated users" ON exams;

DROP POLICY IF EXISTS "Questions are viewable by authenticated users" ON questions;
DROP POLICY IF EXISTS "Questions are insertable by authenticated users" ON questions;
DROP POLICY IF EXISTS "Questions are updatable by authenticated users" ON questions;
DROP POLICY IF EXISTS "Questions are deletable by authenticated users" ON questions;

DROP POLICY IF EXISTS "Exam Results are viewable by authenticated users" ON exam_results;
DROP POLICY IF EXISTS "Exam Results are insertable by authenticated users" ON exam_results;
DROP POLICY IF EXISTS "Exam Results are updatable by authenticated users" ON exam_results;
DROP POLICY IF EXISTS "Exam Results are deletable by authenticated users" ON exam_results;

-- RLS'yi devre dışı bırak ve tekrar etkinleştir
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results DISABLE ROW LEVEL SECURITY;

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- Yeni basit politikalar ekle - giriş yapmış herkes tüm işlemleri yapabilir
CREATE POLICY "Allow all operations for authenticated users" ON departments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON students
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON exams
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON questions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all operations for authenticated users" ON exam_results
    FOR ALL USING (auth.role() = 'authenticated');
