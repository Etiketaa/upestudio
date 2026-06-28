-- Create services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('Maquillaje', 'Nails')),
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create schedules table (for weekly availability)
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create blocks table (for specific date blocks like holidays/vacations)
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Policies for services: Everyone can read active services, only authenticated (admin) can modify
CREATE POLICY "Public can read active services" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can do everything on services" ON services FOR ALL USING (auth.role() = 'authenticated');

-- Policies for clients: Only admin can see/manage clients (for marketing)
CREATE POLICY "Admins can manage clients" ON clients FOR ALL USING (auth.role() = 'authenticated');
-- Temporary policy for public to insert client during booking (if we don't use service role)
CREATE POLICY "Public can insert clients" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update clients" ON clients FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can read clients" ON clients FOR SELECT USING (true);

-- Policies for appointments: Public can insert, Admin can manage
CREATE POLICY "Public can insert appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage appointments" ON appointments FOR ALL USING (auth.role() = 'authenticated');

-- Policies for schedules: Public can read, Admin can manage
CREATE POLICY "Everyone can read schedules" ON schedules FOR SELECT USING (true);
CREATE POLICY "Admins can manage schedules" ON schedules FOR ALL USING (auth.role() = 'authenticated');

-- Policies for blocks: Public can read, Admin can manage
CREATE POLICY "Everyone can read blocks" ON blocks FOR SELECT USING (true);
CREATE POLICY "Admins can manage blocks" ON blocks FOR ALL USING (auth.role() = 'authenticated');

-- Seed Data
INSERT INTO services (name, description, category, duration_minutes, price) VALUES
('Maquillaje Social', 'Ideal para eventos, fiestas o salidas especiales.', 'Maquillaje', 60, 15000),
('Maquillaje de Novias', 'Servicio premium con prueba incluida.', 'Maquillaje', 120, 45000),
('Esmaltado Semipermanente', 'Uñas perfectas por 15-20 días.', 'Nails', 60, 8000),
('Soft Gel', 'Extensión de uñas con sistema soft gel.', 'Nails', 90, 12000),
('Poligel', 'Uñas esculpidas en poligel para máxima resistencia.', 'Nails', 120, 15000);

INSERT INTO schedules (day_of_week, start_time, end_time) VALUES
(1, '09:00', '18:00'), -- Lunes
(2, '09:00', '18:00'), -- Martes
(3, '09:00', '18:00'), -- Miércoles
(4, '09:00', '18:00'), -- Jueves
(5, '09:00', '18:00'), -- Viernes
(6, '10:00', '14:00'); -- Sábado
