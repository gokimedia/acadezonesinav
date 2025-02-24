-- First, drop existing foreign key constraints
ALTER TABLE exams DROP CONSTRAINT IF EXISTS exams_department_id_fkey;
ALTER TABLE exam_students DROP CONSTRAINT IF EXISTS exam_students_exam_id_fkey;
ALTER TABLE exam_students DROP CONSTRAINT IF EXISTS exam_students_student_id_fkey;

-- Update departments table to handle cascading deletes
ALTER TABLE exams
ADD CONSTRAINT exams_department_id_fkey 
FOREIGN KEY (department_id) 
REFERENCES departments(id) 
ON DELETE SET NULL;

-- Update exam_students table to handle cascading deletes
ALTER TABLE exam_students
ADD CONSTRAINT exam_students_exam_id_fkey 
FOREIGN KEY (exam_id) 
REFERENCES exams(id) 
ON DELETE CASCADE;

ALTER TABLE exam_students
ADD CONSTRAINT exam_students_student_id_fkey 
FOREIGN KEY (student_id) 
REFERENCES students(id) 
ON DELETE CASCADE;

-- Add policies for students table
DROP POLICY IF EXISTS "Anyone can view students" ON students;
DROP POLICY IF EXISTS "Anyone can insert students" ON students;
DROP POLICY IF EXISTS "Anyone can update students" ON students;
DROP POLICY IF EXISTS "Anyone can delete students" ON students;

CREATE POLICY "Anyone can view students" 
ON students FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert students" 
ON students FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update students" 
ON students FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete students" 
ON students FOR DELETE 
USING (true);

-- Add policies for exam_students table
DROP POLICY IF EXISTS "Anyone can view exam_students" ON exam_students;
DROP POLICY IF EXISTS "Anyone can insert exam_students" ON exam_students;
DROP POLICY IF EXISTS "Anyone can update exam_students" ON exam_students;
DROP POLICY IF EXISTS "Anyone can delete exam_students" ON exam_students;

CREATE POLICY "Anyone can view exam_students" 
ON exam_students FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert exam_students" 
ON exam_students FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update exam_students" 
ON exam_students FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete exam_students" 
ON exam_students FOR DELETE 
USING (true);

-- Update policies for exams table
DROP POLICY IF EXISTS "Anyone can view exams" ON exams;
DROP POLICY IF EXISTS "Only creators can modify exams" ON exams;

CREATE POLICY "Anyone can view exams"
ON exams FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create exams"
ON exams FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Only creators can update exams"
ON exams FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Only creators can delete exams"
ON exams FOR DELETE
TO authenticated
USING (auth.uid() = created_by);
