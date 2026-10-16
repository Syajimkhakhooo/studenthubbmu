# Student Hub BMU — Product Specification & Antigravity Build Prompt

> **Produk:** Student Hub BMU  
> **Organisasi:** LPK Bahtera Mitra Unggulan (BMU)  
> **Tujuan:** Satu sumber data siswa internal yang selalu diperbarui, mudah dicari, dapat difilter dengan banyak kriteria, dan dapat diekspor menjadi laporan PDF tanpa menyusun spreadsheet manual.  
> **Stack:** React + Vite + JavaScript/JSX + Supabase  
> **Status:** Spesifikasi implementasi awal  
> **Prinsip:** Production-oriented, tidak menggunakan data siswa palsu/seeder.

---

## 1. Instruksi utama untuk AI Antigravity

Bangun aplikasi web **Student Hub BMU** berdasarkan spesifikasi ini. Jangan hanya membuat mockup atau halaman statis. Implementasikan alur aplikasi, routing, form, validasi, loading/error/empty states, koneksi Supabase, autentikasi, otorisasi, operasi CRUD, filter dinamis, serta laporan PDF.

### Stack wajib

- React dengan Vite dan JavaScript/JSX, bukan Next.js, TypeScript, Flutter, atau framework native.
- Supabase untuk PostgreSQL database, Auth, dan private Storage.
- React Router untuk routing.
- CSS yang dikustomisasi untuk identitas produk; boleh menggunakan CSS Modules atau CSS biasa yang terstruktur.
- Ikon konsisten dari `lucide-react`.
- Pilih library stabil yang diperlukan untuk formulir/validasi, tanggal, tabel, dan PDF. Hindari menambahkan dependency tanpa alasan.
- Gunakan `.env.local` untuk konfigurasi lokal dan sediakan `.env.example` tanpa secret.
- Tidak ada data siswa dummy, mock API yang berpura-pura menjadi data nyata, atau seed siswa. Jika Supabase belum dikonfigurasi, tampilkan halaman setup/error yang jelas; jangan mengarang data.

### Sasaran produk

Aplikasi ini khusus untuk staf internal LPK BMU yang diizinkan. Kepala sekolah/manajer harus dapat menjawab pertanyaan seperti:

- Berapa siswa baru yang masuk pada bulan tertentu?
- Siapa saja siswa yang sudah mempunyai JFT, JLPT, atau sertifikat SSW?
- Siapa yang belum mempunyai dokumen tertentu atau dokumennya belum diverifikasi?
- Siapa yang siap interview, lolos seleksi kerja, siap berangkat, sedang cuti, atau sudah berangkat?
- Siswa mana yang sesuai dengan kombinasi bidang kerja, program, usia, tinggi badan, nilai bahasa, pengalaman, dan preferensi?
- Bagaimana menghasilkan daftar hasil filter ke PDF A4 portrait atau landscape tanpa menampilkan foto siswa?

Semua jawaban harus berasal dari data Supabase yang tersimpan. Student Hub menjadi **sumber data utama** setelah proses impor dan verifikasi spreadsheet lama. Hindari menjadikan spreadsheet dan aplikasi sebagai dua sumber data paralel yang saling tidak sinkron.

---

## 2. Identitas dan arah visual

### Gaya desain

Bangun UI dengan nuansa produk SaaS startup profesional: matang, editorial, bersih, presisi, dan konsisten. Hindari tampilan template admin generik.

**Persyaratan visual:**

- Monokrom sebagai palet utama: graphite, hitam, abu-abu, putih, dan off-white.
- Tidak menggunakan glassmorphism, blur dekoratif, transparansi seperti kaca, gradient mencolok, atau glow.
- Jangan mengandalkan komponen native browser sebagai desain akhir. Kustomisasi tombol, input, dropdown, tab, modal, tooltip, date picker, tabel, navigasi, dan menu.
- Gunakan tipografi modern dan hierarki yang jelas; sediakan font lokal/web yang berlisensi sesuai jika diperlukan, dengan fallback yang layak.
- Gunakan border tipis, spacing konsisten, radius secukupnya, dan shadow sangat ringan hanya jika membantu hierarki.
- Animasi mikro singkat dan bermakna; hormati `prefers-reduced-motion`.
- Gunakan status badge dengan warna semantik secara terbatas bila benar-benar membantu. UI dasar tetap monokrom.
- Tidak menggunakan emoji sebagai pengganti ikon antarmuka.
- Jangan menampilkan dekorasi yang mengganggu kepadatan informasi.

