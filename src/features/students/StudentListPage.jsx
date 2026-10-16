import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/feedback/LoadingSkeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ConfirmModal } from '../../components/feedback/ConfirmModal';
import { StudentFormModal } from './StudentFormModal';
import {
  formatDate,
  calculateAge,
  getLearningStatusMeta,
  getJobSelectionMeta,
  getDepartureStatusMeta,
  getInterviewReadinessMeta,
} from '../../utils/formatters';
import {
  PROGRAM_TYPES,
  LEARNING_STATUSES,
  JOB_SELECTION_STATUSES,
} from '../../utils/constants';
import {
  Search,
  UserPlus,
  Filter,
  Eye,
  Edit2,
  Archive,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

export function StudentListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, canManageStudents = true } = useAuth();
  const { success, error: toastError } = useToast();

  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedProgram, setSelectedProgram] = useState(searchParams.get('program') || '');
  const [selectedLearningStatus, setSelectedLearningStatus] = useState(
    searchParams.get('filter')?.startsWith('learning_') ? searchParams.get('filter').replace('learning_', '') : ''
  );
  const [selectedJobStatus, setSelectedJobStatus] = useState(
    searchParams.get('filter')?.startsWith('job_') ? searchParams.get('filter').replace('job_', '') : ''
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(searchParams.get('action') === 'add');
  const [editingStudent, setEditingStudent] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentService.getStudents({
        page: currentPage,
        pageSize,
        search: searchQuery,
        program: selectedProgram,
        learningStatus: selectedLearningStatus,
        jobStatus: selectedJobStatus,
      });
      setStudents(res.data);
      setTotalCount(res.total);
    } catch (err) {
      toastError('Gagal memuat data siswa.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedProgram, selectedLearningStatus, selectedJobStatus, toastError]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedProgram('');
    setSelectedLearningStatus('');
    setSelectedJobStatus('');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      await studentService.setStudentArchive(archiveTarget.id, true, profile);
      success(`Siswa ${archiveTarget.full_name} berhasil diarsipkan.`);
      setArchiveTarget(null);
      fetchStudents();
    } catch (err) {
      toastError(err.message || 'Gagal mengarsipkan siswa');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const columns = [
    {
      header: 'ID SISWA',
      accessor: 'student_id_number',
      render: (row) => (
        <span
          className="font-mono text-xs"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            padding: '3px 6px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
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
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {row.full_name}
            {row.nickname && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '6px' }}>
                ({row.nickname})
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
            <span
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-surface-elevated)',
                padding: '1px 5px',
                borderRadius: '3px',
              }}
            >
              {row.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-surface-elevated)',
                padding: '1px 5px',
                borderRadius: '3px',
              }}
            >
              {row.program_type}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'USIA & TB',
      accessor: 'age_height',
      render: (row) => (
        <div style={{ fontSize: '0.8125rem' }}>
          <div>{calculateAge(row.birth_date)}</div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
            {row.height_cm ? `${row.height_cm} cm` : '-'}
            {row.weight_kg ? ` / ${row.weight_kg} kg` : ''}
          </div>
        </div>
      ),
    },
    {
      header: 'MINAT BIDANG',
      accessor: 'target_job_interest',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {row.target_job_interest || '-'}
        </span>
      ),
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
      header: 'STATUS SELEKSI & KEBERANGKATAN',
      accessor: 'journey_combined',
      render: (row) => {
        const jobMeta = getJobSelectionMeta(row.student_journey?.job_selection_status);
        const depMeta = getDepartureStatusMeta(row.student_journey?.departure_status);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <Badge variant={jobMeta.badge}>{jobMeta.label}</Badge>
            {row.student_journey?.departure_status === 'sudah_berangkat' && (
              <Badge variant="success">Sudah di Jepang</Badge>
            )}
          </div>
        );
      },
    },
    {
      header: 'TGL MASUK',
      accessor: 'entry_date',
      render: (row) => (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          {formatDate(row.entry_date)}
        </span>
      ),
    },
    {
      header: 'AKSI',
      align: 'right',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={Eye}
            onClick={() => navigate(`/students/${row.id}`)}
            title="Lihat Profil Lengkap"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Edit2}
            onClick={() => setEditingStudent(row)}
            title="Edit Data Siswa"
          />
          <Button
            variant="ghost"
            size="sm"
            icon={Archive}
            onClick={() => setArchiveTarget(row)}
            title="Arsipkan Siswa"
          />
        </div>
      ),
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
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Pangkalan Data Siswa BMU</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Daftar siswa resmi, pengelolaan profil, checklist dokumen, dan status pipeline
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            icon={Filter}
            onClick={() => navigate('/reports')}
          >
            Data Explorer
          </Button>
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => setShowAddModal(true)}
          >
            Tambah Siswa Baru
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardBody style={{ padding: '16px' }}>
          <div className="grid grid-cols-4 gap-3 md-grid-cols-1">
            <div style={{ gridColumn: 'span 2' }}>
              <Input
                placeholder="Cari berdasarkan No. ID Siswa atau Nama Lengkap..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                leadIcon={Search}
              />
            </div>

            <Select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);
                setCurrentPage(1);
              }}
              options={[{ value: '', label: 'Semua Program' }, ...PROGRAM_TYPES]}
              placeholder=""
            />

            <Select
              value={selectedLearningStatus}
              onChange={(e) => {
                setSelectedLearningStatus(e.target.value);
                setCurrentPage(1);
              }}
              options={[{ value: '', label: 'Semua Status Belajar' }, ...LEARNING_STATUSES]}
              placeholder=""
            />
          </div>

          {(searchQuery || selectedProgram || selectedLearningStatus || selectedJobStatus) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Menampilkan hasil filter: <strong>{totalCount}</strong> siswa ditemukan
              </span>
              <Button variant="ghost" size="sm" icon={RotateCcw} onClick={handleResetFilters}>
                Reset Filter
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Students Table */}
      {loading ? (
        <Card>
          <CardBody>
            <TableSkeleton rows={5} cols={7} />
          </CardBody>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title={searchQuery || selectedProgram ? 'Tidak Ada Siswa Sesuai Kriteria' : 'Belum Ada Siswa Terdaftar'}
              description={
                searchQuery || selectedProgram
                  ? 'Coba sesuaikan kata kunci pencarian atau reset filter yang dipilih.'
                  : 'Pangkalan data belum memiliki siswa. Klik tombol di bawah untuk mendaftarkan siswa pertama.'
              }
              actionLabel={searchQuery || selectedProgram ? 'Reset Filter' : 'Tambah Siswa Baru'}
              onAction={searchQuery || selectedProgram ? handleResetFilters : () => setShowAddModal(true)}
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table
            columns={columns}
            data={students}
            onRowClick={(row) => navigate(`/students/${row.id}`)}
          />

          {/* Pagination Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span>
              Menampilkan {Math.min((currentPage - 1) * pageSize + 1, totalCount)} -{' '}
              {Math.min(currentPage * pageSize, totalCount)} dari {totalCount} siswa
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                Sebelumnya
              </Button>
              <span className="font-mono text-xs">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                trailIcon={ChevronRight}
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Add / Edit Student Modal */}
      {(showAddModal || editingStudent) && (
        <StudentFormModal
          isOpen={showAddModal || Boolean(editingStudent)}
          student={editingStudent}
          onClose={() => {
            setShowAddModal(false);
            setEditingStudent(null);
          }}
          onSuccess={fetchStudents}
        />
      )}

      {/* Archive Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Arsipkan Siswa"
        message={`Apakah Anda yakin ingin mengarsipkan siswa "${archiveTarget?.full_name}" (${archiveTarget?.student_id_number})? Siswa yang diarsipkan tidak akan tampil di daftar aktif tetapi datanya tetap tersimpan di database.`}
        confirmText="Ya, Arsipkan"
        variant="warning"
      />
    </div>
  );
}
