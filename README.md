# Student Hub BMU — Pangkalan Data Siswa LPK Bahtera Mitra Unggulan

Aplikasi web internal production-oriented untuk pengelolaan pangkalan data siswa, pelacakan dokumen resmi, monitoring perjalanan/pipeline kerja ke Jepang, penelusuran multi-kriteria (Student Data Explorer), dan ekspor laporan PDF standar A4 tanpa foto siswa.

---

## 1. Stack Teknologi & Desain

- **Frontend Core:** React 18 + Vite + JavaScript / JSX
- **Backend & Database:** Supabase (PostgreSQL dengan Row Level Security / RLS aktif)
- **Autentikasi & Sesi:** Supabase Auth dengan Google OAuth & proteksi **Internal Email Allowlist**
- **Penyimpanan Dokumen:** Supabase Storage **Private Bucket** (`student-documents`) dengan Signed URLs
- **Routing:** React Router v6
- **Ikonografi:** `lucide-react`
- **Ekspor Dokumen:** `jspdf` + `jspdf-autotable` (A4 Portrait & Landscape)
- **Desain Visual:** Monokrom editorial SaaS startup profesional (graphite, deep slate, borders tipis, tipografi Plus Jakarta Sans & JetBrains Mono, tanpa glassmorphism, tanpa UI template generik).
- **Prinsip Data:** Tanpa data palsu / dummy / seeder. Seluruh angka dan grafik bersumber dari database aktual.

---

## 2. Struktur Proyek

```text
Pangkalan Data BMU/
├── public/
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   ├── router.jsx
│   │   └── providers.jsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Tabs.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Card.jsx
│   │   │   └── ui.css
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── MobileNav.jsx
│   │   └── feedback/
│   │       ├── Toast.jsx
│   │       ├── ConfirmModal.jsx
│   │       ├── LoadingSkeleton.jsx
│   │       ├── EmptyState.jsx
│   │       └── SupabaseConfigAlert.jsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── AuthCallback.jsx
│   │   │   ├── AccessDeniedPage.jsx
│   │   │   ├── CookiePolicyModal.jsx
│   │   │   └── AuthGuard.jsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx
│   │   ├── students/
│   │   │   ├── StudentListPage.jsx
│   │   │   ├── StudentDetailPage.jsx
│   │   │   ├── StudentFormModal.jsx
│   │   │   └── tabs/
│   │   │       ├── TabIdentity.jsx
│   │   │       ├── TabEducation.jsx
│   │   │       ├── TabLanguageCert.jsx
│   │   │       ├── TabWorkExperience.jsx
│   │   │       ├── TabPersonalProfile.jsx
│   │   │       ├── TabFamily.jsx
│   │   │       ├── TabDocuments.jsx
│   │   │       ├── TabJourneyStatus.jsx
│   │   │       └── TabFinances.jsx
│   │   ├── documents/
│   │   │   └── DocumentHubPage.jsx
│   │   ├── student-journey/
│   │   │   └── StudentJourneyPage.jsx
│   │   ├── reports/
│   │   │   ├── ReportsExplorerPage.jsx
│   │   │   └── pdfExport.js
│   │   └── settings/
│   │       └── SettingsPage.jsx
│   ├── hooks/
│   │   ├── useAuth.jsx
│   │   └── useToast.jsx
│   ├── lib/
│   │   └── supabase.js
│   ├── services/
│   │   ├── studentService.js
│   │   ├── documentService.js
│   │   ├── journeyService.js
│   │   ├── reportService.js
│   │   └── settingsService.js
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   └── utilities.css
│   ├── utils/
│   │   ├── constants.js
│   │   └── formatters.js
│   ├── main.jsx
│   └── index.css
├── supabase/
│   ├── migrations/
│   │   └── 20261016_initial_schema.sql
│   └── README.md
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 3. Langkah Instalasi & Menjalankan Proyek

### 3.1 Install Dependensi
Pastikan Node.js (v18+) telah terpasang di komputer Anda:
```bash
npm install
```

### 3.2 Menyiapkan Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
copy .env.example .env.local
```
Buka `.env.local` dan isi dengan kredensial proyek Supabase Anda:
```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
*(Catatan: Jangan pernah memasukkan `service_role` secret ke file frontend!)*

### 3.3 Menjalankan SQL Migration di Supabase
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) proyek Anda.
2. Buka menu **SQL Editor**.
3. Buka file `supabase/migrations/20261016_initial_schema.sql`, salin seluruh kodenya, dan jalankan (**Run**).
4. Skrip ini akan membuat:
   - 13 tabel relasional (profiles, internal_allowlist, students, student_journey, education_histories, work_experiences, family_members, certifications, student_documents, student_status_history, student_preferences, student_finances, audit_logs).
   - RLS Policies ketat untuk semua tabel.
   - Private Storage Bucket `student-documents`.
   - Triggers otomatis untuk sinkronisasi profil user baru, update timestamp, dan checklist dokumen default.

### 3.4 Menambahkan Akun Admin Pertama (Bootstrap Allowlist)
Karena sistem menerapkan proteksi **Allowlist Internal**, daftarkan email Google utama Anda terlebih dahulu via SQL Editor Supabase:
```sql
INSERT INTO public.internal_allowlist (email, default_role, full_name, notes)
VALUES ('email.anda@gmail.com', 'admin', 'Administrator Utama BMU', 'Inisialisasi sistem');
```

### 3.5 Konfigurasi Google OAuth
1. Buka [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **Credentials**.
2. Buat **OAuth 2.0 Client ID** bertipe *Web application*.
3. Masukkan Authorized redirect URI dari Supabase: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
4. Masukkan Client ID dan Secret ke **Supabase Dashboard** > **Authentication** > **Providers** > **Google**.
5. Di **Authentication** > **URL Configuration**, masukkan `http://localhost:5173` pada *Site URL* dan `http://localhost:5173/**` pada *Redirect URLs*.

