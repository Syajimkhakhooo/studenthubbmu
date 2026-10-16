import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { PROGRAM_TYPES, JOB_INTEREST_FIELDS } from '../../utils/constants';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

export function StudentFormModal({ isOpen, onClose, student = null, onSuccess }) {
  const { profile } = useAuth();
  const { success, error: toastError } = useToast();
  const isEdit = Boolean(student?.id);

  const [formData, setFormData] = useState({
    student_id_number: '',
    full_name: '',
    nickname: '',
    gender: 'L',
    birth_place: '',
    birth_date: '',
    religion: 'Islam',
    blood_type: 'O',
    height_cm: '',
    weight_kg: '',
    domicile_address: '',
    id_card_address: '',
    phone_number: '',
    email: '',
    emergency_contact_name: '',
    emergency_contact_relation: 'Orang Tua',
    emergency_contact_phone: '',
    entry_date: new Date().toISOString().split('T')[0],
    program_type: 'SSW',
    target_job_interest: 'Pengolahan Makanan (Food Processing)',
    eye_vision_status: 'Normal',
    smoking_status: false,
    tattoo_status: false,
    driving_license_type: 'Tidak Ada',
    willing_overtime: true,
    willing_relocation: true,
    marital_status: 'Belum Menikah',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (student) {
      setFormData({
        student_id_number: student.student_id_number || '',
        full_name: student.full_name || '',
        nickname: student.nickname || '',
        gender: student.gender || 'L',
        birth_place: student.birth_place || '',
        birth_date: student.birth_date || '',
        religion: student.religion || 'Islam',
        blood_type: student.blood_type || 'O',
        height_cm: student.height_cm || '',
        weight_kg: student.weight_kg || '',
        domicile_address: student.domicile_address || '',
        id_card_address: student.id_card_address || '',
        phone_number: student.phone_number || '',
        email: student.email || '',
        emergency_contact_name: student.emergency_contact_name || '',
        emergency_contact_relation: student.emergency_contact_relation || 'Orang Tua',
        emergency_contact_phone: student.emergency_contact_phone || '',
        entry_date: student.entry_date || new Date().toISOString().split('T')[0],
        program_type: student.program_type || 'SSW',
        target_job_interest: student.target_job_interest || 'Pengolahan Makanan (Food Processing)',
        eye_vision_status: student.eye_vision_status || 'Normal',
        smoking_status: Boolean(student.smoking_status),
        tattoo_status: Boolean(student.tattoo_status),
        driving_license_type: student.driving_license_type || 'Tidak Ada',
        willing_overtime: student.willing_overtime !== false,
        willing_relocation: student.willing_relocation !== false,
        marital_status: student.marital_status || 'Belum Menikah',
        notes: student.notes || '',
      });
    } else {
      // Auto-generate suggested ID number: BMU-YYYYMM-XXXX
      const d = new Date();
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setFormData((prev) => ({
        ...prev,
        student_id_number: `BMU-${yr}${mo}-${randomSuffix}`,
      }));
    }
  }, [student, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.student_id_number.trim()) errs.student_id_number = 'Nomor ID Siswa wajib diisi';
    if (!formData.full_name.trim()) errs.full_name = 'Nama lengkap siswa wajib diisi';
    if (!formData.gender) errs.gender = 'Pilih jenis kelamin';
    if (!formData.entry_date) errs.entry_date = 'Tanggal masuk wajib diisi';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (isEdit) {
        await studentService.updateStudent(student.id, formData, profile);
        success('Data siswa berhasil diperbarui.');
      } else {
        await studentService.createStudent(formData, profile);
        success('Siswa baru berhasil ditambahkan.');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toastError(err.message || 'Gagal menyimpan data siswa');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Data Pokok Siswa' : 'Tambah Siswa Baru LPK BMU'}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isLoading}>
            {isEdit ? 'Simpan Perubahan' : 'Daftarkan Siswa'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Section 1: Identitas Pokok & Pendaftaran */}
        <div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
            1. Identitas Pokok &amp; Pendaftaran BMU
          </h4>
          <div className="grid grid-cols-2 gap-3 md-grid-cols-1">
            <Input
              label="Nomor ID Siswa (Unik)"
              value={formData.student_id_number}
              onChange={(e) => handleChange('student_id_number', e.target.value)}
              error={formErrors.student_id_number}
              placeholder="BMU-202610-001"
              required
            />
            <Input
              label="Tanggal Masuk LPK"
              type="date"
              value={formData.entry_date}
              onChange={(e) => handleChange('entry_date', e.target.value)}
              error={formErrors.entry_date}
              required
            />
            <Input
              label="Nama Lengkap (Sesuai KTP/Paspor)"
              value={formData.full_name}
              onChange={(e) => handleChange('full_name', e.target.value)}
              error={formErrors.full_name}
              placeholder="Contoh: Muhammad Rizky Pratama"
              required
            />
            <Input
              label="Nama Panggilan"
              value={formData.nickname}
              onChange={(e) => handleChange('nickname', e.target.value)}
              placeholder="Contoh: Rizky"
            />
            <Select
              label="Jenis Kelamin"
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              options={[
                { value: 'L', label: 'Laki-Laki (L)' },
                { value: 'P', label: 'Perempuan (P)' },
              ]}
              required
            />
            <Select
              label="Program LPK BMU"
              value={formData.program_type}
              onChange={(e) => handleChange('program_type', e.target.value)}
              options={PROGRAM_TYPES}
              required
            />
            <Select
              label="Bidang Minat Kerja Utama"
              value={formData.target_job_interest}
              onChange={(e) => handleChange('target_job_interest', e.target.value)}
              options={JOB_INTEREST_FIELDS}
            />
            <Select
              label="Status Pernikahan"
              value={formData.marital_status}
              onChange={(e) => handleChange('marital_status', e.target.value)}
              options={['Belum Menikah', 'Menikah', 'Cerai Hidup', 'Cerai Mati']}
            />
          </div>
        </div>

        {/* Section 2: Data Kelahiran & Fisik */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
            2. Tempat, Tanggal Lahir &amp; Fisik
          </h4>
          <div className="grid grid-cols-2 gap-3 md-grid-cols-1">
            <Input
              label="Tempat Lahir"
              value={formData.birth_place}
              onChange={(e) => handleChange('birth_place', e.target.value)}
              placeholder="Kota/Kabupaten Kelahiran"
            />
            <Input
              label="Tanggal Lahir"
              type="date"
              value={formData.birth_date}
              onChange={(e) => handleChange('birth_date', e.target.value)}
            />
            <Input
              label="Tinggi Badan (cm)"
              type="number"
              value={formData.height_cm}
              onChange={(e) => handleChange('height_cm', e.target.value)}
              placeholder="165"
            />
            <Input
              label="Berat Badan (kg)"
              type="number"
              value={formData.weight_kg}
              onChange={(e) => handleChange('weight_kg', e.target.value)}
              placeholder="58"
            />
            <Select
              label="Golongan Darah"
              value={formData.blood_type}
              onChange={(e) => handleChange('blood_type', e.target.value)}
              options={['A', 'B', 'AB', 'O', 'Tidak Tahu']}
            />
            <Select
              label="Kondisi Penglihatan"
              value={formData.eye_vision_status}
              onChange={(e) => handleChange('eye_vision_status', e.target.value)}
              options={['Normal', 'Minus / Kacamata', 'Silinder', 'Buta Warna Parsial', 'Lainnya']}
            />
          </div>
        </div>

        {/* Section 3: Kontak & Alamat */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
            3. Kontak &amp; Alamat Domisili
          </h4>
          <div className="grid grid-cols-2 gap-3 md-grid-cols-1">
            <Input
              label="Nomor WhatsApp / HP Siswa"
              value={formData.phone_number}
              onChange={(e) => handleChange('phone_number', e.target.value)}
              placeholder="081234567890"
            />
            <Input
              label="Alamat Email Siswa"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="siswa@gmail.com"
            />
            <Input
              label="Nama Kontak Darurat"
              value={formData.emergency_contact_name}
              onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
              placeholder="Nama Orang Tua / Wali"
            />
            <Input
              label="No. HP Kontak Darurat"
              value={formData.emergency_contact_phone}
              onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
              placeholder="081298765432"
            />
            <div style={{ gridColumn: 'span 2' }}>
              <Textarea
                label="Alamat Domisili Sekarang"
                value={formData.domicile_address}
                onChange={(e) => handleChange('domicile_address', e.target.value)}
                placeholder="Alamat lengkap tempat tinggal saat ini..."
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Section 4: Atribut & Preferensi Kerja */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
            4. Atribut Personal &amp; Preferensi Kerja
          </h4>
          <div className="grid grid-cols-2 gap-3 md-grid-cols-1">
            <Select
              label="Kepemilikan SIM"
              value={formData.driving_license_type}
              onChange={(e) => handleChange('driving_license_type', e.target.value)}
              options={['Tidak Ada', 'SIM C (Motor)', 'SIM A (Mobil)', 'SIM B1/B2 (Truk)', 'SIM C & A']}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={formData.smoking_status}
                  onChange={(e) => handleChange('smoking_status', e.target.checked)}
                />
                <span>Merokok (Smoking)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
                <input
                  type="checkbox"
                  checked={formData.tattoo_status}
                  onChange={(e) => handleChange('tattoo_status', e.target.checked)}
                />
                <span>Memiliki Tato</span>
              </label>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={formData.willing_overtime}
                onChange={(e) => handleChange('willing_overtime', e.target.checked)}
              />
              <span>Bersedia Kerja Lembur (Zangyou)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={formData.willing_relocation}
                onChange={(e) => handleChange('willing_relocation', e.target.checked)}
              />
              <span>Bersedia Ditempatkan di Prefektur Mana Saja</span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
