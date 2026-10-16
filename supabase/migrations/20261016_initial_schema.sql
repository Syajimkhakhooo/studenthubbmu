-- ====================================================================
-- STUDENT HUB BMU — INITIAL DATABASE MIGRATION
-- LPK Bahtera Mitra Unggulan
-- Version: 1.0.0
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES / CHECK CONSTRAINTS TABLE DEFINITIONS

-- 2.1 PROFILES & INTERNAL ALLOWLIST
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'sensei_staff' CHECK (role IN ('admin', 'operational_manager', 'principal', 'sensei_staff')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.internal_allowlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    default_role TEXT NOT NULL DEFAULT 'sensei_staff' CHECK (default_role IN ('admin', 'operational_manager', 'principal', 'sensei_staff')),
    full_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.2 STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id_number TEXT UNIQUE NOT NULL, -- Nomor Induk Siswa BMU (harus unik)
    full_name TEXT NOT NULL,
    nickname TEXT,
    gender TEXT NOT NULL CHECK (gender IN ('L', 'P')),
    birth_place TEXT,
    birth_date DATE,
    religion TEXT,
    blood_type TEXT,
    height_cm NUMERIC(5,2),
    weight_kg NUMERIC(5,2),
    domicile_address TEXT,
    id_card_address TEXT,
    phone_number TEXT,
    email TEXT,
    emergency_contact_name TEXT,
    emergency_contact_relation TEXT,
    emergency_contact_phone TEXT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    program_type TEXT NOT NULL DEFAULT 'SSW' CHECK (program_type IN ('SSW', 'TG_INTERNSHIP', 'OTHER')),
    target_job_interest TEXT,
    eye_vision_status TEXT, -- Normal, Minus, Silinder, dll.
    smoking_status BOOLEAN NOT NULL DEFAULT false,
    tattoo_status BOOLEAN NOT NULL DEFAULT false,
    driving_license_type TEXT, -- 'Tidak Ada', 'SIM C', 'SIM A', 'SIM B1', dll.
    willing_overtime BOOLEAN NOT NULL DEFAULT true,
    willing_relocation BOOLEAN NOT NULL DEFAULT true,
    marital_status TEXT DEFAULT 'Belum Menikah',
    is_archived BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.3 STUDENT JOURNEY / PIPELINE TRACKING
CREATE TABLE IF NOT EXISTS public.student_journey (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
    learning_status TEXT NOT NULL DEFAULT 'baru' CHECK (learning_status IN ('baru', 'sedang_belajar', 'lulus', 'berhenti')),
    leave_status TEXT NOT NULL DEFAULT 'normal' CHECK (leave_status IN ('normal', 'cuti', 'dicutikan')),
    interview_readiness TEXT NOT NULL DEFAULT 'belum_siap' CHECK (interview_readiness IN ('belum_siap', 'siap')),
    job_selection_status TEXT NOT NULL DEFAULT 'belum_mengikuti' CHECK (job_selection_status IN ('belum_mengikuti', 'proses', 'lolos', 'tidak_lolos', 'mengundurkan_diri')),
    departure_readiness TEXT NOT NULL DEFAULT 'belum_siap' CHECK (departure_readiness IN ('belum_siap', 'siap')),
    departure_status TEXT NOT NULL DEFAULT 'belum_berangkat' CHECK (departure_status IN ('belum_berangkat', 'sudah_berangkat')),
    matched_company_name TEXT,
    matched_job_sector TEXT,
    target_departure_date DATE,
    actual_departure_date DATE,
    notes TEXT,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.4 EDUCATION HISTORIES
CREATE TABLE IF NOT EXISTS public.education_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    level TEXT NOT NULL, -- 'SD', 'SMP', 'SMA/SMK', 'D3', 'D4/S1', 'S2'
    institution_name TEXT NOT NULL,
    major TEXT,
    start_year INTEGER,
    end_year INTEGER,
    is_graduated BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.5 WORK EXPERIENCES
CREATE TABLE IF NOT EXISTS public.work_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    industry_sector TEXT,
    position TEXT,
    start_date DATE,
    end_date DATE,
    job_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.6 FAMILY MEMBERS
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    relation TEXT NOT NULL, -- 'Ayah', 'Ibu', 'Kakak', 'Adik', 'Pasangan', 'Anak', 'Wali'
    full_name TEXT NOT NULL,
    age INTEGER,
    occupation TEXT,
    phone_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.7 CERTIFICATIONS (JFT, JLPT, SSW, DLL.)
CREATE TABLE IF NOT EXISTS public.certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    cert_type TEXT NOT NULL CHECK (cert_type IN ('JFT_BASIC', 'JLPT_N5', 'JLPT_N4', 'JLPT_N3', 'JLPT_N2', 'JLPT_N1', 'SSW', 'OTHER')),
    cert_level TEXT,
    score NUMERIC(6,2),
    test_date DATE,
    issue_date DATE,
    expiry_date DATE,
    certificate_number TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
    file_storage_path TEXT,
    reviewer_notes TEXT,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.8 STUDENT DOCUMENTS (METADATA & STORAGE TRACKING)
CREATE TABLE IF NOT EXISTS public.student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL CHECK (doc_type IN (
        'ktp',
        'kartu_keluarga',
        'akta_kelahiran',
        'ijazah',
        'sertifikat_bahasa',
        'sertifikat_ssw',
        'paspor',
        'skck',
        'surat_izin_ortu',
        'medical_checkup',
        'lainnya'
    )),
    file_storage_path TEXT,
    file_name TEXT,
    file_size_bytes BIGINT,
    mime_type TEXT,
    status TEXT NOT NULL DEFAULT 'missing' CHECK (status IN ('missing', 'uploaded', 'verified', 'rejected', 'not_required')),
    uploaded_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id),
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_student_doc_type UNIQUE (student_id, doc_type)
);

