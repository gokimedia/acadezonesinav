-- Önce tüm politikaları kontrol et
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public';

-- Departments tablosundaki tüm kayıtları kontrol et
SELECT * FROM departments;

-- RLS'nin aktif olup olmadığını kontrol et
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Departments tablosunun yapısını kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'departments';
