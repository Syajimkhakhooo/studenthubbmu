export const USER_ROLES = {
  ADMIN: 'admin',
  OPERATIONAL_MANAGER: 'operational_manager',
  PRINCIPAL: 'principal',
  SENSEI_STAFF: 'sensei_staff',
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  operational_manager: 'Manajer Operasional',
  principal: 'Kepala Sekolah',
  sensei_staff: 'Sensei / Staf Internal',
};

export const PROGRAM_TYPES = [
  { value: 'SSW', label: 'SSW (Specified Skilled Worker / Tokutei Ginou)' },
  { value: 'TG_INTERNSHIP', label: 'TG / Magang (Technical Intern Trainee)' },
  { value: 'OTHER', label: 'Program Lainnya' },
];

export const LEARNING_STATUSES = [
  { value: 'baru', label: 'Baru Masuk', badge: 'neutral' },
  { value: 'sedang_belajar', label: 'Sedang Belajar', badge: 'info' },
  { value: 'lulus', label: 'Lulus Pelatihan', badge: 'success' },
  { value: 'berhenti', label: 'Berhenti / Nonaktif', badge: 'danger' },
];

export const LEAVE_STATUSES = [
  { value: 'normal', label: 'Aktif Normal', badge: 'neutral' },
  { value: 'cuti', label: 'Izin Cuti', badge: 'warning' },
  { value: 'dicutikan', label: 'Dicutikan Lembaga', badge: 'danger' },
];

export const INTERVIEW_READINESS = [
  { value: 'belum_siap', label: 'Belum Siap Interview', badge: 'neutral' },
  { value: 'siap', label: 'Siap Mengikuti Interview', badge: 'success' },
];

export const JOB_SELECTION_STATUSES = [
  { value: 'belum_mengikuti', label: 'Belum Mengikuti Seleksi', badge: 'neutral' },
  { value: 'proses', label: 'Dalam Proses Seleksi', badge: 'warning' },
  { value: 'lolos', label: 'Lolos Seleksi Kerja (Job Matching)', badge: 'success' },
  { value: 'tidak_lolos', label: 'Belum Lolos Seleksi', badge: 'danger' },
  { value: 'mengundurkan_diri', label: 'Mengundurkan Diri', badge: 'neutral' },
];

export const DEPARTURE_READINESS = [
  { value: 'belum_siap', label: 'Pemberkasan Belum Lengkap', badge: 'neutral' },
  { value: 'siap', label: 'Siap Berangkat (COE/Visa Siap)', badge: 'success' },
];

export const DEPARTURE_STATUSES = [
  { value: 'belum_berangkat', label: 'Belum Berangkat', badge: 'neutral' },
  { value: 'sudah_berangkat', label: 'Sudah Berangkat ke Jepang', badge: 'success' },
];

export const DOCUMENT_TYPES = [
  { value: 'ktp', label: 'KTP / Identitas', required: true },
  { value: 'kartu_keluarga', label: 'Kartu Keluarga (KK)', required: true },
  { value: 'akta_kelahiran', label: 'Akta Kelahiran', required: true },
  { value: 'ijazah', label: 'Ijazah Terakhir', required: true },
  { value: 'sertifikat_bahasa', label: 'Sertifikat Bahasa (JFT / JLPT)', required: false },
  { value: 'sertifikat_ssw', label: 'Sertifikat Keahlian SSW', required: false },
  { value: 'paspor', label: 'Paspor RI', required: false },
  { value: 'skck', label: 'SKCK Kepolisian', required: false },
  { value: 'surat_izin_ortu', label: 'Surat Izin Orang Tua / Wali', required: false },
  { value: 'medical_checkup', label: 'Hasil MCU (Medical Check Up)', required: false },
  { value: 'lainnya', label: 'Dokumen Tambahan Lainnya', required: false },
];

export const DOCUMENT_STATUSES = [
  { value: 'missing', label: 'Belum Tersedia', badge: 'neutral' },
  { value: 'uploaded', label: 'Sudah Unggah (Menunggu Verifikasi)', badge: 'warning' },
  { value: 'verified', label: 'Terverifikasi Valid', badge: 'success' },
  { value: 'rejected', label: 'Perlu Revisi / Ditolak', badge: 'danger' },
  { value: 'not_required', label: 'Tidak Diwajibkan', badge: 'neutral' },
];

export const CERTIFICATION_TYPES = [
  { value: 'JFT_BASIC', label: 'JFT-Basic A2' },
  { value: 'JLPT_N5', label: 'JLPT N5' },
  { value: 'JLPT_N4', label: 'JLPT N4' },
  { value: 'JLPT_N3', label: 'JLPT N3' },
  { value: 'JLPT_N2', label: 'JLPT N2' },
  { value: 'JLPT_N1', label: 'JLPT N1' },
  { value: 'SSW', label: 'SSW (Tokutei Ginou Skill Test)' },
  { value: 'OTHER', label: 'Sertifikat Lainnya' },
];

export const JOB_INTEREST_FIELDS = [
  'Pengolahan Makanan (Food Processing)',
  'Pertanian (Agriculture)',
  'Perhotelan (Accommodation/Hospitality)',
  'Perawat Lansia (Kaigo / Caregiver)',
  'Restoran (Food Service)',
  'Konstruksi (Construction)',
  'Pembersihan Gedung (Building Cleaning)',
  'Manufaktur Industri (Manufacturing)',
  'Otomotif & Reparasi',
  'Lainnya',
];
