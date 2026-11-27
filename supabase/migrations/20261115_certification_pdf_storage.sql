-- =====================================================================
-- UPLOAD PDF SERTIFIKAT BAHASA & SSW (Tab 3. Bahasa & SSW Siswa Individu)
-- =====================================================================
-- Tab Bahasa & SSW kini dapat mengunggah file PDF sertifikat.
-- File disimpan di bucket privat 'student-documents' (folder: {student_id}/sertifikat/)
-- dan path-nya dicatat pada kolom certifications.file_storage_path
-- (kolom ini SUDAH ADA sejak 20261016_initial_schema.sql -> tidak ada perubahan tabel).
--
-- Skrip ini bersifat idempotent & aman dijalankan ulang: hanya memastikan
-- bucket menerima file PDF s.d. 10MB dan kebijakan upload/update storage aktif.
-- Jalankan di Supabase Dashboard -> SQL Editor bila upload PDF gagal
-- (mis. error "new row violates row-level security" / "mime type not allowed").
-- =====================================================================

-- 1. Pastikan bucket privat student-documents menerima PDF (maks 10MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'student-documents',
    'student-documents',
    false, -- tetap privat
    10485760, -- 10MB
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

-- 2. Kebijakan storage: staf aktif boleh membaca (untuk signed URL "Lihat PDF")
DROP POLICY IF EXISTS "Active staff can download documents" ON storage.objects;
CREATE POLICY "Active staff can download documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'student-documents' AND public.is_active_staff()
);

-- 3. Kebijakan storage: staf berwenang boleh mengunggah file baru
DROP POLICY IF EXISTS "Authorized staff can upload documents" ON storage.objects;
CREATE POLICY "Authorized staff can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'student-documents' AND public.can_manage_students()
);

-- 4. Kebijakan storage: staf berwenang boleh menimpa/mengganti file (upsert & hapus)
DROP POLICY IF EXISTS "Authorized staff can update documents" ON storage.objects;
CREATE POLICY "Authorized staff can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'student-documents' AND public.can_manage_students()
)
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
