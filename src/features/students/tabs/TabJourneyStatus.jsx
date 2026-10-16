import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Input, Textarea } from '../../../components/ui/Input';
import {
  LEARNING_STATUSES,
  LEAVE_STATUSES,
  INTERVIEW_READINESS,
  JOB_SELECTION_STATUSES,
  DEPARTURE_READINESS,
  DEPARTURE_STATUSES,
} from '../../../utils/constants';
import {
  getLearningStatusMeta,
  getLeaveStatusMeta,
  getInterviewReadinessMeta,
  getJobSelectionMeta,
  getDepartureReadinessMeta,
  getDepartureStatusMeta,
  formatDateTime,
  formatDate,
} from '../../../utils/formatters';
import { journeyService } from '../../../services/journeyService';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { Route, Edit3, Clock, CheckCircle2, Building, Calendar } from 'lucide-react';

export function TabJourneyStatus({ student, onUpdate }) {
  const { profile } = useAuth();
  const { success, error: toastError } = useToast();

  const journey = student?.student_journey || {};
  const statusHistory = student?.student_status_history || [];

  const [activeModalDim, setActiveModalDim] = useState(null); // 'learning_status' | 'interview_readiness' | etc.
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');
  const [companyName, setCompanyName] = useState(journey.matched_company_name || '');
  const [targetDate, setTargetDate] = useState(journey.target_departure_date || '');
  const [isLoading, setIsLoading] = useState(false);

  const openUpdateModal = (dimension, currentVal) => {
    setActiveModalDim(dimension);
    setNewValue(currentVal || '');
    setReason('');
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!activeModalDim) return;

    setIsLoading(true);
    try {
      const extraFields = {};
      if (activeModalDim === 'job_selection_status') {
        extraFields.matched_company_name = companyName;
      }
      if (activeModalDim === 'departure_readiness' || activeModalDim === 'departure_status') {
        extraFields.target_departure_date = targetDate || null;
      }

      await journeyService.updateJourneyDimension({
        studentId: student.id,
        dimension: activeModalDim,
        oldValue: journey[activeModalDim],
        newValue,
        reason,
        actorProfile: profile,
        extraFields,
      });

      success('Status perjalanan siswa berhasil diperbarui.');
      setActiveModalDim(null);
      onUpdate?.();
    } catch (err) {
      toastError(err.message || 'Gagal memperbarui status.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDimensionOptions = (dim) => {
    switch (dim) {
      case 'learning_status':
        return LEARNING_STATUSES;
      case 'leave_status':
        return LEAVE_STATUSES;
      case 'interview_readiness':
        return INTERVIEW_READINESS;
      case 'job_selection_status':
        return JOB_SELECTION_STATUSES;
      case 'departure_readiness':
        return DEPARTURE_READINESS;
      case 'departure_status':
        return DEPARTURE_STATUSES;
      default:
        return [];
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Dimension Status Cards */}
      <Card>
        <CardHeader
          title="Dimensi Status & Pipeline Siswa"
          subtitle="Model status terpisah untuk mencerminkan proses nyata tanpa saling menimpa"
        />
        <CardBody>
          <div className="grid grid-cols-2 gap-4 md-grid-cols-1">
            {/* 1. Learning Status */}
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span className="text-xs text-subtle">1. Status Pembelajaran</span>
                <div style={{ marginTop: '4px' }}>
                  <Badge variant={getLearningStatusMeta(journey.learning_status).badge}>
                    {getLearningStatusMeta(journey.learning_status).label}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Edit3}
                onClick={() => openUpdateModal('learning_status', journey.learning_status)}
              >
                Ubah
              </Button>
            </div>

            {/* 2. Leave Status */}
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span className="text-xs text-subtle">2. Status Izin / Cuti</span>
                <div style={{ marginTop: '4px' }}>
                  <Badge variant={getLeaveStatusMeta(journey.leave_status).badge}>
                    {getLeaveStatusMeta(journey.leave_status).label}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Edit3}
                onClick={() => openUpdateModal('leave_status', journey.leave_status)}
              >
                Ubah
              </Button>
            </div>

            {/* 3. Interview Readiness */}
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span className="text-xs text-subtle">3. Kesiapan Wawancara (Interview)</span>
                <div style={{ marginTop: '4px' }}>
                  <Badge variant={getInterviewReadinessMeta(journey.interview_readiness).badge}>
                    {getInterviewReadinessMeta(journey.interview_readiness).label}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Edit3}
                onClick={() => openUpdateModal('interview_readiness', journey.interview_readiness)}
              >
                Ubah
              </Button>
            </div>

            {/* 4. Job Selection Status */}
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span className="text-xs text-subtle">4. Status Seleksi Kerja (Job Matching)</span>
                <div style={{ marginTop: '4px' }}>
                  <Badge variant={getJobSelectionMeta(journey.job_selection_status).badge}>
                    {getJobSelectionMeta(journey.job_selection_status).label}
                  </Badge>
                </div>
                {journey.matched_company_name && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Perusahaan: <strong>{journey.matched_company_name}</strong>
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Edit3}
                onClick={() => openUpdateModal('job_selection_status', journey.job_selection_status)}
              >
                Ubah
              </Button>
            </div>

            {/* 5. Departure Readiness */}
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span className="text-xs text-subtle">5. Kesiapan Berangkat (COE / Visa)</span>
                <div style={{ marginTop: '4px' }}>
                  <Badge variant={getDepartureReadinessMeta(journey.departure_readiness).badge}>
                    {getDepartureReadinessMeta(journey.departure_readiness).label}
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Edit3}
                onClick={() => openUpdateModal('departure_readiness', journey.departure_readiness)}
              >
                Ubah
              </Button>
            </div>

            {/* 6. Departure Status */}
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span className="text-xs text-subtle">6. Status Keberangkatan ke Jepang</span>
                <div style={{ marginTop: '4px' }}>
                  <Badge variant={getDepartureStatusMeta(journey.departure_status).badge}>
                    {getDepartureStatusMeta(journey.departure_status).label}
                  </Badge>
                </div>
                {journey.target_departure_date && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Target: {formatDate(journey.target_departure_date)}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Edit3}
                onClick={() => openUpdateModal('departure_status', journey.departure_status)}
              >
                Ubah
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Status Change Timeline Audit History */}
      <Card>
        <CardHeader
          title="Riwayat Perubahan Status (Timeline Audit)"
          subtitle="Catatan kronologis setiap kali status siswa diubah oleh pengguna sistem"
        />
        <CardBody>
          {statusHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-tertiary)' }}>
              <Clock size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>Belum ada riwayat transisi status yang tercatat.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {statusHistory.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      padding: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-subtle)',
                      marginTop: '2px',
                    }}
                  >
                    <Clock size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        Perubahan Dimensi: <code>{item.status_dimension}</code>
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {formatDateTime(item.created_at)}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                      Dari: <span className="font-mono text-xs">{item.old_value}</span> &rarr; Menjadi:{' '}
                      <span className="font-mono text-xs" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.new_value}
                      </span>
                    </div>

                    {item.reason && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        Alasan / Catatan: {item.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Update Dimension Modal */}
      {activeModalDim && (
        <Modal
          isOpen={Boolean(activeModalDim)}
          onClose={() => setActiveModalDim(null)}
          title={`Perbarui ${activeModalDim.replace(/_/g, ' ').toUpperCase()}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setActiveModalDim(null)} disabled={isLoading}>
                Batal
              </Button>
              <Button variant="primary" onClick={handleStatusSubmit} isLoading={isLoading}>
                Simpan Status
              </Button>
            </>
          }
        >
          <form onSubmit={handleStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Select
              label="Nilai Status Baru"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              options={getDimensionOptions(activeModalDim)}
              required
            />

            {activeModalDim === 'job_selection_status' && (
              <Input
                label="Nama Perusahaan Jepang yang Menerima"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Contoh: Tokyo Shokuhin Co., Ltd."
              />
            )}

            {(activeModalDim === 'departure_readiness' || activeModalDim === 'departure_status') && (
              <Input
                label="Estimasi Tanggal Keberangkatan"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            )}

            <Textarea
              label="Alasan / Catatan Perubahan (Tercatat di Audit Log)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan alasan pembaruan status siswa..."
              rows={3}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}