-- 2.9 STATUS HISTORY TIMELINE
CREATE TABLE IF NOT EXISTS public.student_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status_dimension TEXT NOT NULL, -- e.g. learning_status, interview_readiness, etc.
    old_value TEXT,
    new_value TEXT NOT NULL,
    reason TEXT,
    changed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.10 STUDENT PREFERENCES
CREATE TABLE IF NOT EXISTS public.student_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
    preferred_prefectures TEXT[] DEFAULT '{}',
    preferred_job_categories TEXT[] DEFAULT '{}',
    min_acceptable_salary NUMERIC(12,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.11 STUDENT FINANCES (RESTRICTED ACCESS)
CREATE TABLE IF NOT EXISTS public.student_finances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    fee_category TEXT NOT NULL, -- 'Pendaftaran', 'Pelatihan Bahasa', 'Pemberkasan', 'Tiket & Visa', 'Lainnya'
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'belum_bayar' CHECK (payment_status IN ('belum_bayar', 'sebagian', 'lunas')),
    payment_date DATE,
    receipt_number TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2.12 AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id),
    actor_email TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    change_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. INDEXES FOR HIGH-PERFORMANCE SEARCH & FILTER
CREATE INDEX IF NOT EXISTS idx_students_student_id_number ON public.students(student_id_number);
CREATE INDEX IF NOT EXISTS idx_students_full_name ON public.students(full_name);
CREATE INDEX IF NOT EXISTS idx_students_entry_date ON public.students(entry_date);
CREATE INDEX IF NOT EXISTS idx_students_program_type ON public.students(program_type);
CREATE INDEX IF NOT EXISTS idx_students_gender ON public.students(gender);
CREATE INDEX IF NOT EXISTS idx_students_is_archived ON public.students(is_archived);

CREATE INDEX IF NOT EXISTS idx_student_journey_learning_status ON public.student_journey(learning_status);
CREATE INDEX IF NOT EXISTS idx_student_journey_leave_status ON public.student_journey(leave_status);
CREATE INDEX IF NOT EXISTS idx_student_journey_interview_readiness ON public.student_journey(interview_readiness);
CREATE INDEX IF NOT EXISTS idx_student_journey_job_selection ON public.student_journey(job_selection_status);
CREATE INDEX IF NOT EXISTS idx_student_journey_departure_readiness ON public.student_journey(departure_readiness);
CREATE INDEX IF NOT EXISTS idx_student_journey_departure_status ON public.student_journey(departure_status);

CREATE INDEX IF NOT EXISTS idx_student_documents_student_id ON public.student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_status ON public.student_documents(status);
CREATE INDEX IF NOT EXISTS idx_certifications_student_id ON public.certifications(student_id);
CREATE INDEX IF NOT EXISTS idx_certifications_cert_type ON public.certifications(cert_type);

-- 4. TRIGGERS & FUNCTIONS FOR AUTOMATIC TIMESTAMP & PROFILE SYNC

-- 4.1 Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_student_journey_updated_at ON public.student_journey;
CREATE TRIGGER set_student_journey_updated_at
BEFORE UPDATE ON public.student_journey
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4.2 Auto-create profile & initialize student journey
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    matched_allowlist RECORD;
BEGIN
    -- Check if user email is in internal allowlist
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
        -- Insert with inactive status if not in allowlist
        INSERT INTO public.profiles (id, email, full_name, role, is_active)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
            'sensei_staff',
            false -- not allowed until approved by admin
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4.3 Auto-create journey row when student is created
CREATE OR REPLACE FUNCTION public.handle_new_student_journey()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.student_journey (student_id)
    VALUES (NEW.id)
    ON CONFLICT (student_id) DO NOTHING;
    
    -- Initialize standard document checklist rows
    INSERT INTO public.student_documents (student_id, doc_type, status)
    VALUES 
        (NEW.id, 'ktp', 'missing'),
        (NEW.id, 'kartu_keluarga', 'missing'),
        (NEW.id, 'akta_kelahiran', 'missing'),
        (NEW.id, 'ijazah', 'missing'),
        (NEW.id, 'sertifikat_bahasa', 'missing'),
        (NEW.id, 'sertifikat_ssw', 'missing'),
        (NEW.id, 'paspor', 'missing'),
        (NEW.id, 'skck', 'missing')
    ON CONFLICT (student_id, doc_type) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_student_created ON public.students;
