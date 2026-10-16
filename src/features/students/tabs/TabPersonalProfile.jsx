import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { studentService } from '../../../services/studentService';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Activity, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export function TabPersonalProfile({ student, onUpdate }) {
  const { profile } = useAuth();
  const { success, error: toastError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    height_cm: student?.height_cm || '',
    weight_kg: student?.weight_kg || '',
    blood_type: student?.blood_type || 'O',
    eye_vision_status: student?.eye_vision_status || 'Normal',
    smoking_status: Boolean(student?.smoking_status),
    tattoo_status: Boolean(student?.tattoo_status),
    driving_license_type: student?.driving_license_type || 'Tidak Ada',
    willing_overtime: student?.willing_overtime !== false,
    willing_relocation: student?.willing_relocation !== false,
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await studentService.updateStudent(student.id, formData, profile);
      success('Profil personal & fisik berhasil diperbarui.');
      setIsEditing(false);
      onUpdate?.();
    } catch (err) {
      toastError(err.message || 'Gagal menyimpan profil personal.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Profil Fisik & Karakteristik Siswa"
        subtitle="Data fisik, kebiasaan, SIM, dan kesiapan penempatan kerja Jepang"
      >
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Batal' : 'Edit Profil'}
        </Button>
      </CardHeader>
      <CardBody>
        {isEditing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="grid grid-cols-2 gap-4 md-grid-cols-1">
              <Input
                label="Tinggi Badan (cm)"
                type="number"
                value={formData.height_cm}
                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
              />
              <Input
                label="Berat Badan (kg)"
                type="number"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
              />
              <Select
                label="Golongan Darah"
                value={formData.blood_type}
                onChange={(e) => setFormData({ ...formData, blood_type: e.target.value })}
                options={['A', 'B', 'AB', 'O', 'Tidak Tahu']}
              />
              <Select
                label="Kondisi Mata"
                value={formData.eye_vision_status}
                onChange={(e) => setFormData({ ...formData, eye_vision_status: e.target.value })}
                options={['Normal', 'Minus / Kacamata', 'Silinder', 'Buta Warna Parsial', 'Lainnya']}
              />
              <Select
                label="Kepemilikan SIM"
                value={formData.driving_license_type}
                onChange={(e) => setFormData({ ...formData, driving_license_type: e.target.value })}
                options={['Tidak Ada', 'SIM C (Motor)', 'SIM A (Mobil)', 'SIM B1/B2 (Truk)', 'SIM C & A']}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.smoking_status}
                  onChange={(e) => setFormData({ ...formData, smoking_status: e.target.checked })}
                />
                <span>Merokok (Smoking)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.tattoo_status}
                  onChange={(e) => setFormData({ ...formData, tattoo_status: e.target.checked })}
                />
                <span>Memiliki Tato</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.willing_overtime}
                  onChange={(e) => setFormData({ ...formData, willing_overtime: e.target.checked })}
                />
                <span>Bersedia Kerja Lembur (Zangyou)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.willing_relocation}
                  onChange={(e) => setFormData({ ...formData, willing_relocation: e.target.checked })}
                />
                <span>Bersedia Ditempatkan di Seluruh Prefektur Jepang</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                Simpan Perubahan
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-3 gap-6 md-grid-cols-1">
            <div>
              <span className="text-xs text-subtle">Tinggi / Berat Badan</span>
              <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '2px' }}>
                {student.height_cm ? `${student.height_cm} cm` : '-'} / {student.weight_kg ? `${student.weight_kg} kg` : '-'}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Golongan Darah</span>
              <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '2px' }}>
                {student.blood_type || '-'}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Kondisi Penglihatan (Mata)</span>
              <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: '2px' }}>
                {student.eye_vision_status || 'Normal'}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Status Merokok</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                {student.smoking_status ? (
                  <span style={{ color: 'var(--status-warning-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={15} /> Merokok
                  </span>
                ) : (
                  <span style={{ color: 'var(--status-success-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={15} /> Tidak Merokok
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Status Tato</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                {student.tattoo_status ? (
                  <span style={{ color: 'var(--status-danger-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={15} /> Ada Tato
                  </span>
                ) : (
                  <span style={{ color: 'var(--status-success-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={15} /> Bebas Tato
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Kepemilikan SIM</span>
              <div style={{ fontSize: '0.9375rem', fontWeight: 500, marginTop: '2px' }}>
                {student.driving_license_type || 'Tidak Ada'}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Kesediaan Kerja Lembur</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                {student.willing_overtime !== false ? (
                  <span style={{ color: 'var(--status-success-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={15} /> Bersedia Lembur
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={15} /> Tidak Bersedia
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Kesediaan Penempatan Prefektur</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                {student.willing_relocation !== false ? (
                  <span style={{ color: 'var(--status-success-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={15} /> Siap Seluruh Prefektur
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={15} /> Prefektur Tertentu Saja
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
