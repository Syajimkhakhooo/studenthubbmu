import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../../services/documentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { TableSkeleton } from '../../components/feedback/LoadingSkeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { DOCUMENT_TYPES, DOCUMENT_STATUSES } from '../../utils/constants';
import { getDocStatusMeta, formatDateTime, formatFileSize } from '../../utils/formatters';
import {
  FileCheck2,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export function DocumentHubPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { success, error: toastError } = useToast();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterDocType, setFilterDocType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Verification modal
  const [verifyingDoc, setVerifyingDoc] = useState(null);
  const [newStatus, setNewStatus] = useState('verified');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await documentService.getAllDocuments({
        status: filterStatus,
        docType: filterDocType,
        search,
      });
      setDocuments(data);
    } catch (err) {
      toastError('Gagal memuat dokumen siswa.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterDocType, search, toastError]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleOpenSignedUrl = async (storagePath) => {
    if (!storagePath) return;
    try {
      const url = await documentService.getSignedUrl(storagePath, 300);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toastError('Gagal membuat tautan signed URL dokumen privat.');
      }
    } catch {
      toastError('Gagal membuka file dokumen.');
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyingDoc) return;

    setIsVerifying(true);
    try {
      await documentService.updateVerificationStatus({
        docId: verifyingDoc.id,
        status: newStatus,
        reviewerNotes,
        actorProfile: profile,
      });

      success(`Status dokumen berhasil diperbarui ke: ${newStatus}`);
      setVerifyingDoc(null);
      fetchDocuments();
    } catch (err) {
      toastError(err.message || 'Gagal menyimpan status verifikasi.');
    } finally {
      setIsVerifying(false);
    }
  };

  const columns = [
    {
      header: 'ID & SISWA',
      accessor: 'student_info',
      render: (row) => (
        <div>
          <span
            className="font-mono text-xs"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {row.students?.student_id_number || '-'}
          </span>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
            {row.students?.full_name || '-'}
          </div>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
            Program {row.students?.program_type || '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'JENIS DOKUMEN',
      accessor: 'doc_type',
      render: (row) => {
        const docLabel = DOCUMENT_TYPES.find((d) => d.value === row.doc_type)?.label || row.doc_type;
        return <strong style={{ color: 'var(--text-primary)', fontSize: '0.8125rem' }}>{docLabel}</strong>;
      },
    },
    {
      header: 'STATUS DOKUMEN',
      accessor: 'status',
      render: (row) => {
        const meta = getDocStatusMeta(row.status);
        return <Badge variant={meta.badge}>{meta.label}</Badge>;
      },
    },
    {
      header: 'INFORMASI FILE',
      accessor: 'file_info',
      render: (row) => (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {row.file_name ? (
            <>
              <div>{row.file_name}</div>
              <div style={{ color: 'var(--text-tertiary)' }}>
                {formatFileSize(row.file_size_bytes)}  •  {formatDateTime(row.uploaded_at)}
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-tertiary)' }}>Belum ada file fisik</span>
          )}
        </div>
      ),
    },
    {
      header: 'CATATAN VERIFIKATOR',
      accessor: 'reviewer_notes',
      render: (row) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          {row.reviewer_notes || '-'}
        </span>
      ),
    },
    {
      header: 'AKSI',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          {row.file_storage_path && (
            <Button
              variant="outline"
              size="sm"
              icon={ExternalLink}
              onClick={() => handleOpenSignedUrl(row.file_storage_path)}
            >
              Lihat
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={ShieldCheck}
            onClick={() => {
              setVerifyingDoc(row);
              setNewStatus(row.status);
              setReviewerNotes(row.reviewer_notes || '');
            }}
          >
            Verifikasi
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Pusat Verifikasi Dokumen Siswa</h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Pemeriksaan kelengkapan dokumen KTP, KK, Ijazah, Paspor, SKCK, dan sertifikat siswa BMU
        </p>
      </div>

      {/* Filter Card */}
      <Card>
        <CardBody style={{ padding: '16px' }}>
          <div className="grid grid-cols-3 gap-3 md-grid-cols-1">
            <Input
              placeholder="Cari siswa atau nomor ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leadIcon={Search}
            />

            <Select
              value={filterDocType}
              onChange={(e) => setFilterDocType(e.target.value)}
              options={[{ value: '', label: 'Semua Jenis Dokumen' }, ...DOCUMENT_TYPES]}
              placeholder=""
            />

            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[{ value: '', label: 'Semua Status Verifikasi' }, ...DOCUMENT_STATUSES]}
              placeholder=""
            />
          </div>

          {(search || filterDocType || filterStatus) && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <Button
                variant="ghost"
                size="sm"
                icon={RotateCcw}
                onClick={() => {
                  setSearch('');
                  setFilterDocType('');
                  setFilterStatus('');
                }}
              >
                Reset Filter
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Documents Table */}
      {loading ? (
        <Card>
          <CardBody>
            <TableSkeleton rows={6} cols={6} />
          </CardBody>
        </Card>
      ) : documents.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={FileCheck2}
              title="Tidak Ada Dokumen"
              description="Belum ada catatan dokumen yang sesuai dengan kriteria filter saat ini."
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table columns={columns} data={documents} />
        </Card>
      )}

      {/* Verify Modal */}
      {verifyingDoc && (
        <Modal
          isOpen={Boolean(verifyingDoc)}
          onClose={() => setVerifyingDoc(null)}
          title={`Verifikasi Dokumen: ${verifyingDoc.students?.full_name}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setVerifyingDoc(null)} disabled={isVerifying}>
                Batal
              </Button>
              <Button variant="primary" onClick={handleVerifySubmit} isLoading={isVerifying}>
                Simpan Status
              </Button>
            </>
          }
        >
          <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Select
              label="Status Verifikasi"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={DOCUMENT_STATUSES}
              required
            />

            <Textarea
              label="Catatan Verifikator"
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="Tuliskan catatan pemeriksaan berkas..."
              rows={3}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
