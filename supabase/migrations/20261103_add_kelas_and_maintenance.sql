-- ============================================================
-- Migration: Tambah kolom kelas, role viewer, dan maintenance mode
-- Tanggal: 2026-11-03
-- ============================================================

-- 1. Tambah kolom kelas pada tabel students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS kelas TEXT
    CHECK (kelas IN ('Pemula', '1', '2A', '2B', '3'));

-- 2. Tambah role 'viewer' ke profiles (read-only account)
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'operational_manager', 'principal', 'sensei_staff', 'viewer'));

-- 3. Tambah role 'viewer' ke internal_allowlist
ALTER TABLE public.internal_allowlist
  DROP CONSTRAINT IF EXISTS internal_allowlist_default_role_check;

ALTER TABLE public.internal_allowlist
  ADD CONSTRAINT internal_allowlist_default_role_check
    CHECK (default_role IN ('admin', 'operational_manager', 'principal', 'sensei_staff', 'viewer'));

-- 4. Buat tabel system_settings untuk maintenance mode dan konfigurasi global
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Insert default maintenance_mode setting
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
    'maintenance_mode',
    'false',
    'Jika true, sistem diblokir sementara untuk input data (hanya admin yang dapat masuk)'
)
ON CONFLICT (setting_key) DO NOTHING;

-- 6. RLS Policy untuk system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop policy lama jika ada, lalu create ulang
DROP POLICY IF EXISTS "admin_full_access_system_settings" ON public.system_settings;
CREATE POLICY "admin_full_access_system_settings"
ON public.system_settings
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin' AND p.is_active = true
    )
);

-- Semua pengguna terotentikasi bisa baca
DROP POLICY IF EXISTS "authenticated_read_system_settings" ON public.system_settings;
CREATE POLICY "authenticated_read_system_settings"
ON public.system_settings
FOR SELECT
TO authenticated
USING (true);

-- 7. Update trigger agar setiap akun Google baru otomatis menjadi 'viewer' aktif (bukan diblokir)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    matched_allowlist RECORD;
    admin_count INT;
BEGIN
    -- Cek apakah email ada di internal_allowlist
    SELECT * INTO matched_allowlist FROM public.internal_allowlist WHERE LOWER(email) = LOWER(NEW.email);
    
    IF FOUND THEN
        INSERT INTO public.profiles (id, email, full_name, role, is_active)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', matched_allowlist.full_name, split_part(NEW.email, '@', 1)),
            matched_allowlist.default_role,
            true
        )
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            role = matched_allowlist.default_role,
            is_active = true,
            updated_at = timezone('utc'::text, now());
    ELSE
        -- Cek apakah sudah ada admin
        SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE role = 'admin' AND is_active = true;

        IF admin_count = 0 THEN
            -- User pertama menjadi admin utama
            INSERT INTO public.profiles (id, email, full_name, role, is_active)
            VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
                'admin',
                true
            )
            ON CONFLICT (id) DO UPDATE
            SET role = 'admin', is_active = true;
        ELSE
            -- Pengguna Google lainnya otomatis menjadi 'viewer' aktif
            INSERT INTO public.profiles (id, email, full_name, role, is_active)
            VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
                'viewer',
                true
            )
            ON CONFLICT (id) DO UPDATE
            SET role = 'viewer', is_active = true;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Aktifkan akun benjasesko300@gmail.com yang tadi sempat terblokir menjadi viewer aktif
UPDATE public.profiles
SET role = 'viewer', is_active = true
WHERE LOWER(email) = 'benjasesko300@gmail.com';


