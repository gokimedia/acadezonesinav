-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view departments" ON departments;
DROP POLICY IF EXISTS "Anyone can insert departments" ON departments;
DROP POLICY IF EXISTS "Anyone can update departments" ON departments;
DROP POLICY IF EXISTS "Anyone can delete departments" ON departments;

-- Create new policies
CREATE POLICY "Anyone can view departments" 
ON departments FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert departments" 
ON departments FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update departments" 
ON departments FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete departments" 
ON departments FOR DELETE 
USING (true);
