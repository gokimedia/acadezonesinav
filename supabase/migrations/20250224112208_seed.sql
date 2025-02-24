-- Insert sample departments
INSERT INTO departments (id, name) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Genel'),
  ('22222222-2222-2222-2222-222222222222', 'Matematik'),
  ('33333333-3333-3333-3333-333333333333', 'Fizik');

-- Insert test user after tables are created
INSERT INTO users (id, email, name, surname, role) VALUES 
  ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'Test', 'User', 'admin');

-- Insert sample exams
INSERT INTO exams (title, description, exam_date, duration, location, department_id, is_active, created_by) VALUES 
  ('Deneme Sınavı 1', 'Genel deneme sınavı', '2025-03-01 10:00:00+00', 120, 'A101', '11111111-1111-1111-1111-111111111111', true, '00000000-0000-0000-0000-000000000000'),
  ('Matematik Sınavı', 'TYT Matematik', '2025-03-15 14:00:00+00', 90, 'B202', '22222222-2222-2222-2222-222222222222', true, '00000000-0000-0000-0000-000000000000'),
  ('Fizik Final', 'Fizik final sınavı', '2025-03-30 09:00:00+00', 180, 'C303', '33333333-3333-3333-3333-333333333333', true, '00000000-0000-0000-0000-000000000000');