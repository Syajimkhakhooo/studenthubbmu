import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  FileText,
  HelpCircle,
  Info,
} from 'lucide-react';

export function StudentImportModal({ isOpen, onClose, onSuccess }) {
  const { profile } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const fileInputRef = useRef(null);

  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'valid' | 'invalid'

  // Reset state when closing or opening
  const handleClose = () => {
    setFileName('');
    setParsedRows([]);
    setIsParsing(false);
    setIsValidating(false);
    setIsSubmitting(false);
    setActiveFilter('all');
    onClose();
  };

  /**
   * Helper: Normalize string keys for flexible header matching
   */
  const normalizeKey = (key = '') => {
    return String(key)
      .toLowerCase()
      .replace(/[\s_\-./\\]/g, '')
      .trim();
  };

  /**
   * Helper: Parse Excel date or string into YYYY-MM-DD
   */
  const parseDateValue = (raw) => {
    if (!raw) return null;
    if (raw instanceof Date) {
      if (isNaN(raw.getTime())) return null;
      // Format as local YYYY-MM-DD (avoid UTC offset shifting the date)
      const y = raw.getFullYear();
      const m = String(raw.getMonth() + 1).padStart(2, '0');
      const d = String(raw.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (typeof raw === 'number') {
      // Excel serial date: days since 1899-12-30 (accounting for Lotus 1-2-3 bug)
      try {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const msPerDay = 86400000;
        const dateObj = new Date(excelEpoch.getTime() + raw * msPerDay);
        if (!isNaN(dateObj.getTime())) {
          const y = dateObj.getUTCFullYear();
          const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
          const d = String(dateObj.getUTCDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      } catch {
        return null;
      }
    }
    const str = String(raw).trim();
    // Match YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    // Match DD/MM/YYYY or DD-MM-YYYY (Indonesian format)
    const dmy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dmy) {
      const day = dmy[1].padStart(2, '0');
      const month = dmy[2].padStart(2, '0');
      const year = dmy[3];
      return `${year}-${month}-${day}`;
    }
    // Match M/D/YYYY (SheetJS raw:false default output format, US locale)
    const mdy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (mdy) {
      // SheetJS outputs month/day/year in US format
      const month = mdy[1].padStart(2, '0');
      const day = mdy[2].padStart(2, '0');
      const year = mdy[3];
      return `${year}-${month}-${day}`;
    }
    // Try native Date parsing as last resort
    const native = new Date(str);
    if (!isNaN(native.getTime()) && str.length >= 8) {
      const y = native.getFullYear();
      const m = String(native.getMonth() + 1).padStart(2, '0');
      const d = String(native.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return null;
  };

  /**
   * Normalize gender to 'L' or 'P'
   */
  const parseGender = (raw) => {
    if (!raw) return '';
    const clean = String(raw).trim().toUpperCase();
    if (clean === 'L' || clean.startsWith('LAKI') || clean === 'PRIA' || clean === 'M' || clean === 'MALE') {
      return 'L';
    }
    if (clean === 'P' || clean.startsWith('PEREMPUAN') || clean === 'WANITA' || clean === 'F' || clean === 'FEMALE') {
      return 'P';
    }
    return clean;
  };

  /**
   * Normalize program type to 'SSW' | 'TG_INTERNSHIP' | 'OTHER'
   */
  const parseProgramType = (raw) => {
    if (!raw) return 'SSW';
    const clean = String(raw).trim().toUpperCase();
    if (clean.includes('INTERN') || clean.includes('MAGANG') || clean.includes('TG')) {
      return 'TG_INTERNSHIP';
    }
    if (clean.includes('SSW') || clean.includes('TOKUTEI')) {
      return 'SSW';
    }
    return 'OTHER';
  };

  /**
   * Parse boolean status (merokok, tato, lembur, relokasi)
   */
  const parseBoolean = (raw, defaultValue = false) => {
    if (raw === undefined || raw === null || raw === '') return defaultValue;
    if (typeof raw === 'boolean') return raw;
    const str = String(raw).trim().toLowerCase();
    if (['ya', 'y', 'true', '1', 'ada', 'bersedia', 'sudah'].includes(str)) return true;
    if (['tidak', 't', 'false', '0', 'belum', 'tidak ada'].includes(str)) return false;
    return defaultValue;
  };

  /**
   * Process raw JSON from sheet into structured student records with validation
   */
  const processRawData = async (rawRows) => {
    setIsValidating(true);

    const candidates = [];
    const idSetInFile = new Set();
    const collectedIds = [];

    // 1. Map columns based on normalized header names
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const normalizedRow = {};
      Object.keys(row).forEach((k) => {
        normalizedRow[normalizeKey(k)] = row[k];
      });

      // Extract values with flexible alias fallbacks
      const studentIdNumber = String(
        normalizedRow.nis ||
        normalizedRow.noinduk ||
        normalizedRow.nomorinduk ||
        normalizedRow.studentidnumber ||
        normalizedRow.idsiswa ||
        normalizedRow.nomorinduksiswa ||
        ''
      ).trim();

      const fullName = String(
        normalizedRow.namalengkap ||
        normalizedRow.nama ||
        normalizedRow.fullname ||
        normalizedRow.namasiswa ||
        ''
      ).trim();

      const nickname = String(
        normalizedRow.namapanggilan ||
        normalizedRow.panggilan ||
        normalizedRow.nickname ||
        ''
      ).trim();

      const genderRaw =
        normalizedRow.jeniskelamin ??
        normalizedRow.gender ??
        normalizedRow.jk ??
        normalizedRow.sex ??
        '';
      const gender = parseGender(genderRaw);

      const programRaw =
        normalizedRow.program ??
        normalizedRow.programtype ??
        normalizedRow.tipeprogram ??
        normalizedRow.jenjang ??
        'SSW';
      const programType = parseProgramType(programRaw);

      const birthPlace = String(normalizedRow.tempatlahir || normalizedRow.birthplace || '').trim();
      const birthDate = parseDateValue(normalizedRow.tanggallahir || normalizedRow.tgllahir || normalizedRow.birthdate);
      const entryDate =
        parseDateValue(normalizedRow.tanggalmasuk || normalizedRow.tglmasuk || normalizedRow.entrydate) ||
        new Date().toISOString().split('T')[0];

      const religion = String(normalizedRow.agama || normalizedRow.religion || 'Islam').trim();
      const bloodType = String(normalizedRow.golongandarah || normalizedRow.goldarah || normalizedRow.bloodtype || '').trim().toUpperCase();

      const heightRaw = normalizedRow.tinggibadan || normalizedRow.tinggicm || normalizedRow.heightcm || normalizedRow.tinggi || normalizedRow.tb;
      const heightCm = heightRaw ? parseFloat(heightRaw) : null;

      const weightRaw = normalizedRow.beratbadan || normalizedRow.beratkg || normalizedRow.weightkg || normalizedRow.berat || normalizedRow.bb;
      const weightKg = weightRaw ? parseFloat(weightRaw) : null;

      const phoneNumber = String(normalizedRow.nohp || normalizedRow.telepon || normalizedRow.phonenumber || normalizedRow.wa || '').trim();
      const email = String(normalizedRow.email || normalizedRow.surel || '').trim();
      const domicileAddress = String(normalizedRow.alamatdomisili || normalizedRow.alamat || normalizedRow.domicileaddress || '').trim();
      const idCardAddress = String(normalizedRow.alamatktp || normalizedRow.idcardaddress || '').trim();
      const targetJobInterest = String(normalizedRow.minatkerja || normalizedRow.minatbidang || normalizedRow.targetjobinterest || normalizedRow.minat || '').trim();
      const eyeVisionStatus = String(normalizedRow.statusmata || normalizedRow.mata || normalizedRow.eyevisionstatus || 'Normal').trim();

      const smokingStatus = parseBoolean(normalizedRow.merokok || normalizedRow.smokingstatus, false);
      const tattooStatus = parseBoolean(normalizedRow.tato || normalizedRow.tattoostatus, false);
      const drivingLicenseType = String(normalizedRow.sim || normalizedRow.tipesim || normalizedRow.drivinglicensetype || 'Tidak Ada').trim();
      const willingOvertime = parseBoolean(normalizedRow.bersedialembur || normalizedRow.willingovertime, true);
      const willingRelocation = parseBoolean(normalizedRow.bersediarelokasi || normalizedRow.willingrelocation, true);
      const maritalStatus = String(normalizedRow.statuspernikahan || normalizedRow.maritalstatus || 'Belum Menikah').trim();

      const emergencyContactName = String(normalizedRow.kontakdaruratnama || normalizedRow.namakontakdarurat || normalizedRow.emergencycontactname || '').trim();
      const emergencyContactRelation = String(normalizedRow.kontakdarurathubungan || normalizedRow.hubungankontakdarurat || normalizedRow.emergencycontactrelation || 'Orang Tua').trim();
      const emergencyContactPhone = String(normalizedRow.kontakdarurathp || normalizedRow.nohpkontakdarurat || normalizedRow.emergencycontactphone || '').trim();
      const notes = String(normalizedRow.catatan || normalizedRow.notes || normalizedRow.keterangan || '').trim();

      // Row Validation
      const errors = [];
      if (!studentIdNumber) {
        errors.push('NIS tidak boleh kosong');
      } else if (idSetInFile.has(studentIdNumber)) {
        errors.push(`NIS "${studentIdNumber}" duplikat dalam file ini`);
      } else {
        idSetInFile.add(studentIdNumber);
        collectedIds.push(studentIdNumber);
      }

      if (!fullName) {
        errors.push('Nama lengkap wajib diisi');
      }

      if (!gender || (gender !== 'L' && gender !== 'P')) {
        errors.push(`Jenis kelamin harus 'L' atau 'P' (terbaca: "${genderRaw || '-'}")`);
      }

      candidates.push({
        rowNumber: i + 2, // Excel 1-based index with header as row 1
        student_id_number: studentIdNumber,
        full_name: fullName,
        nickname: nickname || null,
        gender,
        program_type: programType,
        birth_place: birthPlace || null,
        birth_date: birthDate,
        entry_date: entryDate,
        religion: religion || null,
        blood_type: bloodType || null,
        height_cm: isNaN(heightCm) ? null : heightCm,
        weight_kg: isNaN(weightKg) ? null : weightKg,
        phone_number: phoneNumber || null,
        email: email || null,
        domicile_address: domicileAddress || null,
        id_card_address: idCardAddress || null,
        target_job_interest: targetJobInterest || null,
        eye_vision_status: eyeVisionStatus || 'Normal',
        smoking_status: smokingStatus,
        tattoo_status: tattooStatus,
        driving_license_type: drivingLicenseType,
        willing_overtime: willingOvertime,
        willing_relocation: willingRelocation,
        marital_status: maritalStatus,
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_relation: emergencyContactRelation || null,
        emergency_contact_phone: emergencyContactPhone || null,
        notes: notes || null,
        errors,
        isValid: errors.length === 0,
      });
    }

    // 2. Check if any NIS already exists in Supabase database
    try {
      const existingInDb = await studentService.checkStudentIdsExist(collectedIds);
      const existingSet = new Set(existingInDb);

      candidates.forEach((cand) => {
        if (cand.student_id_number && existingSet.has(cand.student_id_number)) {
          cand.errors.push(`NIS "${cand.student_id_number}" sudah terdaftar di database Supabase`);
          cand.isValid = false;
        }
      });
    } catch (err) {
      console.warn('Gagal memverifikasi duplikasi NIS ke database:', err);
    } finally {
      setIsValidating(false);
      setParsedRows(candidates);
    }
  };

  /**
   * Handle file upload and parse with SheetJS
   */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setParsedRows([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        // Use ArrayBuffer (modern, cross-browser safe approach for SheetJS)
        const arrayBuffer = evt.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // raw:false so dates come as Date objects (thanks to cellDates:true), other cells as strings
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
        if (!json || json.length === 0) {
          toastError('File Excel tidak memiliki baris data atau kosong.');
          setParsedRows([]);
          return;
        }

        await processRawData(json);
      } catch (err) {
        console.error('Error parsing excel:', err);
        toastError('Gagal membaca file Excel. Pastikan format file .xlsx, .xls, atau .csv');
        setParsedRows([]);
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setIsParsing(false);
      toastError('Gagal membuka file dari perangkat.');
    };

    // ArrayBuffer is the correct modern reader type for SheetJS
    reader.readAsArrayBuffer(file);
  };

  /**
   * Generate & download standard Excel template (.xlsx)
   */
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        nis: 'BMU-2024-001',
        nama_lengkap: 'Ahmad Fauzi',
        nama_panggilan: 'Fauzi',
        jenis_kelamin: 'L',
        program: 'SSW',
        tanggal_lahir: '2002-05-14',
        tempat_lahir: 'Banyumas',
        tanggal_masuk: '2024-10-01',
        agama: 'Islam',
        golongan_darah: 'O',
        tinggi_cm: 170,
        berat_kg: 62,
        no_hp: '081234567890',
        email: 'ahmad.fauzi@gmail.com',
        alamat_domisili: 'Jl. Raya Cilacap No. 45, Banyumas',
        minat_kerja: 'Pengolahan Makanan (Food Processing)',
        status_mata: 'Normal',
        merokok: 'Tidak',
        tato: 'Tidak',
        sim: 'SIM C',
        kontak_darurat_nama: 'Sutrisno',
        kontak_darurat_hubungan: 'Orang Tua',
        kontak_darurat_hp: '081398765432',
        catatan: 'Alumni SMKN 1 Purwokerto',
      },
      {
        nis: 'BMU-2024-002',
        nama_lengkap: 'Siti Aminah',
        nama_panggilan: 'Siti',
        jenis_kelamin: 'P',
        program: 'SSW',
        tanggal_lahir: '2003-08-20',
        tempat_lahir: 'Purbalingga',
        tanggal_masuk: '2024-10-01',
        agama: 'Islam',
        golongan_darah: 'A',
        tinggi_cm: 158,
        berat_kg: 49,
        no_hp: '081298765432',
        email: 'siti.aminah@gmail.com',
        alamat_domisili: 'Jl. Merdeka No. 10, Purbalingga',
        minat_kerja: 'Kaigo / Caregiver (Perawat Lansia)',
        status_mata: 'Minus 0.5',
        merokok: 'Tidak',
        tato: 'Tidak',
        sim: 'Tidak Ada',
        kontak_darurat_nama: 'Supriyati',
        kontak_darurat_hubungan: 'Ibu',
        kontak_darurat_hp: '081211223344',
        catatan: 'Memiliki dasar bahasa Jepang level N5',
      },
      {
        nis: 'BMU-2024-003',
        nama_lengkap: 'Rizky Pratama',
        nama_panggilan: 'Rizky',
        jenis_kelamin: 'L',
        program: 'TG_INTERNSHIP',
        tanggal_lahir: '2001-11-03',
        tempat_lahir: 'Kebumen',
        tanggal_masuk: '2024-10-01',
        agama: 'Islam',
        golongan_darah: 'B',
        tinggi_cm: 174,
        berat_kg: 68,
        no_hp: '085612345678',
        email: 'rizky.pratama@gmail.com',
        alamat_domisili: 'Desa Gombong RT 02/03, Kebumen',
        minat_kerja: 'Konstruksi & Manufaktur',
        status_mata: 'Normal',
        merokok: 'Tidak',
        tato: 'Tidak',
        sim: 'SIM C',
        kontak_darurat_nama: 'Bambang',
        kontak_darurat_hubungan: 'Ayah',
        kontak_darurat_hp: '085799887766',
        catatan: 'Pengalaman kerja las 1 tahun',
      },
    ];

    const instructionsData = [
      { Kolom: 'nis', Wajib: 'YA', Format: 'Teks bebas (Harus Unik)', Penjelasan: 'Nomor Induk Siswa BMU (contoh: BMU-2024-001)' },
      { Kolom: 'nama_lengkap', Wajib: 'YA', Format: 'Teks', Penjelasan: 'Nama lengkap resmi sesuai KTP/Ijazah' },
      { Kolom: 'jenis_kelamin', Wajib: 'YA', Format: 'L atau P', Penjelasan: 'L = Laki-laki, P = Perempuan' },
      { Kolom: 'program', Wajib: 'YA', Format: 'SSW atau TG_INTERNSHIP', Penjelasan: 'Program pelatihan kerja di Jepang' },
      { Kolom: 'tanggal_lahir', Wajib: 'Tidak', Format: 'YYYY-MM-DD', Penjelasan: 'Contoh: 2002-05-14' },
      { Kolom: 'tanggal_masuk', Wajib: 'Tidak', Format: 'YYYY-MM-DD', Penjelasan: 'Tanggal masuk BMU (jika kosong, otomatis hari ini)' },
      { Kolom: 'tinggi_cm', Wajib: 'Tidak', Format: 'Angka', Penjelasan: 'Tinggi badan dalam cm (contoh: 170)' },
      { Kolom: 'berat_kg', Wajib: 'Tidak', Format: 'Angka', Penjelasan: 'Berat badan dalam kg (contoh: 62)' },
      { Kolom: 'merokok', Wajib: 'Tidak', Format: 'Ya / Tidak', Penjelasan: 'Status merokok siswa' },
      { Kolom: 'tato', Wajib: 'Tidak', Format: 'Ya / Tidak', Penjelasan: 'Status kepemilikan tato' },
    ];

    const wb = XLSX.utils.book_new();

    // Sheet 1: Template data
    const ws1 = XLSX.utils.json_to_sheet(templateData);
    // Set column widths
    ws1['!cols'] = [
      { wch: 16 }, // nis
      { wch: 22 }, // nama_lengkap
      { wch: 14 }, // nama_panggilan
      { wch: 14 }, // jenis_kelamin
      { wch: 16 }, // program
      { wch: 14 }, // tanggal_lahir
      { wch: 16 }, // tempat_lahir
      { wch: 14 }, // tanggal_masuk
      { wch: 12 }, // agama
      { wch: 14 }, // golongan_darah
      { wch: 10 }, // tinggi_cm
      { wch: 10 }, // berat_kg
      { wch: 16 }, // no_hp
      { wch: 24 }, // email
      { wch: 30 }, // alamat_domisili
      { wch: 28 }, // minat_kerja
      { wch: 14 }, // status_mata
      { wch: 10 }, // merokok
      { wch: 10 }, // tato
      { wch: 12 }, // sim
      { wch: 20 }, // kontak_darurat_nama
      { wch: 22 }, // kontak_darurat_hubungan
      { wch: 18 }, // kontak_darurat_hp
      { wch: 30 }, // catatan
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Data Siswa');

    // Sheet 2: Panduan
    const ws2 = XLSX.utils.json_to_sheet(instructionsData);
    ws2['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 24 }, { wch: 45 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Panduan Pengisian');

    XLSX.writeFile(wb, 'Template_Import_Siswa_BMU.xlsx');
  };

  /**
   * Submit valid rows to Supabase
   */
  const handleImportSubmit = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toastError('Tidak ada data siswa yang valid untuk diimpor.');
      return;
    }

    try {
      setIsSubmitting(true);
      // Clean UI preview properties (errors, isValid, rowNumber) before sending to database
      const cleanStudents = validRows.map(({ errors, isValid, rowNumber, ...studentData }) => studentData);
      const res = await studentService.bulkCreateStudents(cleanStudents, profile);
      toastSuccess(`Berhasil mengimpor ${res.count} siswa baru ke Pangkalan Data BMU!`);

      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (err) {
      console.error('Bulk import error:', err);
      toastError(err.message || 'Terjadi kesalahan saat mengimpor data ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  const displayedRows = parsedRows.filter((r) => {
    if (activeFilter === 'valid') return r.isValid;
    if (activeFilter === 'invalid') return !r.isValid;
    return true;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Data Siswa Bulk (Excel / CSV)"
      maxWidth="max-w-2xl"
      className="student-import-modal"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            {parsedRows.length > 0 && (
              <span>
                <strong>{validCount}</strong> siap diimpor, <strong>{invalidCount}</strong> dilewati
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button
              variant="primary"
              onClick={handleImportSubmit}
              disabled={validCount === 0 || isSubmitting || isParsing || isValidating}
              isLoading={isSubmitting}
              icon={UploadCloud}
            >
              Impor {validCount > 0 ? `${validCount} Siswa Valid` : 'Data Siswa'}
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Banner Info & Download Template */}
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: '260px' }}>
            <FileSpreadsheet size={22} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                Format Template Excel LPK BMU
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                Gunakan template resmi agar nama kolom langsung dikenali otomatis oleh sistem. Kolom wajib: <code>nis</code>, <code>nama_lengkap</code>, <code>jenis_kelamin</code>, dan <code>program</code>.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleDownloadTemplate}
            style={{ flexShrink: 0 }}
          >
            Unduh Template (.xlsx)
          </Button>
        </div>

        {/* Upload Zone */}
        {!fileName ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed var(--border-default)',
              borderRadius: 'var(--radius-xl)',
              padding: '36px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-app)',
              cursor: 'pointer',
              transition: 'border-color var(--transition-fast)',
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'var(--border-default)';
              const file = e.dataTransfer.files?.[0];
              if (file) {
                const fakeEvent = { target: { files: [file] } };
                handleFileChange(fakeEvent);
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                marginBottom: '10px',
              }}
            >
              <UploadCloud size={24} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              Klik untuk memilih file atau seret ke sini
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Mendukung file Microsoft Excel (<code>.xlsx</code>, <code>.xls</code>) dan CSV (<code>.csv</code>)
            </p>
          </div>
        ) : (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileSpreadsheet size={20} color="var(--accent-primary)" />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                  {fileName}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                  ({parsedRows.length} baris terdeteksi)
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={() => {
                setFileName('');
                setParsedRows([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              title="Ganti File"
            >
              Ganti File
            </Button>
          </div>
        )}

        {/* Loading status */}
        {(isParsing || isValidating) && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}>⏳</span>
            {isParsing ? 'Membaca dan memproses struktur file Excel...' : 'Memvalidasi data dan mengecek duplikasi NIS di Supabase...'}
          </div>
        )}

        {/* Preview Table & Status */}
        {parsedRows.length > 0 && !isParsing && !isValidating && (
          <div>
            {/* Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: activeFilter === 'all' ? 600 : 400,
                    backgroundColor: activeFilter === 'all' ? 'var(--bg-surface-elevated)' : 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Semua ({parsedRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('valid')}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: activeFilter === 'valid' ? 600 : 400,
                    backgroundColor: activeFilter === 'valid' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    cursor: 'pointer',
                  }}
                >
                  ✓ Siap Impor ({validCount})
                </button>
                {invalidCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveFilter('invalid')}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: activeFilter === 'invalid' ? 600 : 400,
                      backgroundColor: activeFilter === 'invalid' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
                    ✕ Bermasalah ({invalidCount})
                  </button>
                )}
              </div>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                Menampilkan {displayedRows.length} baris
              </span>
            </div>

            {/* Scrollable Preview Table */}
            <div
              style={{
                maxHeight: '280px',
                overflowY: 'auto',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-default)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
                    <th style={{ padding: '8px 10px', width: '50px' }}>Baris</th>
                    <th style={{ padding: '8px 10px', width: '110px' }}>Status</th>
                    <th style={{ padding: '8px 10px' }}>NIS</th>
                    <th style={{ padding: '8px 10px' }}>Nama Lengkap</th>
                    <th style={{ padding: '8px 10px', width: '60px' }}>L/P</th>
                    <th style={{ padding: '8px 10px' }}>Program</th>
                    <th style={{ padding: '8px 10px' }}>No. HP</th>
                    <th style={{ padding: '8px 10px' }}>Keterangan / Masalah</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>
                        Tidak ada baris data pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor: !row.isValid ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '8px 10px', color: 'var(--text-tertiary)' }}>
                          #{row.rowNumber}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {row.isValid ? (
                            <Badge variant="success">Siap</Badge>
                          ) : (
                            <Badge variant="danger">Gagal</Badge>
                          )}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {row.student_id_number || '-'}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-primary)' }}>
                          {row.full_name || '-'}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {row.gender || '-'}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {row.program_type}
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-secondary)' }}>
                          {row.phone_number || '-'}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {row.isValid ? (
                            <span style={{ color: '#10b981' }}>Siap dimasukkan</span>
                          ) : (
                            <span style={{ color: '#ef4444', fontWeight: 500 }}>
                              {row.errors.join('; ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Note about journey & docs trigger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              <Info size={13} />
              <span>
                Setelah diimpor, checklist dokumen awal &amp; status perjalanan belajar akan otomatis diinisialisasi oleh sistem.
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
