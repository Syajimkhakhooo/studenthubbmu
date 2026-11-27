import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { CERTIFICATION_TYPES, JOB_INTEREST_FIELDS } from '../../../utils/constants';
import { formatDate, formatCertificationLabel, formatFileSize } from '../../../utils/formatters';
import { studentService } from '../../../services/studentService';
import { documentService } from '../../../services/documentService';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Award, Plus, Trash2, Edit2, Upload, FileText, ExternalLink, X } from 'lucide-react';

const MAX_CERT_FILE_SIZE = 10 * 1024 * 1024; // 10MB, mengikuti batas bucket student-documents

function getFileNameFromPath(storagePath) {
  if (!storagePath) return '';
  const parts = String(storagePath).split('/');
  return parts[parts.length - 1] || storagePath;
}

export function TabLanguageCert({ student, onUpdate, isViewer: isViewerProp }) {
  const { profile, isViewer: authViewer } = useAuth();
  const isReadOnly = isViewerProp ?? (authViewer || profile?.role === 'viewer');
  const { success, error: toastError } = useToast();
  const [certs, setCerts] = useState(student?.certifications || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const emptyForm = {
    cert_type: 'JFT_BASIC',
    cert_level: 'A2',
    score: '',
    test_date: '',
    issue_date: '',
    certificate_number: '',
    verification_status: 'unverified',
    reviewer_notes: '',
    file_storage_path: '',
  };

  const [formData, setFormData] = useState(emptyForm);

  const openAdd = () => {
    setEditingIdx(null);
    setSelectedFile(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (item, idx) => {
    setEditingIdx(idx);
    setSelectedFile(null);
    setFormData({
      cert_type: item.cert_type || 'JFT_BASIC',
      cert_level: item.cert_level || '',
      score: item.score || '',
      test_date: item.test_date || '',
      issue_date: item.issue_date || '',
      certificate_number: item.certificate_number || '',
      verification_status: item.verification_status || 'unverified',
      reviewer_notes: item.reviewer_notes || '',
      file_storage_path: item.file_storage_path || '',
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    // Reset value agar file yang sama bisa dipilih ulang setelah dibatalkan
    e.target.value = '';
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
    if (!isPdf) {
      toastError('File sertifikat harus berformat PDF.');
      return;
    }
    if (file.size > MAX_CERT_FILE_SIZE) {
      toastError('Ukuran file PDF maksimal 10MB.');
      return;
    }
    setSelectedFile(file);
  };

  const handleOpenFile = async (storagePath) => {
    if (!storagePath) return;
    try {
      const url = await documentService.getSignedUrl(storagePath, 300); // berlaku 5 menit
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toastError('Gagal membuat tautan akses file sertifikat.');
      }
    } catch (err) {
      toastError('Gagal membuka file sertifikat.');
    }
  };

  const handleRemoveFile = async (item, idx) => {
    if (!item.file_storage_path) return;
    if (!window.confirm('Hapus file PDF sertifikat ini? Data sertifikatnya tetap tersimpan.')) return;
    try {
      const updated = [...certs];
      updated[idx] = { ...updated[idx], file_storage_path: null };
      await studentService.saveCertifications(student.id, updated);
      setCerts(updated);
      await documentService.removeCertificationFile(item.file_storage_path);
      success('File PDF sertifikat berhasil dihapus.');
      onUpdate?.();
    } catch (err) {
      toastError(err.message || 'Gagal menghapus file sertifikat.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Unggah PDF dulu bila ada file baru yang dipilih, path-nya disimpan ke data sertifikat
      let savedForm = { ...formData };
      if (selectedFile) {
        const uploaded = await documentService.uploadCertificationFile({
          studentId: student.id,
          certType: formData.cert_type,
          file: selectedFile,
          actorProfile: profile,
        });
        savedForm = { ...savedForm, file_storage_path: uploaded.path };
      }

      let updated;
      if (editingIdx !== null) {
        updated = [...certs];
        updated[editingIdx] = savedForm;
      } else {
        updated = [...certs, savedForm];
      }

      await studentService.saveCertifications(student.id, updated);

      // File lama diganti file baru -> hapus file lama dari storage agar tidak menumpuk
      const previousPath = editingIdx !== null ? certs[editingIdx]?.file_storage_path : null;
      if (selectedFile && previousPath && previousPath !== savedForm.file_storage_path) {
        await documentService.removeCertificationFile(previousPath);
      }

      setCerts(updated);
      setSelectedFile(null);
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
      const removed = certs[idx];
      const updated = certs.filter((_, i) => i !== idx);
      await studentService.saveCertifications(student.id, updated);
      setCerts(updated);
      if (removed?.file_storage_path) {
        await documentService.removeCertificationFile(removed.file_storage_path);
      }
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
        subtitle="Sertifikat kemampuan bahasa Jepang dan keterampilan kerja resmi — file PDF sertifikat dapat diunggah di sini"
      >
        {!isReadOnly && (
          <Button variant="secondary" size="sm" icon={Plus} onClick={openAdd}>
            Tambah Sertifikat
          </Button>
        )}
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
                  <div style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
                    {item.file_storage_path ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <FileText size={14} style={{ color: 'var(--status-success-text)' }} />
                        <span>
                          File PDF: <strong style={{ color: 'var(--text-primary)' }}>{getFileNameFromPath(item.file_storage_path)}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenFile(item.file_storage_path)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.8125rem' }}
                        >
                          <ExternalLink size={13} /> Lihat PDF
                        </button>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(item, idx)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--status-danger-text)', fontWeight: 600, fontSize: '0.8125rem' }}
                          >
                            <X size={13} /> Hapus File
                          </button>
                        )}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>Belum ada file PDF sertifikat terunggah</span>
                    )}
                  </div>
                </div>

                {!isReadOnly && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(item, idx)} />
                    <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(idx)} />
                  </div>
                )}
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

          {/* Upload File PDF Sertifikat */}
          <div className="form-group">
            <label className="form-label">
              <span>File Sertifikat (PDF)</span>
            </label>
            <div
              style={{
                border: '2px dashed var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-app)',
              }}
            >
              <input
                type="file"
                accept="application/pdf,.pdf"
                id="cert-file-input"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <label htmlFor="cert-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Upload size={28} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedFile
                    ? selectedFile.name
                    : formData.file_storage_path
                    ? getFileNameFromPath(formData.file_storage_path)
                    : 'Pilih file PDF sertifikat'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {selectedFile
                    ? `${formatFileSize(selectedFile.size)} — klik Simpan untuk mengunggah`
                    : formData.file_storage_path
                    ? 'Sudah terunggah — klik untuk mengganti file'
                    : 'Format PDF, maksimal 10MB per file'}
                </span>
              </label>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-danger-text)', fontWeight: 600, fontSize: '0.8125rem' }}
                >
                  <X size={13} /> Batalkan Pilihan File
                </button>
              )}
            </div>
            <span className="form-help-text">
              File disimpan aman di private storage BMU dan dapat dibuka kembali lewat tombol &quot;Lihat PDF&quot;.
            </span>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