### Responsif

Rancang dan uji setidaknya pada lebar 360px, 390px, 768px, 1024px, 1366px, dan 1440px.

- Desktop: sidebar yang dapat diciutkan, header ringkas, area konten terukur.
- Tablet: navigasi dan tabel menyesuaikan; jangan membuat seluruh halaman meluber horizontal.
- Mobile: navigasi ringkas/drawer, filter dalam panel atau sheet, form satu kolom, tindakan utama mudah dijangkau, tabel berubah menjadi tampilan daftar/kartu jika lebih mudah dibaca.
- Tabel yang padat boleh memiliki scroll horizontal pada area tabel saja, bukan pada seluruh halaman.
- Aksesibilitas: label form jelas, focus state terlihat, kontras memadai, navigasi keyboard, dan target sentuh yang cukup besar.

### Prinsip pengalaman pengguna

- Satu tindakan utama yang jelas di setiap halaman.
- Pencarian dan filter mudah ditemukan.
- Jangan membuat semua informasi tampil sekaligus; gunakan tab/section pada profil siswa.
- Sediakan loading skeleton, empty state yang informatif, error state dengan tindakan ulang, konfirmasi untuk tindakan berisiko, dan toast untuk hasil aksi.
- Hindari tombol dekoratif yang tidak bekerja.
- Semua jumlah, grafik, tabel, dan statistik harus dinamis dari database.
- Laporan daftar siswa tidak menampilkan foto.

---

## 3. Navigasi utama

1. **Dashboard**
2. **Data Siswa**
3. **Dokumen Siswa**
4. **Perjalanan Siswa**
5. **Filter & Laporan**
6. **Pengguna & Pengaturan** — hanya untuk role yang berwenang.

Tidak perlu membuat modul terpisah untuk manajemen perusahaan atau job order. Informasi bidang/perusahaan/pekerjaan yang diperlukan boleh dicatat sebagai informasi terkait siswa, tetapi ruang lingkup aplikasi adalah data dan perjalanan siswa.

---

## 4. Modul dan perilaku

### 4.1 Dashboard

Tampilkan ringkasan aktual, bukan angka hard-coded:

- Total siswa terdaftar.
- Siswa baru pada bulan terpilih.
- Siswa aktif belajar.
- Siswa siap interview.
- Siswa lolos seleksi kerja.
- Siswa siap berangkat.
- Siswa sedang cuti/dicutikan.
- Siswa sudah berangkat.
- Ringkasan sertifikat bahasa dan kelengkapan dokumen.

Sediakan pemilih bulan/tahun untuk statistik siswa baru. Kartu statistik dapat diklik untuk membuka Data Siswa dengan filter terkait. Jika data kosong, tampilkan zero state, bukan angka contoh.

### 4.2 Data Siswa

Fitur:

- Daftar siswa dengan server-side pagination, pencarian, sorting, dan filter.
- Tambah, lihat, edit, dan arsipkan siswa sesuai hak akses.
- Cegah duplikasi nomor ID siswa; jangan mengandalkan nama sebagai kunci unik.
- Tampilkan waktu pembaruan dan siapa yang terakhir memperbarui jika tersedia.
- Profil siswa dengan tab:
  1. Identitas
  2. Pendidikan
  3. Bahasa & Sertifikasi
  4. Pengalaman Kerja
  5. Profil Pribadi
  6. Keluarga
  7. Dokumen
  8. Status & Riwayat
  9. Administrasi biaya (khusus role yang diizinkan)

Gunakan section form yang jelas dan validasi. Riwayat pendidikan, pengalaman kerja, dan anggota keluarga harus dinamis, bukan dibatasi jumlah slot tetap.

### 4.3 Dokumen Siswa

Dokumen yang dapat dilacak sesuai kebutuhan BMU:

