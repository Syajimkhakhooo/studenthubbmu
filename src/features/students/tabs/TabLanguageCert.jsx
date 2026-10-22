import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { CERTIFICATION_TYPES, JOB_INTEREST_FIELDS } from '../../../utils/constants';
import { formatDate, formatCertificationLabel } from '../../../utils/formatters';
import { studentService } from '../../../services/studentService';
import { useToast } from '../../../hooks/useToast';
import { Award, Plus, Trash2, Edit2 } from 'lucide-react';

export function TabLanguageCert({ student, onUpdate }) {
  const { success, error: toastError } = useToast();
  const [certs, setCerts] = useState(student?.certifications || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    cert_type: 'JFT_BASIC',
    cert_level: 'A2',
    score: '',
    test_date: '',
    issue_date: '',
    certificate_number: '',
    verification_status: 'unverified',
    reviewer_notes: '',
  });

  const openAdd = () => {
    setEditingIdx(null);
    setFormData({
      cert_type: 'JFT_BASIC',
      cert_level: 'A2',
      score: '',
      test_date: '',
      issue_date: '',
      certificate_number: '',
      verification_status: 'unverified',
      reviewer_notes: '',
    });
    setIsModalOpen(true);
  };

  const openEdit = (item, idx) => {
    setEditingIdx(idx);
    setFormData({
      cert_type: item.cert_type || 'JFT_BASIC',
      cert_level: item.cert_level || '',
      score: item.score || '',
      test_date: item.test_date || '',
      issue_date: item.issue_date || '',
      certificate_number: item.certificate_number || '',
      verification_status: item.verification_status || 'unverified',
      reviewer_notes: item.reviewer_notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let updated;
      if (editingIdx !== null) {
        updated = [...certs];
        updated[editingIdx] = formData;
      } else {
        updated = [...certs, formData];
      }

      await studentService.saveCertifications(student.id, updated);
      setCerts(updated);
      success('Sertifikasi bahasa & keahlian berhasil diperbarui.');
      setIsModalOpen(false);
      onUpdate?.();
    } catch (err) {
      toastError(err.message || 'Gagal menyimpan sertifikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (idx) => {
    if (!window.confirm('Hapus sertifikat ini?')) return;
    try {
      const updated = certs.filter((_, i) => i !== idx);
      await studentService.saveCertifications(student.id, updated);
      setCerts(updated);
      success('Sertifikat berhasil dihapus.');
      onUpdate?.();
    } catch (err) {
      toastError('Gagal menghapus data.');
    }
  };

  return (
    <Card>
      <CardHeader
        title="Bahasa & Sertifikasi (JFT, JLPT, SSW)"
        subtitle="Sertifikat kemampuan bahasa Jepang dan keterampilan kerja resmi"
      >
        <Button variant="secondary" size="sm" icon={Plus} onClick={openAdd}>
          Tambah Sertifikat
        </Button>
      </CardHeader>
      <CardBody>
        {certs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-tertiary)' }}>
            <Award size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p>Belum ada data sertifikasi bahasa atau SSW yang dicatat.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {certs.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        backgroundColor: item.cert_type === 'SSW' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-app)',
                        color: item.cert_type === 'SSW' ? '#60a5fa' : 'var(--text-primary)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: `1px solid ${item.cert_type === 'SSW' ? 'rgba(59, 130, 246, 0.35)' : 'var(--border-subtle)'}`,
                      }}
                    >
                      {item.cert_type}
                    </span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                      {formatCertificationLabel(item)}
                    </strong>
                    <Badge variant={item.verification_status === 'verified' ? 'success' : 'neutral'}>
                      {item.verification_status === 'verified' ? 'Terverifikasi' : 'Belum Diverifikasi'}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {item.score ? `Nilai/Skor: ${item.score}  •  ` : ''}
                    {item.certificate_number ? `No. Sertifikat: ${item.certificate_number}  •  ` : ''}
                    Tanggal Tes: {formatDate(item.test_date)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(item, idx)} />
                  <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(idx)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIdx !== null ? 'Edit Sertifikasi' : 'Tambah Sertifikasi'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={isLoading}>
              Simpan
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Select
            label="Tipe Sertifikasi"
            value={formData.cert_type}
            onChange={(e) => {
              const newType = e.target.value;
              let defaultLevel = formData.cert_level;
              if (newType === 'JFT_BASIC' && (!defaultLevel || defaultLevel.length > 3)) defaultLevel = 'A2';
              if (newType.startsWith('JLPT_') && (!defaultLevel || defaultLevel.length > 3)) defaultLevel = newType.replace('JLPT_', '');
              if (newType === 'SSW' && (!defaultLevel || ['A2', 'N5', 'N4', 'N3', 'N2', 'N1'].includes(defaultLevel))) {
                defaultLevel = student.target_job_interest || student.job_interest_main || '';
              }
              setFormData({ ...formData, cert_type: newType, cert_level: defaultLevel });
            }}
            options={CERTIFICATION_TYPES}
            required
          />

          {formData.cert_type === 'SSW' ? (
            <div className="form-group">
              <label className="form-label">
                Bidang Keahlian SSW (Spesifik) <span style={{ color: 'var(--status-danger-text)' }}>*</span>
              </label>
              <input
                list="ssw-fields-options"
                className="form-input"
                value={formData.cert_level}
                onChange={(e) => setFormData({ ...formData, cert_level: e.target.value })}
                placeholder="Pilih atau ketik: Perikanan, Pengelasan, Kaigo, dll."
                required
              />
              <datalist id="ssw-fields-options">
                {JOB_INTEREST_FIELDS.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
              <span className="form-help-text">
                Pilih atau ketik bidang keahlian SSW siswa. Data ini akan ditampilkan jelas pada ekspor PDF &amp; Excel.
              </span>
            </div>
          ) : (
            <Input
              label="Level / Kategori Spesifik"
              value={formData.cert_level}
              onChange={(e) => setFormData({ ...formData, cert_level: e.target.value })}
              placeholder={
                formData.cert_type === 'JFT_BASIC'
                  ? 'A2'
                  : formData.cert_type?.startsWith('JLPT')
                  ? formData.cert_type.replace('JLPT_', '')
                  : 'Level atau kategori spesifik'
              }
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nilai / Skor Ujian"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              placeholder="Contoh: 210"
            />
            <Input
              label="Nomor Sertifikat"
              value={formData.certificate_number}
              onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
              placeholder="No. registrasi resmi"
            />
            <Input
              label="Tanggal Ujian / Terbit"
              type="date"
              value={formData.test_date}
              onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
            />
            <Select
              label="Status Verifikasi"
              value={formData.verification_status}
              onChange={(e) => setFormData({ ...formData, verification_status: e.target.value })}
              options={[
                { value: 'unverified', label: 'Belum Diverifikasi' },
                { value: 'verified', label: 'Terverifikasi Valid' },
                { value: 'rejected', label: 'Ditolak / Perlu Revisi' },
              ]}
            />
          </div>
        </form>
      </Modal>
    </Card>
  );
}
