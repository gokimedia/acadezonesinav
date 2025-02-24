-- Önce mevcut politikaları temizleyelim
DROP POLICY IF EXISTS "Departments are viewable by everyone" ON departments;
DROP POLICY IF EXISTS "Departments are insertable by authenticated users" ON departments;
DROP POLICY IF EXISTS "Departments are updatable by authenticated users" ON departments;
DROP POLICY IF EXISTS "Departments are deletable by authenticated users" ON departments;

-- Yeni politikaları ekleyelim
CREATE POLICY "Enable read access for all users" ON departments
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON departments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON departments
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON departments
    FOR DELETE USING (auth.uid() IS NOT NULL);