- Identitas/KTP atau NIK (metadata sensitif; akses terbatas).
- Kartu Keluarga.
- Akta kelahiran.
- Ijazah/berkas pendidikan.
- Sertifikat bahasa JFT/JLPT.
- Sertifikat keterampilan SSW.
- Paspor.
- SKCK.
- Dokumen lain yang ditambahkan admin.

Setiap dokumen memiliki jenis, status, tanggal unggah, tanggal verifikasi, pemeriksa, catatan, dan file jika tersedia. Pisahkan keadaan:
- `missing`: belum tersedia.
- `uploaded`: file sudah diunggah tetapi belum diverifikasi.
- `verified`: sudah diperiksa dan valid.
- `rejected`: perlu diperbaiki/diunggah ulang.
- `not_required`: tidak berlaku untuk siswa ini.

Data kosong tidak otomatis berarti siswa tidak memiliki sertifikat. Bedakan **belum diketahui**, **tidak memiliki**, **file belum tersedia**, dan **belum diverifikasi** jika proses bisnis membutuhkan pembedaan tersebut.

File disimpan pada Supabase Storage bucket **private**. Jangan membuat URL publik permanen untuk dokumen pribadi. Gunakan signed URL berdurasi singkat setelah pemeriksaan izin.

### 4.4 Perjalanan Siswa

Status harus dimodelkan terpisah, bukan satu dropdown status tunggal. Contoh dimensi:

- `learning_status`: baru, sedang belajar, lulus, berhenti.
- `leave_status`: normal, cuti, dicutikan.
- `interview_readiness`: belum siap, siap.
- `job_selection_status`: belum mengikuti, proses, lolos, tidak lolos, mengundurkan diri.
- `departure_readiness`: belum siap, siap.
- `departure_status`: belum berangkat, sudah berangkat.
- `program_type`: SSW, TG/magang, atau opsi yang dikonfigurasi.

Simpan perubahan status penting sebagai riwayat dengan timestamp, pengguna yang mengubah, nilai sebelum/sesudah, dan catatan. Validasi transisi status tanpa memaksakan urutan yang tidak sesuai kasus nyata. Status cuti tidak boleh menghapus status belajar atau riwayat seleksi.

### 4.5 Filter & Laporan — fitur inti

Bangun **Student Data Explorer** untuk membuat pencarian gabungan dari data aktual.

Filter yang dibutuhkan:

- Bulan/tahun tanggal masuk LPK.
- Jenis kelamin.
- Rentang usia.
- Rentang tinggi badan.
- Program SSW/TG/magang.
- Bidang kerja/minat.
- Status pembelajaran.
- Status cuti/dicutikan.
- Kesiapan interview.
- Status lolos seleksi kerja.
- Kesiapan berangkat dan sudah berangkat.
- Memiliki/tidak memiliki JFT, JLPT, sertifikat SSW; level dan nilai minimal.
- Pengalaman kerja dan bidang pengalaman.
- Tidak merokok.
- Memiliki SIM.
- Bersedia lembur.
- Bersedia ditempatkan di mana saja.
- Kelengkapan/validasi dokumen tertentu.
- Preferensi tambahan yang memang tersedia pada data.

Perilaku:
- Beberapa filter bisa digunakan bersama.
- Definisikan kombinasi antar-filter sebagai **AND** secara default; untuk pilihan nilai dalam satu filter gunakan perilaku yang masuk akal dan jelaskan secara visual.
- Hasil, jumlah siswa, dan ringkasan kriteria harus diperbarui ketika filter berubah.
- Pencarian harus dilakukan terhadap query Supabase, bukan hanya array halaman yang sedang tampil.
- Sediakan tombol reset filter, simpan preset filter jika sesuai hak akses, dan pilih kolom laporan.
- Preview menampilkan daftar nama/kolom terpilih, jumlah hasil, waktu pembuatan, dan ringkasan filter.
- Tidak menampilkan foto siswa di laporan.
- Ekspor PDF dengan A4 portrait dan landscape; judul laporan, tanggal/waktu, filter yang dipakai, nomor halaman bila library mendukung, dan tabel yang rapi.
- Cetak/unduh harus bekerja dan menangani data banyak secara aman.
- Terapkan batas ekspor dan otorisasi untuk data sensitif.
- Hindari memasukkan NIK, data keluarga, kontak pribadi, dan finansial ke laporan secara default.

