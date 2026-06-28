-- Drop existing policies
DROP POLICY IF EXISTS "Public can read active services" ON services;
DROP POLICY IF EXISTS "Admins can do everything on services" ON services;
DROP POLICY IF EXISTS "Allow all on services" ON services;
DROP POLICY IF EXISTS "Admins can manage clients" ON clients;
DROP POLICY IF EXISTS "Public can insert clients" ON clients;
DROP POLICY IF EXISTS "Public can update clients" ON clients;
DROP POLICY IF EXISTS "Public can read clients" ON clients;
DROP POLICY IF EXISTS "Allow all on clients" ON clients;
DROP POLICY IF EXISTS "Public can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can manage appointments" ON appointments;
DROP POLICY IF EXISTS "Allow all on appointments" ON appointments;
DROP POLICY IF EXISTS "Everyone can read schedules" ON schedules;
DROP POLICY IF EXISTS "Admins can manage schedules" ON schedules;
DROP POLICY IF EXISTS "Allow all on schedules" ON schedules;
DROP POLICY IF EXISTS "Everyone can read blocks" ON blocks;
DROP POLICY IF EXISTS "Admins can manage blocks" ON blocks;
DROP POLICY IF EXISTS "Allow all on blocks" ON blocks;

-- Create open policies for all tables
CREATE POLICY "Allow all on services" ON services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on schedules" ON schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on blocks" ON blocks FOR ALL USING (true) WITH CHECK (true);
