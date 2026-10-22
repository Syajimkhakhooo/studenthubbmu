-- ============================================================
-- Migration: Tambah status 'menunggu_coe' pada departure_readiness
-- Tanggal: 2026-10-22
-- Deskripsi: Menambahkan nilai 'menunggu_coe' (Sedang Menunggu COE)
--            sebagai status transisi antara 'belum_siap' dan 'siap'
--            pada kolom departure_readiness di tabel student_journey.
-- ============================================================

-- 1. Hapus CHECK constraint lama
ALTER TABLE public.student_journey
  DROP CONSTRAINT IF EXISTS student_journey_departure_readiness_check;

-- 2. Tambahkan CHECK constraint baru yang mencakup 'menunggu_coe'
ALTER TABLE public.student_journey
  ADD CONSTRAINT student_journey_departure_readiness_check
  CHECK (departure_readiness IN ('belum_siap', 'menunggu_coe', 'siap'));
