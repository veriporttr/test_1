/*
  # Çok Kullanıcılı Sistem Tamamlama

  1. Eksik Fonksiyonlar
    - Kullanıcı şirket bilgilerini alma
    - Yetki kontrol fonksiyonları
    
  2. Eksik Trigger'lar
    - Otomatik updated_at güncellemeleri
    
  3. Eksik İndeksler
    - Performans için gerekli indeksler
    
  4. Varsayılan Veriler
    - İlk süper admin kullanıcısı
*/

-- Eksik fonksiyonlar (eğer yoksa)
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

-- Updated_at trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'ları kontrol et ve oluştur
DO $$
BEGIN
    -- Companies tablosu için trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_companies_updated_at'
    ) THEN
        CREATE TRIGGER update_companies_updated_at 
            BEFORE UPDATE ON companies
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Subscriptions tablosu için trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_subscriptions_updated_at'
    ) THEN
        CREATE TRIGGER update_subscriptions_updated_at 
            BEFORE UPDATE ON subscriptions
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Performans için indeksler
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_company_id ON quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Mevcut quotes tablosundaki user_id verilerini company_id ve created_by'a taşı
DO $$
DECLARE
    quote_record RECORD;
    user_company_id uuid;
BEGIN
    -- Sadece user_id'si olan ama company_id'si olmayan kayıtları işle
    FOR quote_record IN 
        SELECT id, user_id 
        FROM quotes 
        WHERE user_id IS NOT NULL AND company_id IS NULL
    LOOP
        -- Bu kullanıcının şirketini bul
        SELECT company_id INTO user_company_id
        FROM company_users 
        WHERE user_id = quote_record.user_id 
        LIMIT 1;
        
        -- Eğer şirket bulunduysa güncelle
        IF user_company_id IS NOT NULL THEN
            UPDATE quotes 
            SET 
                company_id = user_company_id,
                created_by = quote_record.user_id
            WHERE id = quote_record.id;
        END IF;
    END LOOP;
END $$;

-- Mevcut customers tablosundaki user_id verilerini company_id'a taşı
DO $$
DECLARE
    customer_record RECORD;
    user_company_id uuid;
BEGIN
    -- Sadece user_id'si olan ama company_id'si olmayan kayıtları işle
    FOR customer_record IN 
        SELECT id, user_id 
        FROM customers 
        WHERE user_id IS NOT NULL AND company_id IS NULL
    LOOP
        -- Bu kullanıcının şirketini bul
        SELECT company_id INTO user_company_id
        FROM company_users 
        WHERE user_id = customer_record.user_id 
        LIMIT 1;
        
        -- Eğer şirket bulunduysa güncelle
        IF user_company_id IS NOT NULL THEN
            UPDATE customers 
            SET company_id = user_company_id
            WHERE id = customer_record.id;
        END IF;
    END LOOP;
END $$;

-- Eski user_id kolonlarını kaldır (opsiyonel - veri kaybını önlemek için yorum satırında)
-- ALTER TABLE quotes DROP COLUMN IF EXISTS user_id;
-- ALTER TABLE customers DROP COLUMN IF EXISTS user_id;

-- İlk süper admin kullanıcısını oluştur (e-postanızı buraya yazın)
-- Bu kısmı kendi e-postanızla değiştirin
/*
INSERT INTO admin_users (user_id, role)
SELECT id, 'super_admin'
FROM auth.users 
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO NOTHING;
*/