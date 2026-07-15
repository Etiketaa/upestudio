-- ============================================
-- MIGRACIÓN: bank_accounts
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Crear tabla
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  cvu TEXT NOT NULL,
  alias TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: público lee cuentas activas
CREATE POLICY "Public can read active bank_accounts"
  ON bank_accounts FOR SELECT
  USING (is_active = true);

-- RLS: admin acceso total
CREATE POLICY "Admin can manage bank_accounts"
  ON bank_accounts FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
