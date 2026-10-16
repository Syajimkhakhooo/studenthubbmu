import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { DOCUMENT_TYPES, DOCUMENT_STATUSES } from '../../../utils/constants';
import { getDocStatusMeta, formatDateTime, formatFileSize } from '../../../utils/formatters';
import { documentService } from '../../../services/documentService';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { FileText, Upload, CheckCircle, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

export function TabDocuments({ student, onUpdate }) {
  const { profile } = useAuth();
  const { success, error: toastError } = useToast();

  const [docsList, setDocsList] = useState(student?.student_documents || []);
  const [uploadModalDoc, setUploadModalDoc] = useState(null); // docType to upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Status verify modal
  const [verifyModalDoc, setVerifyModalDoc] = useState(null);
  const [newStatus, setNewStatus] = useState('verified');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Map checklist against standard DOCUMENT_TYPES
  const checklist = DOCUMENT_TYPES.map((typeObj) => {
    const existing = docsList.find((d) => d.doc_type === typeObj.value);
    return {
      docType: typeObj.value,
      label: typeObj.label,
      required: typeObj.required,
      existingDoc: existing || null,
      status: existing ? existing.status : 'missing',
    };
  });

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !uploadModalDoc) {
      toastError('Harap pilih file dokumen terlebih dahulu.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await documentService.uploadStudentDocument({
        studentId: student.id,
        docType: uploadModalDoc,
        file: selectedFile,
        actorProfile: profile,
      });

      // Update local state
      const updated = docsList.filter((d) => d.doc_type !== uploadModalDoc);
      setDocsList([...updated, res]);

      success('File dokumen berhasil diunggah ke private storage.');
      setUploadModalDoc(null);
      setSelectedFile(null);
      onUpdate?.();
    } catch (err) {
      toastError(err.message || 'Gagal mengunggah dokumen.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenSignedUrl = async (storagePath) => {
    if (!storagePath) return;
    try {
      const url = await documentService.getSignedUrl(storagePath, 300); // 5 minutes
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toastError('Gagal membuat tautan akses dokumen privat.');
      }
    } catch (err) {
      toastError('Gagal membuka file dokumen.');
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyModalDoc) return;

    setIsVerifying(true);
    try {
      const res = await documentService.updateVerificationStatus({
        docId: verifyModalDoc.id,
        status: newStatus,
        reviewerNotes,
        actorProfile: profile,
      });

      const updated = docsList.map((d) => (d.id === res.id ? res : d));
      setDocsList(updated);

      success(`Status dokumen berhasil diubah ke: ${newStatus}`);
      setVerifyModalDoc(null);
      setReviewerNotes('');
      onUpdate?.();
    } catch (err) {
      toastError(err.message || 'Gagal memperbarui status verifikasi.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Checklist & Verifikasi Dokumen Siswa"
        subtitle="Dokumen tersimpan pada private Supabase Storage, dapat diakses staf berwenang via signed URL aman"
      />
      <CardBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {checklist.map((item) => {
            const meta = getDocStatusMeta(item.status);
            const doc = item.existingDoc;

            return (
              <div
                key={item.docType}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div
                    style={{
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileText size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                        {item.label}
                      </strong>
                      {item.required && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--status-danger-text)' }}>
                          (Wajib)
                        </span>
                      )}
                      <Badge variant={meta.badge}>{meta.label}</Badge>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      {doc?.file_name ? (
                        <span>
                          File: <strong>{doc.file_name}</strong> ({formatFileSize(doc.file_size_bytes)})  •  Diunggah: {formatDateTime(doc.uploaded_at)}
                        </span>
                      ) : (
                        <span>Belum ada file fisik terunggah</span>
                      )}
                      {doc?.reviewer_notes && (
                        <div style={{ color: 'var(--status-warning-text)', marginTop: '2px' }}>
                          Catatan Verifikator: {doc.reviewer_notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {doc?.file_storage_path && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={ExternalLink}
                      onClick={() => handleOpenSignedUrl(doc.file_storage_path)}
                    >
                      Buka Dokumen
                    </Button>
                  )}

                  {doc && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={ShieldCheck}
                      onClick={() => {
                        setVerifyModalDoc(doc);
                        setNewStatus(doc.status);
                        setReviewerNotes(doc.reviewer_notes || '');
                      }}
                    >
                      Verifikasi
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Upload}
                    onClick={() => {
                      setUploadModalDoc(item.docType);
                      setSelectedFile(null);
                    }}
                  >
                    {doc?.file_storage_path ? 'Ganti File' : 'Unggah'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>

      {/* Upload Document Modal */}
      {uploadModalDoc && (
        <Modal
          isOpen={Boolean(uploadModalDoc)}
          onClose={() => setUploadModalDoc(null)}
          title={`Unggah Dokumen: ${DOCUMENT_TYPES.find((d) => d.value === uploadModalDoc)?.label}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setUploadModalDoc(null)} disabled={isUploading}>
                Batal
              </Button>
              <Button variant="primary" onClick={handleUploadSubmit} isLoading={isUploading} disabled={!selectedFile}>
                Unggah File
              </Button>
            </>
          }
        >
          <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Pilih file dokumen (.pdf, .jpg, .png, .webp). File akan dienkripsi dan disimpan di private storage BMU.
            </p>
            <div
              style={{
                border: '2px dashed var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-app)',
              }}
            >
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                id="doc-file-input"
                style={{ display: 'none' }}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="doc-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Upload size={32} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedFile ? selectedFile.name : 'Pilih file dari komputer'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Maksimal 10MB per file'}
                </span>
              </label>
            </div>
          </form>
        </Modal>
      )}

      {/* Verify Document Modal */}
      {verifyModalDoc && (
        <Modal
          isOpen={Boolean(verifyModalDoc)}
          onClose={() => setVerifyModalDoc(null)}
          title="Verifikasi Dokumen Siswa"
          footer={
            <>
              <Button variant="secondary" onClick={() => setVerifyModalDoc(null)} disabled={isVerifying}>
                Batal
              </Button>
              <Button variant="primary" onClick={handleVerifySubmit} isLoading={isVerifying}>
                Simpan Verifikasi
              </Button>
            </>
          }
        >
          <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Select
              label="Status Verifikasi Dokumen"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={DOCUMENT_STATUSES}
              required
            />
            <Textarea
              label="Catatan Verifikator / Alasan Revisi"
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="Tuliskan catatan pemeriksaan (misal: tulisan kurang jelas, tanggal kadaluarsa, dll.)..."
              rows={3}
            />
          </form>
        </Modal>
      )}
    </Card>
  );
}
