import React, { useState, useEffect, useCallback } from 'react';
import { reportService } from '../../services/reportService';
import { generateStudentReportPdf } from './pdfExport';
import { useToast } from '../../hooks/useToast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { TableSkeleton } from '../../components/feedback/LoadingSkeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  PROGRAM_TYPES,
  JOB_INTEREST_FIELDS,
  LEARNING_STATUSES,
  LEAVE_STATUSES,
  INTERVIEW_READINESS,
  JOB_SELECTION_STATUSES,
  DEPARTURE_READINESS,
  DEPARTURE_STATUSES,
  DOCUMENT_TYPES,
  KELAS_OPTIONS,
} from '../../utils/constants';
import {
  formatDate,
  calculateAge,
  getLearningStatusMeta,
  getJobSelectionMeta,
  getDepartureStatusMeta,
  getDepartureReadinessMeta,
  getStudentSswField,
  formatCertificationLabel,
} from '../../utils/formatters';
import * as XLSX from 'xlsx';
import {
  Filter,
  FileDown,
  RotateCcw,
  SlidersHorizontal,
  Table as TableIcon,
  Check,
  FileSpreadsheet,
  Search,
} from 'lucide-react';

// Initial/empty filter state — shared for init and reset
const EMPTY_FILTERS = {
  entryYear: '',
  entryMonth: '',
  gender: '',
  minAge: '',
  maxAge: '',
  minHeight: '',
  maxHeight: '',
  programType: '',
  kelas: '',
  targetJobInterest: '',
  learningStatus: '',
  leaveStatus: '',
  interviewReadiness: '',
  jobSelectionStatus: '',
  departureReadiness: '',
  departureStatus: '',
  hasJft: false,
  hasJlpt: false,
  hasSsw: false,
  hasWorkExperience: '',
  smokingStatus: '',
  hasLicense: '',
  willingOvertime: '',
  willingRelocation: '',
  verifiedDocType: '',
};

