-- Önce tüm politikaları kaldır
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON departments;
DROP POLICY IF EXISTS "Enable read access for all users" ON departments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON departments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON departments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON departments;

-- RLS'yi devre dışı bırak ve tekrar etkinleştir
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Herkes için okuma izni
CREATE POLICY "Enable read access for all users" ON departments
    FOR SELECT USING (true);

-- Giriş yapmış kullanıcılar için ekleme izni
CREATE POLICY "Enable insert for authenticated users" ON departments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Giriş yapmış kullanıcılar için güncelleme izni
CREATE POLICY "Enable update for authenticated users" ON departments
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Giriş yapmış kullanıcılar için silme izni
CREATE POLICY "Enable delete for authenticated users" ON departments
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Mevcut politikaları kontrol et
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'departments';
