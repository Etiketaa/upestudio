-- ============================================
-- SCHEMA COMPLETO - TURNERO (pegar en SQL Editor)
-- ============================================
-- IMPORTANTE: Primero crear usuario admin en Authentication > Users
-- ============================================

-- ============================================
-- SERVICES
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- minutos
  price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active services" ON services;
DROP POLICY IF EXISTS "Admin can manage services" ON services;

CREATE POLICY "Public can read active services"
  ON services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage services"
  ON services FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- CLIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert clients" ON clients;
DROP POLICY IF EXISTS "Public can update clients" ON clients;
DROP POLICY IF EXISTS "Admin can read clients" ON clients;
DROP POLICY IF EXISTS "Admin can delete clients" ON clients;

CREATE POLICY "Public can insert clients"
  ON clients FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update clients"
  ON clients FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can read clients"
  ON clients FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can delete clients"
  ON clients FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- SCHEDULES
-- ============================================
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo, 6=sabado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active schedules" ON schedules;
DROP POLICY IF EXISTS "Admin can manage schedules" ON schedules;

CREATE POLICY "Public can read active schedules"
  ON schedules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage schedules"
  ON schedules FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- APPOINTMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Admin can manage appointments" ON appointments;

CREATE POLICY "Public can insert appointments"
  ON appointments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can manage appointments"
  ON appointments FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- BLOCKS
-- ============================================
CREATE TABLE IF NOT EXISTS blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read blocks" ON blocks;
DROP POLICY IF EXISTS "Admin can manage blocks" ON blocks;

CREATE POLICY "Public can read blocks"
  ON blocks FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage blocks"
  ON blocks FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- BANK ACCOUNTS
-- ============================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  cvu TEXT NOT NULL,
  alias TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read active bank_accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Admin can manage bank_accounts" ON bank_accounts;

CREATE POLICY "Public can read active bank_accounts"
  ON bank_accounts FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage bank_accounts"
  ON bank_accounts FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- TICKETS
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage tickets" ON tickets;

CREATE POLICY "Admin can manage tickets"
  ON tickets FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
