-- ============================================
-- POLÍTICAS RLS - SEGURIDAD
-- ============================================
-- Ejecutar en Supabase SQL Editor
-- IMPORTANTE: Primero crear usuario admin en Authentication > Users
-- ============================================

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "Allow all on services" ON services;
DROP POLICY IF EXISTS "Allow all on clients" ON clients;
DROP POLICY IF EXISTS "Allow all on appointments" ON appointments;
DROP POLICY IF EXISTS "Allow all on schedules" ON schedules;
DROP POLICY IF EXISTS "Allow all on blocks" ON blocks;

-- ============================================
-- SERVICES
-- ============================================
-- Público: solo lee servicios activos
CREATE POLICY "Public can read active services"
  ON services FOR SELECT
  USING (is_active = true);

-- Admin autenticado: acceso total
CREATE POLICY "Admin can manage services"
  ON services FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- CLIENTS
-- ============================================
-- Público: puede crear clientes (para booking)
CREATE POLICY "Public can insert clients"
  ON clients FOR INSERT
  WITH CHECK (true);

-- Público: puede actualizar clientes (upsert por email en booking)
CREATE POLICY "Public can update clients"
  ON clients FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Admin: puede leer, modificar y borrar
CREATE POLICY "Admin can read clients"
  ON clients FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can delete clients"
  ON clients FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- APPOINTMENTS
-- ============================================
-- Público: puede crear citas (para booking)
CREATE POLICY "Public can insert appointments"
  ON appointments FOR INSERT
  WITH CHECK (true);

-- Admin: puede leer, modificar y borrar
CREATE POLICY "Admin can manage appointments"
  ON appointments FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- SCHEDULES
-- ============================================
-- Público: solo lee horarios activos (para booking)
CREATE POLICY "Public can read active schedules"
  ON schedules FOR SELECT
  USING (is_active = true);

-- Admin: acceso total
CREATE POLICY "Admin can manage schedules"
  ON schedules FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- BLOCKS
-- ============================================
-- Público: lee bloques (para verificar disponibilidad)
CREATE POLICY "Public can read blocks"
  ON blocks FOR SELECT
  USING (true);

-- Admin: acceso total
CREATE POLICY "Admin can manage blocks"
  ON blocks FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