export function ReportsExplorerPage() {
  const { success, error: toastError } = useToast();

  // "Draft" filters — what the user is selecting in the UI (not yet applied)
  const [draftFilters, setDraftFilters] = useState({ ...EMPTY_FILTERS });

  // "Applied" filters — the filters actually used for the Supabase query
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_FILTERS });

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  // PDF Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState('Laporan Rekapitulasi Data Siswa');
  const [pdfOrientation, setPdfOrientation] = useState('landscape'); // 'portrait' | 'landscape'
  const [selectedColumns, setSelectedColumns] = useState([
    'student_id',
    'name',
    'gender',
    'age',
    'height',
    'kelas',
    'program',
    'job_interest',
    'learning_status',
    'selection_status',
  ]);

  const availableColumns = [
    { id: 'student_id', label: 'No. ID Siswa' },
    { id: 'name', label: 'Nama Lengkap' },
    { id: 'gender', label: 'Jenis Kelamin (L/P)' },
    { id: 'age', label: 'Usia Siswa' },
    { id: 'height', label: 'Tinggi Badan (cm)' },
    { id: 'weight', label: 'Berat Badan (kg)' },
    { id: 'kelas', label: 'Kelas' },
    { id: 'program', label: 'Program Pelatihan (SSW/Magang)' },
    { id: 'job_interest', label: 'Bidang Minat Kerja' },
    { id: 'entry_date', label: 'Tanggal Masuk BMU' },
    { id: 'certs', label: 'Sertifikasi & Kualifikasi Bahasa' },
    { id: 'learning_status', label: 'Status Pembelajaran' },
    { id: 'selection_status', label: 'Status Seleksi Kerja' },
    { id: 'departure_readiness', label: 'Kesiapan Keberangkatan' },
    { id: 'departure_status', label: 'Status Keberangkatan' },
  ];

  const handleDraftFilterChange = (field, val) => {
    setDraftFilters((prev) => ({ ...prev, [field]: val }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...draftFilters });
  };

  const handleResetFilters = () => {
    setDraftFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
  };

  // Run dynamic query against Supabase only when appliedFilters change
  const runQuery = useCallback(async () => {
    setLoading(true);
    setHasQueried(true);
    try {
      const data = await reportService.queryStudents(appliedFilters);
      setStudents(data);
    } catch (err) {
      toastError('Gagal memproses filter siswa.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, toastError]);

  useEffect(() => {
    runQuery();
  }, [runQuery]);

  // Construct readable filter summary
  const getFilterSummaryString = () => {
    const f = appliedFilters;
    const parts = [];
    if (f.programType) parts.push(`Program: ${f.programType}`);
    if (f.kelas) parts.push(`Kelas: ${f.kelas}`);
    if (f.gender) parts.push(`Gender: ${f.gender === 'L' ? 'Laki-laki' : 'Perempuan'}`);
    if (f.minAge || f.maxAge) parts.push(`Usia: ${f.minAge || 'min'} - ${f.maxAge || 'max'} thn`);
    if (f.minHeight || f.maxHeight) parts.push(`TB: ${f.minHeight || 'min'} - ${f.maxHeight || 'max'} cm`);
    if (f.targetJobInterest) parts.push(`Minat: ${f.targetJobInterest}`);
    if (f.learningStatus) parts.push(`Status Belajar: ${f.learningStatus}`);
    if (f.jobSelectionStatus) parts.push(`Seleksi: ${f.jobSelectionStatus}`);
    if (f.departureReadiness) {
      const dr = DEPARTURE_READINESS.find((d) => d.value === f.departureReadiness);
      parts.push(`Kesiapan: ${dr?.label || f.departureReadiness}`);
    }
    if (f.departureStatus) parts.push(`Keberangkatan: ${f.departureStatus}`);
    if (f.hasJft) parts.push('Memiliki JFT');
    if (f.hasJlpt) parts.push('Memiliki JLPT');
    if (f.hasSsw) parts.push('Memiliki SSW');
    if (f.smokingStatus === 'false') parts.push('Tidak Merokok');
    if (f.willingOvertime === 'true') parts.push('Bersedia Lembur');
    if (f.willingRelocation === 'true') parts.push('Bersedia Relokasi');
    if (f.verifiedDocType) parts.push(`Dokumen Terverifikasi: ${f.verifiedDocType}`);

    return parts.length > 0 ? parts.join('  •  ') : 'Semua Siswa Terdaftar (Tanpa Filter)';
  };

  const handleExportPdf = () => {
    try {
      generateStudentReportPdf({
        students,
        filterSummary: getFilterSummaryString(),
        orientation: pdfOrientation,
        selectedColumns,
        reportTitle,
      });
      success('Laporan PDF berhasil di-generate.');
      setIsExportModalOpen(false);
    } catch (err) {
      toastError('Gagal mengunduh laporan PDF: ' + err.message);
    }
  };

  const handleExportExcel = () => {
    try {
      if (students.length === 0) return;

      const excelRows = students.map((s, idx) => {
        const sswField = getStudentSswField(s);
        const certLabels = (s.certifications || []).map((c) => formatCertificationLabel(c)).join(', ');
        const dr = getDepartureReadinessMeta(s.student_journey?.departure_readiness);

        return {
          'No': idx + 1,
          'No. ID Siswa': s.student_id_number || '-',
          'Nama Lengkap': s.full_name || '-',
          'Nama Panggilan': s.nickname || '-',
          'Kelas': s.kelas ? (s.kelas === 'Pemula' ? 'Pemula' : `Kelas ${s.kelas}`) : '-',
          'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : s.gender === 'P' ? 'Perempuan' : '-',
          'Usia (Tahun)': calculateAge(s.birth_date),
          'Tanggal Lahir': formatDate(s.birth_date),
          'Tinggi (cm)': s.height_cm || '-',
          'Berat (kg)': s.weight_kg || '-',
          'Program BMU':
            s.program_type === 'SSW'
              ? 'Tokutei Ginou (SSW)'
              : s.program_type === 'TG_INTERNSHIP'
              ? 'Magang / Ikushei Shuro'
              : s.program_type || '-',
          'Bidang Minat Kerja': s.target_job_interest || '-',
          'Sertifikasi & Kualifikasi Bahasa': sswField || certLabels || '-',
          'Status Belajar': getLearningStatusMeta(s.student_journey?.learning_status).label,
          'Kesiapan Wawancara': s.student_journey?.interview_readiness === 'siap' ? 'Siap Wawancara' : 'Belum Siap',
          'Status Seleksi': getJobSelectionMeta(s.student_journey?.job_selection_status).label,
          'Kesiapan Keberangkatan': dr.label,
          'Status Keberangkatan': getDepartureStatusMeta(s.student_journey?.departure_status).label,
          'Tanggal Masuk': formatDate(s.entry_date),
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa BMU');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Laporan_Data_Siswa_BMU_${dateStr}.xlsx`);
      success(`Laporan Excel (${students.length} siswa) berhasil diunduh.`);
    } catch (err) {
      toastError('Gagal mengunduh Excel: ' + err.message);
    }
  };

  const toggleColumn = (colId) => {
    setSelectedColumns((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId]
    );
  };

  const tableColumns = [
    {
      header: 'ID SISWA',
      accessor: 'student_id_number',
      render: (row) => (
        <span
          className="font-mono text-xs"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {row.student_id_number}
        </span>
      ),
    },
    {
      header: 'NAMA LENGKAP',
      accessor: 'full_name',
      render: (row) => (
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>{row.full_name}</strong>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {row.gender === 'L' ? 'Laki-laki' : 'Perempuan'} • Program {row.program_type === 'SSW' ? 'Tokutei Ginou (SSW)' : row.program_type === 'TG_INTERNSHIP' ? 'Magang / Ikushei Shuro' : row.program_type || '-'}
          </div>
        </div>
      ),
    },
    {
      header: 'KELAS',
      accessor: 'kelas',
      render: (row) => (
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: row.kelas ? 'var(--bg-surface-elevated)' : 'transparent',
            border: row.kelas ? '1px solid var(--border-subtle)' : 'none',
            color: row.kelas ? 'var(--text-primary)' : 'var(--text-tertiary)',
            whiteSpace: 'nowrap',
          }}
        >
          {row.kelas ? (row.kelas === 'Pemula' ? 'Pemula' : `Kelas ${row.kelas}`) : '-'}
        </span>
      ),
    },
    {
      header: 'USIA & TB',
      accessor: 'age_tb',
      render: (row) => (
        <div style={{ fontSize: '0.8125rem' }}>
          <div>{calculateAge(row.birth_date)}</div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
            {row.height_cm ? `${row.height_cm} cm` : '-'}
          </div>
        </div>
      ),
    },
    {
      header: 'BIDANG MINAT',
      accessor: 'target_job_interest',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {row.target_job_interest || '-'}
        </span>
      ),
    },
    {
      header: 'SERTIFIKASI & BAHASA',
      accessor: 'certs',
      render: (row) => {
        const certs = row.certifications || [];
        if (certs.length === 0) {
          return <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>-</span>;
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '240px' }}>
            {certs.map((c, i) => {
              const label = formatCertificationLabel(c);
              const isSsw = c.cert_type === 'SSW';
              return (
                <span
                  key={i}
                  style={{
                    fontSize: '0.6875rem',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSsw ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface-elevated)',
                    color: isSsw ? '#60a5fa' : 'var(--text-secondary)',
                    border: `1px solid ${isSsw ? 'rgba(59, 130, 246, 0.35)' : 'var(--border-subtle)'}`,
                    fontWeight: isSsw ? 600 : 400,
                  }}
                  title={c.cert_level ? `Level/Bidang: ${c.cert_level}` : c.cert_type}
                >
                  {label}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      header: 'STATUS BELAJAR',
      accessor: 'learning_status',
      render: (row) => {
        const meta = getLearningStatusMeta(row.student_journey?.learning_status);
        return <Badge variant={meta.badge}>{meta.label}</Badge>;
      },
    },
    {
      header: 'KESIAPAN BERANGKAT',
      accessor: 'departure_readiness',
      render: (row) => {
        const meta = getDepartureReadinessMeta(row.student_journey?.departure_readiness);
        return <Badge variant={meta.badge}>{meta.label}</Badge>;
      },
    },
    {
      header: 'KEBERANGKATAN',
      accessor: 'departure_status',
      render: (row) => {
        const meta = getDepartureStatusMeta(row.student_journey?.departure_status);
        return <Badge variant={meta.badge}>{meta.label}</Badge>;
      },
    },
  ];

  // Check if draft filters differ from applied (to show "perlu terapkan" hint)
  const hasPendingChanges = JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Student Data Explorer &amp; Laporan</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Eksplorasi gabungan kriteria dinamis dan cetak laporan resmi A4 PDF atau spreadsheet Excel
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            icon={RotateCcw}
            onClick={handleResetFilters}
          >
            Reset Filter
          </Button>

          <Button
            variant="secondary"
            icon={FileSpreadsheet}
            disabled={students.length === 0}
            onClick={handleExportExcel}
            title="Unduh seluruh data hasil pencarian dalam file spreadsheet Excel (.xlsx)"
          >
            Ekspor Excel ({students.length})
          </Button>

          <Button
            variant="primary"
            icon={FileDown}
            disabled={students.length === 0}
            onClick={() => setIsExportModalOpen(true)}
          >
            Ekspor Laporan PDF ({students.length})
          </Button>
        </div>
      </div>

      {/* Dynamic Multi-filter Explorer Box */}
      <Card>
        <CardHeader
          title="Filter Pencarian Gabungan (Multi-Criteria AND)"
          subtitle="Atur filter lalu klik Terapkan Filter untuk memperbarui hasil"
        >
          <SlidersHorizontal size={18} style={{ color: 'var(--text-tertiary)' }} />
        </CardHeader>
        <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Row 1: Program, Kelas, Gender, Minat, Dokumen */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            <Select
              label="Program BMU"
              value={draftFilters.programType}
              onChange={(e) => handleDraftFilterChange('programType', e.target.value)}
              options={[{ value: '', label: 'Semua Program' }, ...PROGRAM_TYPES]}
              placeholder=""
            />
            <Select
              label="Kelas"
              value={draftFilters.kelas}
              onChange={(e) => handleDraftFilterChange('kelas', e.target.value)}
              options={[
                { value: '', label: 'Semua Kelas' },
                ...KELAS_OPTIONS,
              ]}
              placeholder=""
            />
            <Select
              label="Jenis Kelamin"
              value={draftFilters.gender}
              onChange={(e) => handleDraftFilterChange('gender', e.target.value)}
              options={[
                { value: '', label: 'Semua Gender' },
                { value: 'L', label: 'Laki-laki (L)' },
                { value: 'P', label: 'Perempuan (P)' },
              ]}
              placeholder=""
            />
            <Select
              label="Bidang Minat Kerja"
              value={draftFilters.targetJobInterest}
              onChange={(e) => handleDraftFilterChange('targetJobInterest', e.target.value)}
              options={[{ value: '', label: 'Semua Bidang' }, ...JOB_INTEREST_FIELDS]}
              placeholder=""
            />
            <Select
              label="Dokumen Terverifikasi"
              value={draftFilters.verifiedDocType}
              onChange={(e) => handleDraftFilterChange('verifiedDocType', e.target.value)}
              options={[{ value: '', label: 'Semua Dokumen' }, ...DOCUMENT_TYPES]}
              placeholder=""
            />
          </div>

          {/* Row 2: Status Belajar, Interview, Seleksi, Keberangkatan */}
          <div className="grid grid-cols-4 gap-3 md-grid-cols-1">
            <Select
              label="Status Belajar"
              value={draftFilters.learningStatus}
              onChange={(e) => handleDraftFilterChange('learningStatus', e.target.value)}
              options={[{ value: '', label: 'Semua Status Belajar' }, ...LEARNING_STATUSES]}
              placeholder=""
            />
            <Select
              label="Kesiapan Wawancara"
              value={draftFilters.interviewReadiness}
              onChange={(e) => handleDraftFilterChange('interviewReadiness', e.target.value)}
              options={[{ value: '', label: 'Semua Kesiapan' }, ...INTERVIEW_READINESS]}
              placeholder=""
            />
            <Select
              label="Status Seleksi Kerja"
              value={draftFilters.jobSelectionStatus}
              onChange={(e) => handleDraftFilterChange('jobSelectionStatus', e.target.value)}
              options={[{ value: '', label: 'Semua Status Seleksi' }, ...JOB_SELECTION_STATUSES]}
              placeholder=""
            />
            <Select
              label="Status Keberangkatan"
              value={draftFilters.departureStatus}
              onChange={(e) => handleDraftFilterChange('departureStatus', e.target.value)}
              options={[{ value: '', label: 'Semua Keberangkatan' }, ...DEPARTURE_STATUSES]}
              placeholder=""
            />
          </div>

          {/* Row 3: Kesiapan Keberangkatan (includes menunggu_kontrak & menunggu_coe) */}
          <div className="grid grid-cols-4 gap-3 md-grid-cols-1">
            <Select
              label="Kesiapan Keberangkatan"
              value={draftFilters.departureReadiness}
              onChange={(e) => handleDraftFilterChange('departureReadiness', e.target.value)}
              options={[{ value: '', label: 'Semua Kesiapan Berangkat' }, ...DEPARTURE_READINESS]}
              placeholder=""
            />
            <Select
              label="Status Cuti"
              value={draftFilters.leaveStatus}
              onChange={(e) => handleDraftFilterChange('leaveStatus', e.target.value)}
              options={[{ value: '', label: 'Semua Status Cuti' }, ...LEAVE_STATUSES]}
              placeholder=""
            />
            <Select
              label="Kepemilikan SIM"
              value={draftFilters.hasLicense}
              onChange={(e) => handleDraftFilterChange('hasLicense', e.target.value)}
              options={[
                { value: '', label: 'Semua (Ada/Tidak)' },
                { value: 'true', label: 'Memiliki SIM (C/A/B1)' },
                { value: 'false', label: 'Tidak Memiliki SIM' },
              ]}
              placeholder=""
            />
            <Select
              label="Status Merokok"
              value={draftFilters.smokingStatus}
              onChange={(e) => handleDraftFilterChange('smokingStatus', e.target.value)}
              options={[
                { value: '', label: 'Semua (Merokok/Bebas)' },
                { value: 'false', label: 'Tidak Merokok (Non-Smoking)' },
                { value: 'true', label: 'Merokok' },
              ]}
              placeholder=""
            />
          </div>

          {/* Row 4: Rentang Usia & Tinggi Badan */}
          <div className="grid grid-cols-2 gap-3 md-grid-cols-1">
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                label="Usia Min (thn)"
                type="number"
                value={draftFilters.minAge}
                onChange={(e) => handleDraftFilterChange('minAge', e.target.value)}
                placeholder="18"
              />
              <Input
                label="Usia Max (thn)"
                type="number"
                value={draftFilters.maxAge}
                onChange={(e) => handleDraftFilterChange('maxAge', e.target.value)}
                placeholder="30"
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                label="Tinggi Min (cm)"
                type="number"
                value={draftFilters.minHeight}
                onChange={(e) => handleDraftFilterChange('minHeight', e.target.value)}
                placeholder="160"
              />
              <Input
                label="Tinggi Max (cm)"
                type="number"
                value={draftFilters.maxHeight}
                onChange={(e) => handleDraftFilterChange('maxHeight', e.target.value)}
                placeholder="180"
              />
            </div>
          </div>

          {/* Row 5: Checkboxes Sertifikasi & Preferensi */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '20px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Kriteria Sertifikat:
            </span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={draftFilters.hasJft}
                onChange={(e) => handleDraftFilterChange('hasJft', e.target.checked)}
              />
              <span>Harus punya JFT-Basic A2</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={draftFilters.hasJlpt}
                onChange={(e) => handleDraftFilterChange('hasJlpt', e.target.checked)}
              />
              <span>Harus punya JLPT (N5-N1)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={draftFilters.hasSsw}
                onChange={(e) => handleDraftFilterChange('hasSsw', e.target.checked)}
              />
              <span>Harus punya Sertifikat SSW</span>
            </label>

            <span style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-default)', margin: '0 4px' }} />

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={draftFilters.willingOvertime === 'true'}
                onChange={(e) => handleDraftFilterChange('willingOvertime', e.target.checked ? 'true' : '')}
              />
              <span>Bersedia Lembur</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={draftFilters.willingRelocation === 'true'}
                onChange={(e) => handleDraftFilterChange('willingRelocation', e.target.checked ? 'true' : '')}
              />
              <span>Bersedia Relokasi</span>
            </label>
          </div>

          {/* Apply Filter Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <Button
              variant="primary"
              icon={Search}
              onClick={handleApplyFilters}
            >
              Terapkan Filter
            </Button>
            {hasPendingChanges && (
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#f59e0b',
                  fontStyle: 'italic',
                }}
              >
                Ada perubahan filter yang belum diterapkan — klik Terapkan Filter untuk memperbarui hasil.
              </span>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Filter Summary & Preview Table */}
      <Card>
        <CardHeader
          title={`Hasil Penelusuran Aktual (${students.length} Siswa Terpilih)`}
          subtitle={`Ringkasan Kriteria: ${getFilterSummaryString()}`}
        />
        <CardBody>
          {loading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : students.length === 0 ? (
            <EmptyState
              icon={Filter}
              title="Tidak Ada Siswa yang Cocok"
              description="Tidak ditemukan siswa yang memenuhi semua kombinasi filter yang dipilih secara bersamaan."
              actionLabel="Reset Semua Filter"
              onAction={handleResetFilters}
            />
          ) : (
            <Table columns={tableColumns} data={students} />
          )}
        </CardBody>
      </Card>

      {/* PDF Export Configuration Modal */}
      {isExportModalOpen && (
        <Modal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          title="Konfigurasi Ekspor Laporan PDF"
          maxWidth="max-w-xl"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsExportModalOpen(false)}>
                Batal
              </Button>
              <Button variant="primary" icon={FileDown} onClick={handleExportPdf}>
                Unduh PDF ({pdfOrientation.toUpperCase()})
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Judul Header Dokumen Laporan"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Contoh: LAPORAN KANDIDAT SIAP INTERVIEW BIDANG KAIGO"
              required
            />

            <div>
              <label className="form-label">Format Orientasi Kertas A4</label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setPdfOrientation('landscape')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${pdfOrientation === 'landscape' ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                    backgroundColor: pdfOrientation === 'landscape' ? 'var(--bg-surface-elevated)' : 'var(--bg-app)',
                    color: pdfOrientation === 'landscape' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  Landscape (Horizontal) — Disarankan untuk banyak kolom
                </button>
                <button
                  type="button"
                  onClick={() => setPdfOrientation('portrait')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${pdfOrientation === 'portrait' ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                    backgroundColor: pdfOrientation === 'portrait' ? 'var(--bg-surface-elevated)' : 'var(--bg-app)',
                    color: pdfOrientation === 'portrait' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                >
                  Portrait (Vertikal)
                </button>
              </div>
            </div>

            <div>
              <label className="form-label">Pilih Kolom yang Ditampilkan dalam Tabel PDF</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  marginTop: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  padding: '8px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {availableColumns.map((col) => {
                  const isChecked = selectedColumns.includes(col.id);
                  return (
                    <label
                      key={col.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleColumn(col.id)}
                      />
                      <span>{col.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
              }}
            >
              <strong>Privasi Data:</strong> Sesuai ketentuan, foto profil siswa, NIK, dan nomor rekening tidak disertakan dalam laporan rekapitulasi PDF.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