### 3.6 Jalankan Server Development
```bash
npm run dev
```
Buka browser di `http://localhost:5173`.

### 3.7 Build untuk Produksi
```bash
npm run build
```

---

## 4. Fitur Utama & Panduan Penggunaan

### 1. Dashboard Operasional
- Menampilkan metrik real-time: Total Siswa Terdaftar, Siswa Baru (dengan pemilih bulan & tahun), Siswa Sedang Belajar, Siap Interview, Lolos Seleksi Kerja, Siap Berangkat, Izin Cuti, dan Sudah di Jepang.
- Ringkasan kepemilikan sertifikat JFT-Basic, JLPT (N5-N1), dan SSW.
- Kartu statistik interaktif yang dapat diklik untuk membuka daftar siswa terfilter.
- Menampilkan zero-state informatif jika database masih kosong (tanpa data palsu).

### 2. Pangkalan Data Siswa
- Server-side pagination, sorting, dan pencarian cepat berdasarkan Nama Lengkap atau Nomor ID Siswa unik.
- Form modal input siswa baru sesuai data formulir registrasi BMU.
- Profil siswa lengkap dengan **9 sub-tab**:
  1. **Identitas:** Nama, jenis kelamin, tanggal lahir, kontak, domisili, kontak darurat keluarga.
  2. **Pendidikan:** Riwayat pendidikan berjenjang (SD, SMP, SMA/SMK, D3, S1) yang dinamis.
  3. **Bahasa & SSW:** Sertifikat JFT, JLPT level, skor ujian, tanggal, status verifikasi.
  4. **Pengalaman Kerja:** Perusahaan terdahulu, bidang industri, posisi, masa kerja, deskripsi tugas.
  5. **Profil Fisik:** Tinggi/berat badan, golongan darah, kondisi mata, status merokok, tato, SIM, kesediaan lembur dan relokasi.
  6. **Keluarga:** Susunan anggota keluarga (orang tua, pasangan, saudara, anak) beserta usia & pekerjaan.
  7. **Dokumen:** Checklist 11 jenis dokumen (KTP, KK, Akta, Ijazah, Paspor, SKCK, dll.) dengan upload file ke Supabase Private Storage dan viewer melalui short-lived signed URL.
  8. **Status & Riwayat:** 6 dimensi status independen beserta catatan kronologis audit status.
  9. **Administrasi Biaya:** Rincian biaya program dan status pembayaran (khusus role Admin & Manajer).

### 3. Pusat Verifikasi Dokumen
- Tinjauan status verifikasi berkas seluruh siswa (`missing`, `uploaded`, `verified`, `rejected`, `not_required`).
- Verifikasi berkas satu per satu dengan catatan reviewer yang tercatat di audit log.
- Pembukaan dokumen aman via Signed URL berdurasi singkat tanpa mengekspos URL publik permanen.

### 4. Perjalanan & Pipeline Siswa
- Funnel 4 tahap utama: Belajar &rarr; Wawancara &rarr; Job Matching &rarr; Penempatan Jepang.
- Pemisahan status cuti sehingga izin cuti tidak menghapus riwayat belajar atau seleksi kerja.

### 5. Student Data Explorer & Ekspor Laporan PDF
- Multi-criteria AND filter dinamis terhadap database: program, gender, rentang usia, rentang tinggi badan, kepemilikan JFT/JLPT/SSW, pengalaman kerja, status merokok, SIM, kesediaan lembur/relokasi, dan dokumen terverifikasi.
- **Generator PDF Resmi Standar A4:**
  - Pilihan orientasi **Portrait** atau **Landscape**.
  - Pilihan kolom kustom yang ingin dicetak.
  - Kop resmi LPK Bahtera Mitra Unggulan, waktu cetak, ringkasan filter, dan penomoran halaman otomatis.
  - **Sesuai spesifikasi:** Tidak menampilkan foto siswa dalam tabel laporan untuk menjaga formalitas rekapitulasi data.

### 6. Pengguna & Pengaturan Sistem
- **Internal Allowlist:** Admin dapat mendaftarkan email Google baru sebelum staf login.
- **Role Management:** Pengaturan role pengguna (`admin`, `operational_manager`, `principal`, `sensei_staff`) dan status aktif akun.
- **Diagnostik Koneksi:** Uji koneksi aktif ke Supabase dan verifikasi status private storage.
- **Audit Log:** Pencatatan otomatis setiap tindakan penambahan, pengubahan, verifikasi berkas, dan penghapusan data.

---

## 5. Keamanan & Kebijakan Privasi

- **Row Level Security (RLS):** Database menolak akses dari pihak luar secara default. Akses query hanya dibuka bagi staf aktif yang terverifikasi dalam `profiles`.
- **Private Storage:** Seluruh file dokumen siswa tersimpan dalam bucket non-publik. Dokumen hanya bisa diakses menggunakan token bertanda tangan (*signed URL*) berdurasi 300 detik.
- **Kerahasiaan Kredensial:** Frontend tidak menyimpan `service_role` key atau password.
- **Kebijakan Cookie & Sesi:** Menggunakan sesi resmi Supabase Auth tanpa cookie pelacak komersial pihak ketiga.
