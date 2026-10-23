import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { journeyService } from '../../services/journeyService';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { TableSkeleton } from '../../components/feedback/LoadingSkeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  formatDate,
  getLearningStatusMeta,
  getJobSelectionMeta,
  getDepartureStatusMeta,
  getInterviewReadinessMeta,
} from '../../utils/formatters';
import {
  Route,
  BookOpen,
  UserCheck,
  Award,
  PlaneTakeoff,
  AlertCircle,
  Search,
  ExternalLink,
  Edit3,
} from 'lucide-react';

export function StudentJourneyPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { success, error: toastError } = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [overview, setOverview] = useState(null);
  const [searchParams] = useSearchParams();
  const stageFromUrl = searchParams.get('stage') || searchParams.get('filter') || 'all';
  const [selectedPipelineStage, setSelectedPipelineStage] = useState(stageFromUrl);

  useEffect(() => {
    if (stageFromUrl) {
      setSelectedPipelineStage(stageFromUrl);
    }
  }, [stageFromUrl]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, stRes] = await Promise.all([
        journeyService.getJourneyOverview(),
        studentService.getStudents({ pageSize: 500 }),
      ]);
      setOverview(ov);
      setStudents(stRes?.data || []);
    } catch (err) {
      toastError('Gagal memuat status perjalanan siswa.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stages = [
    { id: 'all', label: 'Semua Siswa Aktif', count: (students || []).length },
    { id: 'belajar', label: 'Sedang Belajar', count: overview?.learning?.sedang_belajar || 0 },
    { id: 'siap_interview', label: 'Siap Interview', count: overview?.interview?.siap || 0 },
    { id: 'lolos_seleksi', label: 'Lolos Seleksi Kerja', count: overview?.jobSelection?.lolos || 0 },
    { id: 'menunggu_kontrak', label: 'Menunggu Kontrak', count: overview?.departureReadiness?.menunggu_kontrak || 0 },
    { id: 'menunggu_coe', label: 'Menunggu COE', count: overview?.departureReadiness?.menunggu_coe || 0 },
    { id: 'siap_berangkat', label: 'Siap Berangkat', count: overview?.departure?.belum_berangkat || 0 },
    { id: 'sudah_berangkat', label: 'Sudah di Jepang', count: overview?.departure?.sudah_berangkat || 0 },
    { id: 'cuti', label: 'Izin Cuti / Nonaktif', count: (overview?.leave?.cuti || 0) + (overview?.leave?.dicutikan || 0) },
  ];

  const filteredStudents = (students || []).filter((s) => {
    const j = Array.isArray(s.student_journey) ? s.student_journey[0] : (s.student_journey || {});
    if (search) {
      const matchName = s.full_name?.toLowerCase().includes(search.toLowerCase());
      const matchId = s.student_id_number?.toLowerCase().includes(search.toLowerCase());
      if (!matchName && !matchId) return false;
    }

    if (selectedPipelineStage === 'belajar') {
      return j?.learning_status === 'sedang_belajar';
    }
    if (selectedPipelineStage === 'siap_interview') {
      return j?.interview_readiness === 'siap';
    }
    if (selectedPipelineStage === 'lolos_seleksi') {
      return j?.job_selection_status === 'lolos';
    }
    if (selectedPipelineStage === 'menunggu_kontrak') {
      return j?.departure_readiness === 'menunggu_kontrak';
    }
    if (selectedPipelineStage === 'menunggu_coe') {
      return j?.departure_readiness === 'menunggu_coe';
    }
    if (selectedPipelineStage === 'siap_berangkat') {
      return j?.departure_readiness === 'siap' && j?.departure_status !== 'sudah_berangkat';
    }
    if (selectedPipelineStage === 'sudah_berangkat') {
      return j?.departure_status === 'sudah_berangkat';
    }
    if (selectedPipelineStage === 'cuti') {
      return j?.leave_status === 'cuti' || j?.leave_status === 'dicutikan';
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Perjalanan &amp; Pipeline Siswa BMU</h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Pelacakan multi-dimensi dari tahap belajar, kesiapan wawancara, job matching, hingga penempatan di Jepang
        </p>
      </div>

      {/* Pipeline Funnel Cards */}
      <div className="grid grid-cols-4 gap-3 lg-grid-cols-2 md-grid-cols-1">
        <div
          onClick={() => setSelectedPipelineStage('belajar')}
          style={{
            padding: '16px',
            backgroundColor: selectedPipelineStage === 'belajar' ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${selectedPipelineStage === 'belajar' ? 'var(--border-emphasis)' : 'var(--border-subtle)'}`,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tahap 1: Belajar
            </span>
            <BookOpen size={16} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '6px' }}>
            {overview?.learning?.sedang_belajar || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Siswa Aktif Pelatihan</span>
        </div>

        <div
          onClick={() => setSelectedPipelineStage('siap_interview')}
          style={{
            padding: '16px',
            backgroundColor: selectedPipelineStage === 'siap_interview' ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${selectedPipelineStage === 'siap_interview' ? 'var(--border-emphasis)' : 'var(--border-subtle)'}`,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tahap 2: Wawancara
            </span>
            <UserCheck size={16} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '6px' }}>
            {overview?.interview?.siap || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Siap Ikut Interview Kerja</span>
        </div>

        <div
          onClick={() => setSelectedPipelineStage('lolos_seleksi')}
          style={{
            padding: '16px',
            backgroundColor: selectedPipelineStage === 'lolos_seleksi' ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${selectedPipelineStage === 'lolos_seleksi' ? 'var(--border-emphasis)' : 'var(--border-subtle)'}`,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tahap 3: Job Matching
            </span>
            <Award size={16} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '6px' }}>
            {overview?.jobSelection?.lolos || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lolos Seleksi Perusahaan</span>
        </div>

        <div
          onClick={() => setSelectedPipelineStage('sudah_berangkat')}
          style={{
            padding: '16px',
            backgroundColor: selectedPipelineStage === 'sudah_berangkat' ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${selectedPipelineStage === 'sudah_berangkat' ? 'var(--border-emphasis)' : 'var(--border-subtle)'}`,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tahap 4: Penempatan
            </span>
            <PlaneTakeoff size={16} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '6px' }}>
            {overview?.departure?.sudah_berangkat || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sudah Berada di Jepang</span>
        </div>
      </div>

      {/* Stage Pills Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {stages.map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => setSelectedPipelineStage(st.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              backgroundColor: selectedPipelineStage === st.id ? 'var(--accent-primary)' : 'var(--bg-surface)',
              color: selectedPipelineStage === st.id ? 'var(--accent-text)' : 'var(--text-secondary)',
              border: `1px solid ${selectedPipelineStage === st.id ? 'var(--accent-primary)' : 'var(--border-default)'}`,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{st.label}</span>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0 6px',
                borderRadius: '8px',
                backgroundColor: selectedPipelineStage === st.id ? 'var(--bg-surface)' : 'var(--bg-surface-elevated)',
                color: selectedPipelineStage === st.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
            >
              {st.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter and Students Pipeline List */}
      <Card>
        <CardHeader
          title={`Daftar Siswa Pada Tahap: ${stages.find((s) => s.id === selectedPipelineStage)?.label || 'Semua Siswa'}`}
          subtitle="Pilih siswa untuk memeriksa detail atau memperbarui status spesifik"
        >
          <div style={{ width: '260px' }}>
            <Input
              placeholder="Cari siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leadIcon={Search}
            />
          </div>
        </CardHeader>
        <CardBody>
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : filteredStudents.length === 0 ? (
            <EmptyState
              icon={Route}
              title="Tidak Ada Siswa Pada Tahap Ini"
              description="Belum ada siswa yang berada pada status atau kriteria tahap perjalanan yang dipilih."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredStudents.map((student) => {
                const j = Array.isArray(student.student_journey) ? student.student_journey[0] : (student.student_journey || {});
                const learningM = getLearningStatusMeta(j.learning_status);
                const jobM = getJobSelectionMeta(j.job_selection_status);
                const depM = getDepartureStatusMeta(j.departure_status);

                return (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          className="font-mono text-xs"
                          style={{
                            padding: '2px 6px',
                            backgroundColor: 'var(--bg-app)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          {student.student_id_number}
                        </span>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                          {student.full_name}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          • Program {student.program_type}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <Badge variant={learningM.badge}>{learningM.label}</Badge>
                        <Badge variant={jobM.badge}>{jobM.label}</Badge>
                        <Badge variant={depM.badge}>{depM.label}</Badge>
                        {j.matched_company_name && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Perusahaan: <strong>{j.matched_company_name}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={ExternalLink}
                        onClick={() => navigate(`/students/${student.id}`)}
                      >
                        Buka Profil &amp; Status
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