### 4.6 Pengguna & Pengaturan

Peran awal:

- **Admin:** mengelola data siswa dan konfigurasi operasional yang diizinkan, dokumen, serta pengguna sesuai kebijakan.
- **Manajer Operasional:** melihat dan memperbarui data operasional sesuai izin; akses finansial dan identitas sensitif tidak otomatis diberikan.
- **Kepala Sekolah:** melihat dashboard, mencari/filter data, melihat profil sesuai izin, dan menghasilkan laporan; dapat menambah/memperbarui siswa jika kebijakan BMU mengizinkan.
- **Sensei/staf terkait:** akses terbatas sesuai tugas, tanpa akses otomatis ke data finansial atau data pribadi yang tidak dibutuhkan.

Jadikan role dan permission dapat dikembangkan. Jangan hanya menyembunyikan menu di frontend; otorisasi wajib ditegakkan di database melalui RLS dan fungsi/endpoint tepercaya bila dibutuhkan.

---

## 5. Login Google/Gmail, sesi, cookie, dan pemulihan akun

### Metode autentikasi

Gunakan Supabase Auth dengan Google OAuth sebagai opsi login utama. Pengguna harus memakai akun Google yang sudah diizinkan oleh admin. Login Google yang berhasil **tidak otomatis** berarti akun mendapat akses ke aplikasi.

Untuk mendukung pemulihan password mandiri:
- Akun yang masuk melalui Google memulihkan akses melalui proses pemulihan akun Google.
- Jika BMU ingin menyediakan login email-password juga, gunakan fitur Supabase `resetPasswordForEmail` dan alur reset yang diverifikasi lewat email.
- Jangan membuat sistem password sendiri atau menyimpan password dalam tabel aplikasi.

### Cookie dan sesi

- Gunakan mekanisme session/token resmi Supabase Auth; jangan membuat cookie buatan yang berisi password, access token mentah, refresh token mentah, NIK, atau data siswa.
- Untuk aplikasi React SPA dengan Supabase JS, gunakan session persistence yang didukung SDK dan jangan menyalin token ke `localStorage`, cookie custom, atau state yang tidak aman secara manual.
- Konfigurasikan cookie consent hanya jika aplikasi memakai kategori cookie non-esensial/analytics atau memang ada kebutuhan hukum/persetujuan. Cookie esensial untuk autentikasi harus dijelaskan dalam pemberitahuan privasi; jangan menampilkan consent banner yang menyesatkan.
- Jika deployment memerlukan cookie `HttpOnly`, `Secure`, dan `SameSite`, implementasikan pola server-side/BFF yang sesuai dan teruji. Jangan mengklaim cookie yang dibuat di frontend sebagai `HttpOnly`, karena JavaScript tidak dapat menetapkan atribut tersebut.
- Gunakan HTTPS di deployment. Hindari domain wildcard dan callback URL yang terlalu longgar.
- Terapkan logout yang membersihkan session melalui SDK, penanganan token kedaluwarsa, dan redirect aman.
- Batasi masa sesi sesuai kemampuan konfigurasi Supabase dan kebijakan organisasi; jangan menjanjikan timeout khusus jika belum dikonfigurasi.
- Jangan pernah menyimpan kredensial service-role Supabase di frontend. Hanya publishable/anon key yang memang ditujukan untuk client boleh berada di variabel frontend, dengan RLS yang benar.
- Validasi origin/redirect OAuth dan gunakan daftar URL callback yang eksplisit.
- Tampilkan informasi sesi yang diperlukan, misalnya akun yang sedang aktif, serta tombol logout.

### Cookie notice / privasi

Sediakan halaman atau modal **Privasi & Penggunaan Cookie** yang menjelaskan secara ringkas:
- Cookie/session esensial untuk login, menjaga sesi, keamanan, dan fungsi aplikasi.
- Cookie analytics/marketing tidak dipasang secara default.
- Dokumen dan data siswa hanya untuk pengguna internal yang berwenang.
- Pengguna dapat logout untuk mengakhiri sesi dari perangkat tersebut.
- Cara menghubungi admin BMU terkait akses atau koreksi data.

