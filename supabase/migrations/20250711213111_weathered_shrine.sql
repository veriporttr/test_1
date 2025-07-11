/*
  # Çok Kullanıcılı Şirket Tabanlı Sistem

  1. Yeni Tablolar
    - `companies` - Şirket bilgileri
    - `company_users` - Şirket kullanıcıları
    - `subscriptions` - Abonelik bilgileri
    - `admin_users` - Sistem yöneticileri

  2. Mevcut Tabloları Güncelleme
    - `quotes` tablosuna company_id ve created_by ekleme
    - `customers` tablosuna company_id ekleme

  3. Güvenlik
    - RLS politikaları
    - Kullanıcı rolleri
*/

-- Companies tablosu
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  tax_number text,
  logo_url text,
  admin_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Company users tablosu
CREATE TABLE IF NOT EXISTS company_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  permissions jsonb DEFAULT '{"can_create_quotes": true, "can_edit_own_quotes": true, "can_edit_all_quotes": false, "can_edit_company": false}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- Subscriptions tablosu
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  plan_name text NOT NULL DEFAULT 'monthly',
  price decimal(10,2) NOT NULL DEFAULT 99.00,
  currency text NOT NULL DEFAULT 'TRY',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Admin users tablosu (sistem yöneticileri)
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role text NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Mevcut quotes tablosunu güncelle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE quotes ADD COLUMN company_id uuid REFERENCES companies(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE quotes ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Mevcut customers tablosunu güncelle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN company_id uuid REFERENCES companies(id);
  END IF;
END $$;

-- RLS'i etkinleştir
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Companies için RLS politikaları
CREATE POLICY "Users can read their company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can update their company"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND (role = 'admin' OR (permissions->>'can_edit_company')::boolean = true)
    )
  );

-- Company users için RLS politikaları
CREATE POLICY "Users can read company users"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company admins can manage users"
  ON company_users
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Subscriptions için RLS politikaları
CREATE POLICY "Users can read their company subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- Quotes için güncellenmiş RLS politikaları
DROP POLICY IF EXISTS "Users can read their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can create quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON quotes;

CREATE POLICY "Users can read company quotes"
  ON quotes
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create quotes"
  ON quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT cu.company_id FROM company_users cu
      WHERE cu.user_id = auth.uid() AND (cu.permissions->>'can_create_quotes')::boolean = true
    )
  );

CREATE POLICY "Users can update quotes"
  ON quotes
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT cu.company_id FROM company_users cu
      WHERE cu.user_id = auth.uid() AND (
        (cu.permissions->>'can_edit_all_quotes')::boolean = true OR
        ((cu.permissions->>'can_edit_own_quotes')::boolean = true AND quotes.created_by = auth.uid())
      )
    )
  );

CREATE POLICY "Users can delete quotes"
  ON quotes
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT cu.company_id FROM company_users cu
      WHERE cu.user_id = auth.uid() AND (
        (cu.permissions->>'can_edit_all_quotes')::boolean = true OR
        ((cu.permissions->>'can_edit_own_quotes')::boolean = true AND quotes.created_by = auth.uid())
      )
    )
  );

-- Customers için güncellenmiş RLS politikaları
DROP POLICY IF EXISTS "Users can read their own customers" ON customers;
DROP POLICY IF EXISTS "Users can create customers" ON customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON customers;

CREATE POLICY "Users can read company customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM company_users WHERE user_id = auth.uid()
    )
  );

-- Admin users için RLS politikaları
CREATE POLICY "Super admins can manage everything"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Fonksiyonlar
CREATE OR REPLACE FUNCTION get_user_company()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT company_id FROM company_users WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_company_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_users 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();