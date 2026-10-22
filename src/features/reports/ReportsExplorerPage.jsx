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
} from 'lucide-react';

export function ReportsExplorerPage() {
  const { success, error: toastError } = useToast();

  // Filters State
  const [filters, setFilters] = useState({
    entryYear: '',
    entryMonth: '',
    gender: '',
    minAge: '',
    maxAge: '',
    minHeight: '',
    maxHeight: '',
    programType: '',
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
  });

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

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
    { id: 'program', label: 'Program Pelatihan (SSW/Magang)' },
    { id: 'ssw_field', label: 'Bidang Spesifik SSW (dari Sertifikat)' },
    { id: 'job_interest', label: 'Bidang Minat Kerja' },
    { id: 'entry_date', label: 'Tanggal Masuk BMU' },
    { id: 'learning_status', label: 'Status Pembelajaran' },
    { id: 'selection_status', label: 'Status Seleksi Kerja' },
    { id: 'departure_status', label: 'Status Keberangkatan' },
    { id: 'certs', label: 'Daftar Sertifikat & Bahasa' },
  ];

  const handleFilterChange = (field, val) => {
    setFilters((prev) => ({ ...prev, [field]: val }));
  };

  const handleResetFilters = () => {
    setFilters({
      entryYear: '',
      entryMonth: '',
      gender: '',
      minAge: '',
      maxAge: '',
      minHeight: '',
      maxHeight: '',
      programType: '',
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
    });
  };

  // Run dynamic query against Supabase
  const runQuery = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportService.queryStudents(filters);
      setStudents(data);
    } catch (err) {
      toastError('Gagal memproses filter siswa.');
    } finally {
      setLoading(false);
    }
  }, [filters, toastError]);

  useEffect(() => {
    runQuery();
  }, [runQuery]);

  // Construct readable filter summary
  const getFilterSummaryString = () => {
    const parts = [];
    if (filters.programType) parts.push(`Program: ${filters.programType}`);
    if (filters.gender) parts.push(`Gender: ${filters.gender === 'L' ? 'Laki-laki' : 'Perempuan'}`);
    if (filters.minAge || filters.maxAge) parts.push(`Usia: ${filters.minAge || 'min'} - ${filters.maxAge || 'max'} thn`);
    if (filters.minHeight || filters.maxHeight) parts.push(`TB: ${filters.minHeight || 'min'} - ${filters.maxHeight || 'max'} cm`);
    if (filters.targetJobInterest) parts.push(`Minat: ${filters.targetJobInterest}`);
    if (filters.learningStatus) parts.push(`Status Belajar: ${filters.learningStatus}`);
    if (filters.jobSelectionStatus) parts.push(`Seleksi: ${filters.jobSelectionStatus}`);
    if (filters.hasJft) parts.push('Memiliki JFT');
    if (filters.hasJlpt) parts.push('Memiliki JLPT');
    if (filters.hasSsw) parts.push('Memiliki SSW');
    if (filters.smokingStatus === 'false') parts.push('Tidak Merokok');
    if (filters.willingOvertime === 'true') parts.push('Bersedia Lembur');
    if (filters.willingRelocation === 'true') parts.push('Bersedia Relokasi');
    if (filters.verifiedDocType) parts.push(`Dokumen Terverifikasi: ${filters.verifiedDocType}`);

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

        return {
          'No': idx + 1,
          'No. ID Siswa': s.student_id_number || '-',
          'Nama Lengkap': s.full_name || '-',
          'Nama Panggilan': s.nickname || '-',
          'Jenis Kelamin': s.gender === 'L' ? 'Laki-laki' : s.gender === 'P' ? 'Perempuan' : '-',
          'Usia (Tahun)': calculateAge(s.birth_date),
          'Tanggal Lahir': formatDate(s.birth_date),
          'Tinggi (cm)': s.height_cm || '-',
          'Berat (kg)': s.weight_kg || '-',
          'Program BMU':
            s.program_type === 'SSW'
              ? sswField
                ? `Tokutei Ginou - SSW (${sswField})`
                : 'Tokutei Ginou (SSW)'
              : s.program_type === 'TG_INTERNSHIP'
              ? 'Magang / Ikushei Shuro'
              : s.program_type || '-',
          'Bidang Spesifik SSW': sswField || '-',
          'Bidang Minat Kerja': s.target_job_interest || '-',
          'Sertifikasi & Bahasa': certLabels || '-',
          'Status Belajar': getLearningStatusMeta(s.student_journey?.learning_status).label,
          'Kesiapan Wawancara': s.student_journey?.interview_readiness === 'siap' ? 'Siap Wawancara' : 'Belum Siap',
          'Status Seleksi': getJobSelectionMeta(s.student_journey?.job_selection_status).label,
          'Kesiapan Berangkat': getDepartureReadinessMeta(s.student_journey?.departure_readiness).label,
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
      render: (row) => {
        const sswField = getStudentSswField(row);
        return (
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>{row.full_name}</strong>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {row.gender === 'L' ? 'Laki-laki' : 'Perempuan'} •{' '}
              {row.program_type === 'SSW'
                ? sswField
                  ? `SSW (${sswField})`
                  : 'Tokutei Ginou (SSW)'
                : row.program_type === 'TG_INTERNSHIP'
                ? 'Magang'
                : row.program_type || '-'}
            </div>
          </div>
        );
      },
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
      header: 'STATUS SELEKSI',
      accessor: 'job_selection_status',
      render: (row) => {
        const meta = getJobSelectionMeta(row.student_journey?.job_selection_status);
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
          subtitle="Pencarian query dinamis langsung ke database Supabase"
        >
          <SlidersHorizontal size={18} style={{ color: 'var(--text-tertiary)' }} />
        </CardHeader>
        <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Row 1: Program, Gender, Minat */}
          <div className="grid grid-cols-4 gap-3 md-grid-cols-1">
            <Select
              label="Program BMU"
              value={filters.programType}
              onChange={(e) => handleFilterChange('programType', e.target.value)}
              options={[{ value: '', label: 'Semua Program' }, ...PROGRAM_TYPES]}
              placeholder=""
            />
            <Select
              label="Jenis Kelamin"
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              options={[
                { value: '', label: 'Semua Gender' },
                { value: 'L', label: 'Laki-laki (L)' },
                { value: 'P', label: 'Perempuan (P)' },
              ]}
              placeholder=""
            />
            <Select
              label="Bidang Minat Kerja"
              value={filters.targetJobInterest}
              onChange={(e) => handleFilterChange('targetJobInterest', e.target.value)}
              options={[{ value: '', label: 'Semua Bidang' }, ...JOB_INTEREST_FIELDS]}
              placeholder=""
            />
            <Select
              label="Dokumen Terverifikasi"
              value={filters.verifiedDocType}
              onChange={(e) => handleFilterChange('verifiedDocType', e.target.value)}
              options={[{ value: '', label: 'Semua Dokumen' }, ...DOCUMENT_TYPES]}
              placeholder=""
            />
          </div>

          {/* Row 2: Status Pipeline */}
          <div className="grid grid-cols-4 gap-3 md-grid-cols-1">
            <Select
              label="Status Belajar"
              value={filters.learningStatus}
              onChange={(e) => handleFilterChange('learningStatus', e.target.value)}
              options={[{ value: '', label: 'Semua Status Belajar' }, ...LEARNING_STATUSES]}
              placeholder=""
            />
            <Select
              label="Kesiapan Wawancara"
              value={filters.interviewReadiness}
              onChange={(e) => handleFilterChange('interviewReadiness', e.target.value)}
              options={[{ value: '', label: 'Semua Kesiapan' }, ...INTERVIEW_READINESS]}
              placeholder=""
            />
            <Select
              label="Status Seleksi Kerja"
              value={filters.jobSelectionStatus}
              onChange={(e) => handleFilterChange('jobSelectionStatus', e.target.value)}
              options={[{ value: '', label: 'Semua Status Seleksi' }, ...JOB_SELECTION_STATUSES]}
              placeholder=""
            />
            <Select
              label="Status Keberangkatan"
              value={filters.departureStatus}
              onChange={(e) => handleFilterChange('departureStatus', e.target.value)}
              options={[{ value: '', label: 'Semua Keberangkatan' }, ...DEPARTURE_STATUSES]}
              placeholder=""
            />
          </div>

          {/* Row 3: Rentang Usia & Tinggi Badan */}
          <div className="grid grid-cols-4 gap-3 md-grid-cols-1">
            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                label="Usia Min (thn)"
                type="number"
                value={filters.minAge}
                onChange={(e) => handleFilterChange('minAge', e.target.value)}
                placeholder="18"
              />
              <Input
                label="Usia Max (thn)"
                type="number"
                value={filters.maxAge}
                onChange={(e) => handleFilterChange('maxAge', e.target.value)}
                placeholder="30"
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Input
                label="Tinggi Min (cm)"
                type="number"
                value={filters.minHeight}
                onChange={(e) => handleFilterChange('minHeight', e.target.value)}
                placeholder="160"
              />
              <Input
                label="Tinggi Max (cm)"
                type="number"
                value={filters.maxHeight}
                onChange={(e) => handleFilterChange('maxHeight', e.target.value)}
                placeholder="180"
              />
            </div>

            <Select
              label="Kepemilikan SIM"
              value={filters.hasLicense}
              onChange={(e) => handleFilterChange('hasLicense', e.target.value)}
              options={[
                { value: '', label: 'Semua (Ada/Tidak)' },
                { value: 'true', label: 'Memiliki SIM (C/A/B1)' },
                { value: 'false', label: 'Tidak Memiliki SIM' },
              ]}
              placeholder=""
            />

            <Select
              label="Status Merokok"
              value={filters.smokingStatus}
              onChange={(e) => handleFilterChange('smokingStatus', e.target.value)}
              options={[
                { value: '', label: 'Semua (Merokok/Bebas)' },
                { value: 'false', label: 'Tidak Merokok (Non-Smoking)' },
                { value: 'true', label: 'Merokok' },
              ]}
              placeholder=""
            />
          </div>

          {/* Row 4: Checkboxes Sertifikasi & Preferensi */}
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
                checked={filters.hasJft}
                onChange={(e) => handleFilterChange('hasJft', e.target.checked)}
              />
              <span>Harus punya JFT-Basic A2</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.hasJlpt}
                onChange={(e) => handleFilterChange('hasJlpt', e.target.checked)}
              />
              <span>Harus punya JLPT (N5-N1)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.hasSsw}
                onChange={(e) => handleFilterChange('hasSsw', e.target.checked)}
              />
              <span>Harus punya Sertifikat SSW</span>
            </label>

            <span style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-default)', margin: '0 4px' }} />

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.willingOvertime === 'true'}
                onChange={(e) => handleFilterChange('willingOvertime', e.target.checked ? 'true' : '')}
              />
              <span>Bersedia Lembur</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={filters.willingRelocation === 'true'}
                onChange={(e) => handleFilterChange('willingRelocation', e.target.checked ? 'true' : '')}
              />
              <span>Bersedia Relokasi</span>
            </label>
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
                  maxHeight: '180px',
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