Jangan menambahkan tracking pihak ketiga atau analytics tanpa persetujuan dan kebutuhan yang jelas. Jangan mengklaim aplikasi sepenuhnya patuh hukum tanpa pemeriksaan yang sesuai.

---

## 6. Skema database awal

Buat migration SQL yang dapat dijalankan dan ditinjau, dengan foreign key, index, constraint, timestamp, serta kebijakan RLS. Sesuaikan tipe dan kolom setelah memetakan spreadsheet sumber.

Tabel inti yang disarankan:

- `profiles`: `id` mengacu ke `auth.users.id`, nama tampilan, email, role, status aktif, timestamp.
- `students`: ID UUID, nomor ID siswa unik, identitas utama, tanggal masuk, program, bidang minat, preferensi kerja, dan atribut utama yang diperlukan untuk filter.
- `education_histories`: relasi siswa, jenjang, institusi, jurusan, tanggal/tahun mulai dan selesai.
- `work_experiences`: relasi siswa, perusahaan terdahulu, bidang, tanggal mulai/selesai, deskripsi seperlunya.
- `family_members`: relasi siswa, hubungan, nama, umur, pekerjaan, kontak jika dibutuhkan dan diizinkan.
- `certifications`: relasi siswa, tipe, level, nilai, tanggal ujian/terbit/kedaluwarsa jika relevan, status verifikasi, metadata file.
- `student_documents`: relasi siswa, tipe dokumen, status, storage path, tanggal unggah/verifikasi, pemeriksa, catatan.
- `student_status_history`: relasi siswa, jenis status, status lama/baru, catatan, actor, timestamp.
- `student_preferences`: relasi siswa, pilihan bidang dan atribut preferensi yang tidak cocok ditempatkan di tabel utama.
- `student_finances`: relasi siswa, kategori biaya, nominal, nominal dibayar, tanggal/catatan; akses paling ketat.
- `audit_logs`: actor, tindakan, tipe/ID record, timestamp, metadata perubahan yang aman.

Jangan menyimpan banyak data berulang dalam satu kolom teks/JSON jika relasi tabel lebih tepat. JSON boleh digunakan untuk metadata non-kritis yang benar-benar fleksibel. Pertimbangkan minimisasi data: hanya simpan data keluarga, finansial, dan identitas sensitif yang benar-benar dibutuhkan.

### Aturan database

- Nomor ID siswa harus unik.
- Gunakan `created_at` dan `updated_at`; `updated_at` harus diperbarui konsisten.
- Tambahkan index pada kolom filter/pencarian yang sering digunakan.
- Gunakan constraint untuk rentang nilai dan validitas data bila memungkinkan.
- RLS aktif pada seluruh tabel yang berisi data privat.
- Default deny untuk user yang belum terdaftar/aktif.
- Role admin tidak boleh ditentukan dari metadata yang dapat diubah user sendiri.
- Buat alur provisioning pengguna yang aman; jangan memberi hak admin kepada pendaftar pertama secara otomatis di production tanpa prosedur bootstrap yang terkontrol.
- Audit log tidak boleh mengandung password, token, atau isi dokumen pribadi.
- Sediakan migration SQL; jangan menjalankan perubahan destructive tanpa konfirmasi dan backup.

---

## 7. Import spreadsheet lama

Spreadsheet pendaftaran BMU memiliki banyak kelompok data: identitas, kontak, pendidikan, pengalaman kerja, keluarga, sertifikat, dokumen/tautan, preferensi, status proses, biaya, dan informasi penempatan.

