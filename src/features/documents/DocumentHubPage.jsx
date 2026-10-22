import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../../services/documentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/feedback/EmptyState';
import { DOCUMENT_TYPES, DOCUMENT_STATUSES } from '../../utils/constants';
import { getDocStatusMeta, formatDateTime, formatFileSize } from '../../utils/formatters';
import {
  FileCheck2,
  Search,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';

// ─── Small summary badge per status count ─────────────────────────────────────
function DocSummaryPill({ count, variant, label }) {
  if (count === 0) return null;
  const colors = {
    success: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.25)' },
    warning: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
    danger:  { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', border: 'rgba(239,68,68,0.25)' },
    neutral: { bg: 'var(--bg-surface-elevated)', color: 'var(--text-tertiary)', border: 'var(--border-subtle)' },
  };
  const c = colors[variant] || colors.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '20px', fontSize: '0.6875rem', fontWeight: 600,
      backgroundColor: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {count} {label}
    </span>
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ verified, total }) {
  const pct = total === 0 ? 0 : Math.round((verified / total) * 100);
  const color = pct === 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
      <div style={{
        flex: 1, height: '6px', borderRadius: '3px',
        backgroundColor: 'var(--bg-surface-elevated)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: '3px',
          backgroundColor: color, transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
        {verified}/{total}
      </span>
    </div>
  );
}

// ─── Single document row inside a student card ────────────────────────────────
function DocRow({ doc, onVerify, onView }) {
  const docLabel = DOCUMENT_TYPES.find((d) => d.value === doc.doc_type)?.label || doc.doc_type;
  const meta = getDocStatusMeta(doc.status);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 140px 1fr 1fr auto',
      gap: '12px',
      alignItems: 'center',
      padding: '10px 16px',
      borderTop: '1px solid var(--border-subtle)',
      transition: 'background-color var(--transition-fast)',
    }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      {/* Jenis Dokumen */}
      <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
        {docLabel}
      </span>

      {/* Status Badge */}
      <Badge variant={meta.badge}>{meta.label}</Badge>

      {/* Info File */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        {doc.file_name ? (
          <>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{doc.file_name}</div>
            <div style={{ color: 'var(--text-tertiary)' }}>
              {formatFileSize(doc.file_size_bytes)} · {formatDateTime(doc.uploaded_at)}
            </div>
          </>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>Belum ada file</span>
        )}
      </div>

      {/* Catatan */}
      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        {doc.reviewer_notes || '—'}
      </span>

      {/* Aksi */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        {doc.file_storage_path && (
          <Button variant="ghost" size="sm" icon={ExternalLink} onClick={() => onView(doc.file_storage_path)}>
            Lihat
          </Button>
        )}
        <Button variant="secondary" size="sm" icon={ShieldCheck} onClick={() => onVerify(doc)}>
          Verifikasi
        </Button>
      </div>
    </div>
  );
}

// ─── Student card (collapsible) ───────────────────────────────────────────────
function StudentDocCard({ studentId, studentName, studentIdNumber, programType, docs, onVerify, onView }) {
  const [open, setOpen] = useState(false);

  const verified  = docs.filter(d => d.status === 'verified').length;
  const pending   = docs.filter(d => d.status === 'uploaded').length;
  const rejected  = docs.filter(d => d.status === 'rejected').length;
  const missing   = docs.filter(d => d.status === 'missing').length;
  const total     = docs.length;

  return (
    <Card style={{ overflow: 'hidden' }}>
      {/* ── Header row (clickable) ── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          cursor: 'pointer', padding: '14px 18px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto auto',
          gap: '14px', alignItems: 'center',
        }}
      >
        {/* Chevron */}
        <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>

        {/* Student Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
            backgroundColor: 'var(--accent-primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#fff',
            fontSize: '0.875rem', fontWeight: 700,
          }}>
            {studentName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {studentName}
              </span>
              <span style={{
                fontFamily: 'monospace', fontSize: '0.6875rem',
                backgroundColor: 'var(--bg-surface-elevated)',
                padding: '1px 7px', borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}>
                {studentIdNumber}
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                {programType}
              </span>
            </div>
            {/* Status summary pills */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
              <DocSummaryPill count={verified} variant="success" label="Terverifikasi" />
              <DocSummaryPill count={pending}  variant="warning" label="Menunggu" />
              <DocSummaryPill count={rejected} variant="danger"  label="Ditolak" />
              <DocSummaryPill count={missing}  variant="neutral" label="Belum Ada" />
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <ProgressBar verified={verified} total={total} />

        {/* Total docs count */}
        <span style={{
          fontSize: '0.75rem', color: 'var(--text-tertiary)',
          whiteSpace: 'nowrap', paddingRight: '4px',
        }}>
          {total} dokumen
        </span>
      </button>

      {/* ── Expanded document list ── */}
      {open && (
        <>
          {/* Sub-header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 140px 1fr 1fr auto',
            gap: '12px', padding: '6px 16px',
            backgroundColor: 'var(--bg-surface-elevated)',
            borderTop: '1px solid var(--border-default)',
            fontSize: '0.6875rem', fontWeight: 700,
            color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span>Jenis Dokumen</span>
            <span>Status</span>
            <span>File</span>
            <span>Catatan Verifikator</span>
            <span style={{ textAlign: 'right' }}>Aksi</span>
          </div>

          {docs.map(doc => (
            <DocRow
              key={doc.id}
              doc={doc}
              onVerify={onVerify}
              onView={onView}
            />
          ))}
        </>
      )}
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
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

  // Group documents by student_id
  const groupedByStudent = useMemo(() => {
    const map = new Map();
    documents.forEach(doc => {
      const sid = doc.students?.id || doc.student_id || 'unknown';
      if (!map.has(sid)) {
        map.set(sid, {
          studentId: sid,
          studentName: doc.students?.full_name || '-',
          studentIdNumber: doc.students?.student_id_number || '-',
          programType: doc.students?.program_type || '-',
          docs: [],
        });
      }
      map.get(sid).docs.push(doc);
    });
    // Sort each student's docs by DOCUMENT_TYPES order
    const typeOrder = DOCUMENT_TYPES.map(t => t.value);
    map.forEach(group => {
      group.docs.sort((a, b) => {
        const ai = typeOrder.indexOf(a.doc_type);
        const bi = typeOrder.indexOf(b.doc_type);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
    });
    return Array.from(map.values());
  }, [documents]);

  // Global stats
  const totalVerified = documents.filter(d => d.status === 'verified').length;
  const totalPending  = documents.filter(d => d.status === 'uploaded').length;
  const totalRejected = documents.filter(d => d.status === 'rejected').length;

  const handleOpenSignedUrl = async (storagePath) => {
    if (!storagePath) return;
    try {
      const url = await documentService.getSignedUrl(storagePath, 300);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else toastError('Gagal membuat tautan signed URL dokumen privat.');
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
      success(`Status dokumen berhasil diperbarui.`);
      setVerifyingDoc(null);
      fetchDocuments();
    } catch (err) {
      toastError(err.message || 'Gagal menyimpan status verifikasi.');
    } finally {
      setIsVerifying(false);
    }
  };

  const openVerifyModal = (doc) => {
    setVerifyingDoc(doc);
    setNewStatus(doc.status);
    setReviewerNotes(doc.reviewer_notes || '');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Pusat Verifikasi Dokumen Siswa</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Kelengkapan dokumen dikelompokkan per siswa — KTP, KK, Ijazah, Paspor, SKCK, dan sertifikat
          </p>
        </div>

        {/* Global stat pills */}
        {!loading && documents.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <DocSummaryPill count={totalVerified} variant="success" label="Terverifikasi" />
            <DocSummaryPill count={totalPending}  variant="warning" label="Menunggu Review" />
            <DocSummaryPill count={totalRejected} variant="danger"  label="Ditolak" />
          </div>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <Card>
        <CardBody style={{ padding: '14px 16px' }}>
          <div className="grid grid-cols-3 gap-3 md-grid-cols-1">
            <Input
              placeholder="Cari nama siswa atau nomor ID..."
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {groupedByStudent.length} siswa · {documents.length} dokumen ditemukan
              </span>
              <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => { setSearch(''); setFilterDocType(''); setFilterStatus(''); }}>
                Reset Filter
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Content ── */}
      {loading ? (
        // Skeleton
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardBody style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: 'var(--bg-surface-elevated)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, width: '40%', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 10, width: '25%', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 4 }} />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : groupedByStudent.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={FileCheck2}
              title="Tidak Ada Dokumen"
              description="Belum ada catatan dokumen yang sesuai dengan filter saat ini."
            />
          </CardBody>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {groupedByStudent.map(group => (
            <StudentDocCard
              key={group.studentId}
              studentId={group.studentId}
              studentName={group.studentName}
              studentIdNumber={group.studentIdNumber}
              programType={group.programType}
              docs={group.docs}
              onVerify={openVerifyModal}
              onView={handleOpenSignedUrl}
            />
          ))}
        </div>
      )}

      {/* ── Verify Modal ── */}
      {verifyingDoc && (
        <Modal
          isOpen={Boolean(verifyingDoc)}
          onClose={() => setVerifyingDoc(null)}
          title="Verifikasi Dokumen"
          maxWidth="max-w-lg"
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
          {/* Dokumen info */}
          <div style={{
            padding: '12px 14px', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '16px',
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {verifyingDoc.students?.full_name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {DOCUMENT_TYPES.find(d => d.value === verifyingDoc.doc_type)?.label || verifyingDoc.doc_type}
            </div>
          </div>

          <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Select
              label="Nilai Status Baru *"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={DOCUMENT_STATUSES}
              required
            />
            <Textarea
              label="Alasan / Catatan Perubahan (Tercatat di Audit Log)"
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="Jelaskan alasan pembaruan status siswa..."
              rows={3}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