CREATE TRIGGER on_student_created
AFTER INSERT ON public.students
FOR EACH ROW EXECUTE FUNCTION public.handle_new_student_journey();

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_journey ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: is current user an active staff?
CREATE OR REPLACE FUNCTION public.is_active_staff()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: is current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: can user manage students?
CREATE OR REPLACE FUNCTION public.can_manage_students()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() 
          AND role IN ('admin', 'operational_manager', 'principal') 
          AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.1 PROFILES POLICIES
DROP POLICY IF EXISTS "Active users can view profiles" ON public.profiles;
CREATE POLICY "Active users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_active_staff());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5.2 ALLOWLIST POLICIES
DROP POLICY IF EXISTS "Admins can view and manage allowlist" ON public.internal_allowlist;
CREATE POLICY "Admins can view and manage allowlist"
ON public.internal_allowlist FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5.3 STUDENTS & RELATED TABLES POLICIES
DROP POLICY IF EXISTS "Active staff can view students" ON public.students;
CREATE POLICY "Active staff can view students"
ON public.students FOR SELECT
TO authenticated
USING (public.is_active_staff());

DROP POLICY IF EXISTS "Staff can insert students" ON public.students;
CREATE POLICY "Staff can insert students"
ON public.students FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_students());

DROP POLICY IF EXISTS "Staff can update students" ON public.students;
CREATE POLICY "Staff can update students"
ON public.students FOR UPDATE
TO authenticated
USING (public.can_manage_students())
WITH CHECK (public.can_manage_students());

DROP POLICY IF EXISTS "Admins can delete students" ON public.students;
CREATE POLICY "Admins can delete students"
ON public.students FOR DELETE
TO authenticated
USING (public.is_admin());

-- Child tables policies (education, work, family, certs, docs, preferences, journey)
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'student_journey',
        'education_histories',
        'work_experiences',
        'family_members',
        'certifications',
        'student_documents',
        'student_status_history',
        'student_preferences'
    ]) LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Active staff can view %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Active staff can view %I" ON public.%I FOR SELECT TO authenticated USING (public.is_active_staff())', tbl, tbl);

        EXECUTE format('DROP POLICY IF EXISTS "Authorized staff can modify %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Authorized staff can modify %I" ON public.%I FOR ALL TO authenticated USING (public.can_manage_students()) WITH CHECK (public.can_manage_students())', tbl, tbl);
    END LOOP;
END;
$$;

-- 5.4 FINANCES POLICIES (RESTRICTED TO ADMIN & OPERATIONAL MANAGER)
DROP POLICY IF EXISTS "Authorized staff view finances" ON public.student_finances;
CREATE POLICY "Authorized staff view finances"
ON public.student_finances FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'operational_manager') AND is_active = true
    )
);

DROP POLICY IF EXISTS "Authorized staff manage finances" ON public.student_finances;
CREATE POLICY "Authorized staff manage finances"
ON public.student_finances FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'operational_manager') AND is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'operational_manager') AND is_active = true
    )
);

-- 5.5 AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Active staff can insert audit logs" ON public.audit_logs;
CREATE POLICY "Active staff can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (public.is_active_staff());

DROP POLICY IF EXISTS "Admin and principal can view audit logs" ON public.audit_logs;
CREATE POLICY "Admin and principal can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'principal') AND is_active = true
    )
);

-- 6. PRIVATE STORAGE BUCKET CREATION & POLICIES
-- Note: Buckets can also be initialized in Supabase dashboard under Storage -> New Bucket -> 'student-documents' (Private).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'student-documents',
    'student-documents',
    false, -- STRICTLY PRIVATE
    10485760, -- 10MB limit per file
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 10485760;

-- Storage object policies for student-documents
DROP POLICY IF EXISTS "Active staff can download documents" ON storage.objects;
CREATE POLICY "Active staff can download documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'student-documents' AND public.is_active_staff()
);

DROP POLICY IF EXISTS "Authorized staff can upload documents" ON storage.objects;
CREATE POLICY "Authorized staff can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'student-documents' AND public.can_manage_students()
);

DROP POLICY IF EXISTS "Authorized staff can delete documents" ON storage.objects;
CREATE POLICY "Authorized staff can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'student-documents' AND public.can_manage_students()
);
