-- RLS'yi aktif et
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Departments are viewable by everyone" ON departments;
DROP POLICY IF EXISTS "Departments are insertable by authenticated users" ON departments;
DROP POLICY IF EXISTS "Departments are updatable by authenticated users" ON departments;
DROP POLICY IF EXISTS "Departments are deletable by authenticated users" ON departments;

-- Yeni politikaları ekle
CREATE POLICY "Departments are viewable by everyone" 
ON departments FOR SELECT 
USING (true);

CREATE POLICY "Departments are insertable by authenticated users" 
ON departments FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Departments are updatable by authenticated users" 
ON departments FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Departments are deletable by authenticated users" 
ON departments FOR DELETE 
USING (auth.role() = 'authenticated');

-- Diğer tablolar için de benzer politikalar
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Students tablosu için politikalar
CREATE POLICY "Students are viewable by authenticated users" 
ON students FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Students are insertable by authenticated users" 
ON students FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Students are updatable by authenticated users" 
ON students FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Students are deletable by authenticated users" 
ON students FOR DELETE 
USING (auth.role() = 'authenticated');

-- Exams tablosu için politikalar
CREATE POLICY "Exams are viewable by authenticated users" 
ON exams FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Exams are insertable by authenticated users" 
ON exams FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Exams are updatable by authenticated users" 
ON exams FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Exams are deletable by authenticated users" 
ON exams FOR DELETE 
USING (auth.role() = 'authenticated');

-- Exam Results tablosu için politikalar
CREATE POLICY "Exam Results are viewable by authenticated users" 
ON exam_results FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Exam Results are insertable by authenticated users" 
ON exam_results FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Exam Results are updatable by authenticated users" 
ON exam_results FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Exam Results are deletable by authenticated users" 
ON exam_results FOR DELETE 
USING (auth.role() = 'authenticated');

-- Questions tablosu için politikalar
CREATE POLICY "Questions are viewable by authenticated users" 
ON questions FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Questions are insertable by authenticated users" 
ON questions FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Questions are updatable by authenticated users" 
ON questions FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Questions are deletable by authenticated users" 
ON questions FOR DELETE 
USING (auth.role() = 'authenticated');
