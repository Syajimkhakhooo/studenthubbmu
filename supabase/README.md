# Panduan Konfigurasi Supabase — Student Hub BMU

Dokumen ini memandu langkah demi langkah konfigurasi Supabase untuk aplikasi **Student Hub BMU** (LPK Bahtera Mitra Unggulan).

---

## 1. Persiapan Proyek Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat proyek baru (*New Project*).
2. Tentukan nama proyek (misal: `student-hub-bmu`), password database yang kuat, dan region terdekat (misal: `Singapore`).
3. Setelah proyek aktif, buka **Project Settings** > **API**.
4. Salin:
   - **Project URL** (contoh: `https://xyzcompany.supabase.co`)
   - **anon / public key** (kunci publik yang aman dipakai di browser)
5. Di folder aplikasi, salin file `.env.example` menjadi `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
6. Buka `.env.local` dan masukkan nilai tadi:
   ```dotenv
   VITE_SUPABASE_URL=https://xyzcompany.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   *Catatan penting: Jangan pernah memasukkan `service_role` secret ke dalam file frontend atau bundle client!*

---

## 2. Menjalankan SQL Migration

1. Pada Supabase Dashboard, pilih menu **SQL Editor** di bilah kiri.
2. Klik **New Query**.
3. Buka file `supabase/migrations/20261016_initial_schema.sql` di editor Anda, salin seluruh kodenya, lalu tempelkan ke SQL Editor Supabase.
4. Klik **Run** (atau tekan `Ctrl + Enter`).
5. Pastikan output menyatakan `Success. No rows returned`.

Skrip ini akan membuat:
- Tabel: `profiles`, `internal_allowlist`, `students`, `student_journey`, `education_histories`, `work_experiences`, `family_members`, `certifications`, `student_documents`, `student_status_history`, `student_preferences`, `student_finances`, `audit_logs`.
- Row Level Security (RLS) aktif pada seluruh tabel.
- Private Storage Bucket `student-documents` beserta policy keamanannya.
- Triggers otomatis untuk update timestamp, sync user baru, inisialisasi checklist dokumen, dan student journey.

---

## 3. Konfigurasi Google OAuth di Supabase

### A. Buat OAuth Credentials di Google Cloud Console
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru atau pilih proyek yang ada.
3. Buka **APIs & Services** > **OAuth consent screen**:
   - Pilih **User Type: Internal** (jika menggunakan Google Workspace BMU) atau **External** (dengan status Testing/Published).
   - Isi App Name: `Student Hub BMU`, User Support Email, dan Developer Email.
4. Buka **APIs & Services** > **Credentials**:
   - Klik **Create Credentials** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Student Hub BMU Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (untuk lokal)
     - `https://your-production-domain.com` (domain hosting Anda)
   - **Authorized redirect URIs**:
     - Salin dari Supabase: Masuk ke Supabase Dashboard > **Authentication** > **Providers** > **Google**.
     - Ambil URL callback di baris tersebut (format: `https://<project-ref>.supabase.co/auth/v1/callback`).
     - Masukkan URL tersebut ke Authorized redirect URIs di Google Cloud Console.
   - Klik **Create**, lalu simpan **Client ID** dan **Client Secret**.

### B. Aktifkan Google Provider di Supabase
1. Di Supabase Dashboard, buka **Authentication** > **Providers** > **Google**.
2. Nyalakan switch **Enable Google provider**.
3. Tempel **Client ID** dan **Client Secret** dari Google Cloud.
4. Simpan perubahan (**Save**).

### C. Atur URL Configuration di Supabase
1. Buka **Authentication** > **URL Configuration**.
2. Atur **Site URL**:
   - Lokal: `http://localhost:5173`
   - Production: `https://your-domain.com`
3. Pada **Redirect URLs**, tambahkan:
   - `http://localhost:5173/**`
   - `https://your-domain.com/**`
4. Simpan (**Save**).

---

## 4. Mendaftarkan Admin Pertama (Allowlist Bootstrap)

Aplikasi memiliki proteksi **Allowlist Internal** di tabel `internal_allowlist`. Hanya email yang sudah didaftarkan admin yang dapat mengakses aplikasi, meskipun pengguna berhasil login Google.

Untuk mendaftarkan akun admin pertama Anda:
1. Buka **Table Editor** atau **SQL Editor** di Supabase.
2. Jalankan query SQL berikut (ganti email dengan email Google Anda):
   ```sql
   INSERT INTO public.internal_allowlist (email, default_role, full_name, notes)
   VALUES ('admin.bmu@gmail.com', 'admin', 'Administrator Utama BMU', 'Inisialisasi sistem');
   ```
3. Sekarang Anda dapat membuka aplikasi di browser, login dengan akun Google tersebut, dan otomatis akan masuk sebagai **Admin**.
4. Selanjutnya, Admin dapat menambahkan email staf lain langsung dari menu **Pengguna & Pengaturan** di dalam aplikasi.

---

## 5. Verifikasi Storage Dokumen Siswa

Bucket `student-documents` dikonfigurasi sebagai **Private**:
1. Buka **Storage** di Supabase Dashboard.
2. Pastikan bucket `student-documents` berlabel **Private** (bukan Public).
3. Dokumen hanya dapat diakses melalui signed URL sementara yang dihasilkan secara aman oleh sistem aplikasi setelah verifikasi sesi aktif.
