-- Önce RLS'yi devre dışı bırak
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;

-- Tüm politikaları temizle
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON departments;
DROP POLICY IF EXISTS "Departments are viewable by everyone" ON departments;
DROP POLICY IF EXISTS "Enable read access for all users" ON departments;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON departments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON departments;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON departments;

-- RLS'yi tekrar etkinleştir
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Admin rolü için bypass policy ekle
ALTER TABLE departments FORCE ROW LEVEL SECURITY;
CREATE POLICY "Bypass RLS for service_role" ON departments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Test için departments tablosunu kontrol et
SELECT * FROM departments;