Buat rencana impor yang:
1. Memetakan setiap kolom sumber ke field/table target.
2. Mengidentifikasi kolom duplikat dan kolom generik seperti `Column 140` yang harus diperiksa manual.
3. Menggunakan nomor ID siswa sebagai pengenal utama; nama saja tidak cukup untuk pencocokan.
4. Menormalisasi pendidikan, pekerjaan, keluarga, sertifikat, dan dokumen menjadi tabel relasi.
5. Mempertahankan data sumber yang masih dibutuhkan, tanpa otomatis menampilkan semua kolom di pencarian/laporan.
6. Menyimpan nilai kosong sebagai kosong/tidak diketahui; tidak mengubahnya menjadi “tidak punya”.
7. Menyediakan preview, validasi, laporan baris gagal, deteksi duplikasi, dan opsi dry-run.
8. Tidak mengimpor contoh pribadi ke kode, fixture, atau repository.
9. Tidak melakukan import otomatis tanpa persetujuan dan backup.
10. Memisahkan data sensitif dan menerapkan hak akses.

Sediakan template mapping CSV atau dokumentasi import yang dapat diperbarui setelah spreadsheet aktual diperiksa.

---

## 8. Struktur folder yang diharapkan

```text
student-hub-bmu/
├── public/
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   ├── router.jsx
│   │   └── providers.jsx
│   ├── assets/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── feedback/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── students/
│   │   ├── documents/
│   │   ├── student-journey/
│   │   ├── reports/
│   │   └── settings/
│   ├── hooks/
│   ├── lib/
│   │   └── supabase.js
│   ├── services/
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   └── utilities.css
│   ├── utils/
│   ├── main.jsx
│   └── index.css
├── supabase/
│   ├── migrations/
│   └── README.md
├── .env.example
├── .env.local
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

Jangan menambahkan file `seed.sql` berisi data siswa palsu. Migration berisi struktur dan kebijakan database saja.

---

## 9. Environment variables

Buat `.env.example` seperti ini:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Gunakan nama variabel yang sesuai dengan versi SDK dan project Supabase. Jangan commit `.env.local`. Jangan pernah menaruh `service_role` key atau secret OAuth di variabel `VITE_*` karena semua variabel Vite berawalan tersebut dapat masuk ke bundle browser.

Dokumentasikan konfigurasi berikut di README:
- Membuat project Supabase.
- Mengisi URL dan publishable/anon key.
- Mengaktifkan Google provider dan mengatur kredensial OAuth.
- Mengisi Site URL dan Redirect URLs yang tepat.
- Menjalankan migration SQL.
- Mengatur private Storage bucket dan policy.
- Mengundang/provisioning pengguna internal secara aman.
- Menjalankan project lokal dan deployment HTTPS.

---

## 10. Keamanan wajib

- Aktifkan RLS untuk semua tabel privat.
- Uji akses sebagai admin, manajer, kepala sekolah, sensei, user nonaktif, dan user yang belum diizinkan.
- Validasi data di client dan database.
- Jangan mengandalkan proteksi route frontend sebagai satu-satunya pengamanan.
- Jangan gunakan service-role key di browser.
- Jangan mengirim file privat dengan URL publik.
- Batasi akses ke NIK, data keluarga, finansial, dan kontak pribadi.
- Terapkan audit log untuk perubahan data penting.
- Tangani error tanpa membocorkan SQL, secret, atau informasi internal.
- Gunakan HTTPS saat deployment.
- Jangan menampilkan informasi sensitif pada log browser.
- Sediakan prosedur backup dan uji pemulihan.
- Periksa dependency dan hindari library yang tidak terawat jika ada alternatif wajar.

---

## 11. Kriteria selesai / acceptance criteria

Aplikasi belum dianggap selesai jika hanya tampak bagus. Pastikan:

- [ ] React + Vite berjalan tanpa error build.
- [ ] Semua route dan navigasi utama berfungsi.
- [ ] Google OAuth benar-benar bekerja setelah kredensial Supabase dikonfigurasi.
- [ ] Akun yang belum diizinkan ditolak meskipun berhasil login.
- [ ] Logout dan pemulihan akses dijelaskan dan bekerja sesuai metode login.
- [ ] Cookie/session tidak menyimpan password atau token secara manual.
- [ ] Migration dapat diterapkan dan RLS diuji.
- [ ] CRUD siswa tersambung ke Supabase.
- [ ] Pendidikan, pekerjaan, keluarga, sertifikasi, dan dokumen mendukung banyak record.
- [ ] Status belajar, cuti, seleksi, dan keberangkatan terpisah.
- [ ] Filter gabungan menghasilkan data dari database dengan benar.
- [ ] Statistik siswa baru mengikuti bulan/tahun yang dipilih.
- [ ] PDF A4 portrait dan landscape dapat dibuat dan tidak menampilkan foto siswa.
- [ ] File dokumen disimpan privat dan aksesnya diverifikasi.
- [ ] Tidak ada data siswa dummy/seeder.
- [ ] Loading, empty, success, dan error states tersedia.
- [ ] Layout diuji pada mobile, tablet, dan desktop.
- [ ] Tidak ada tombol utama yang sekadar dekoratif.
- [ ] README menjelaskan setup lokal, Supabase, OAuth, migration, Storage, dan deployment.

---

## 12. Tahapan kerja untuk AI Antigravity

Implementasikan secara bertahap, tetapi terus lanjutkan tanpa berhenti setelah membuat rencana:

**Tahap A — Fondasi**
- Inspeksi project saat ini sebelum mengubah file.
- Buat struktur React + Vite dan routing.
- Bangun design tokens, layout responsif, komponen UI kustom, halaman login, dan shell aplikasi.
- Jangan membuat data siswa palsu untuk mengisi dashboard.

**Tahap B — Supabase dan Auth**
- Tambahkan client Supabase dengan environment variables.
- Implementasikan Google OAuth, callback, session listener, logout, route guard, dan pemeriksaan akun internal yang diizinkan.
- Dokumentasikan setup manual yang membutuhkan tindakan pengguna di dashboard Google/Supabase.
- Jangan berpura-pura OAuth sudah bekerja sebelum kredensial asli dikonfigurasi.

**Tahap C — Database dan izin**
- Buat migration SQL dan RLS yang eksplisit.
- Buat policy Storage privat.
- Dokumentasikan provisioning pengguna dan role dengan aman.
- Tinjau potensi akses lintas role.

**Tahap D — Fitur inti**
- CRUD data siswa.
- Profil/tab siswa.
- Dokumen dan status verifikasi.
- Perjalanan/status siswa.
- Filter dinamis dan PDF.
- Dashboard dari data aktual.
- Audit log dan pembatasan akses.

**Tahap E — Quality assurance**
- Jalankan lint/build dan perbaiki error.
- Periksa seluruh route, form, loading/error states, responsivitas, dan keyboard navigation.
- Uji kasus tanpa data, query kosong, data banyak, sesi kedaluwarsa, dan akses ditolak.
- Tulis daftar setup yang masih harus dilakukan manual.

Jika ada konfigurasi eksternal yang membutuhkan credential atau tindakan pengguna, siapkan kode dan instruksi secara lengkap, tandai apa yang belum dikonfigurasi, dan jangan mengarang credential atau menyatakan fitur sudah aktif.

---

# Prompt ringkas untuk ditempel ke Antigravity

Bangun aplikasi **Student Hub BMU** mengikuti seluruh spesifikasi dalam dokumen ini. Gunakan React + Vite + JavaScript/JSX dan Supabase. Buat produk SaaS internal yang profesional, monokrom, responsif pada mobile/tablet/desktop, tanpa glassmorphism dan tanpa UI native/generik. Prioritaskan sumber data siswa terpusat, profil berdasarkan form pendaftaran BMU, checklist dokumen, status perjalanan siswa yang terpisah, filter gabungan berbasis database, serta PDF A4 portrait/landscape tanpa foto. Implementasikan Google OAuth melalui Supabase, allowlist pengguna internal, session/cookie handling yang aman, RLS, private Storage, audit log, dan dokumentasi setup. Jangan membuat dummy/seeder data siswa, jangan menaruh secret di frontend, jangan hanya membuat mockup, dan jangan mengklaim integrasi sudah aktif sebelum kredensial eksternal benar-benar dikonfigurasi. Inspeksi project yang ada sebelum mengubah file, kerjakan implementasi bertahap sampai build berhasil, lalu laporkan fitur yang selesai, pengaturan manual yang diperlukan, dan hasil pengujian.
