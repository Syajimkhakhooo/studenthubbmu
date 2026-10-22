import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/feedback/LoadingSkeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ConfirmModal } from '../../components/feedback/ConfirmModal';
import { StudentFormModal } from './StudentFormModal';
import { StudentImportModal } from './StudentImportModal';
import {
  formatDate,
  calculateAge,
  getLearningStatusMeta,
  getJobSelectionMeta,
  getDepartureStatusMeta,
} from '../../utils/formatters';
import {
  PROGRAM_TYPES,
  LEARNING_STATUSES,
} from '../../utils/constants';
import {
  Search,
  UserPlus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Users,
  FileSpreadsheet,
  Flame,
  AlertTriangle,
} from 'lucide-react';

export function StudentListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'trash' ? 'trash' : 'active'
  );
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [trashCount, setTrashCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedProgram, setSelectedProgram] = useState(searchParams.get('program') || '');
  const [selectedLearningStatus, setSelectedLearningStatus] = useState(
    searchParams.get('filter')?.startsWith('learning_')
      ? searchParams.get('filter').replace('learning_', '')
      : ''
  );
  const [selectedJobStatus, setSelectedJobStatus] = useState(
    searchParams.get('filter')?.startsWith('job_')
      ? searchParams.get('filter').replace('job_', '')
      : ''
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [showAddModal, setShowAddModal] = useState(searchParams.get('action') === 'add');
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [deletePermanentTarget, setDeletePermanentTarget] = useState(null);
  const [showEmptyTrashConfirm, setShowEmptyTrashConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fetchTrashCount = useCallback(async () => {
    try {
      const count = await studentService.getTrashCount();
      setTrashCount(count);
    } catch {
      // ignore
    }
  }, []);

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
        onlyArchived: activeTab === 'trash',
      });
      setStudents(res.data);
      setTotalCount(res.total);
      fetchTrashCount();
    } catch (err) {
      toastError('Gagal memuat data siswa.');
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    searchQuery,
    selectedProgram,
    selectedLearningStatus,
    selectedJobStatus,
    activeTab,
    fetchTrashCount,
    toastError,
  ]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams);
    if (newTab === 'trash') {
      params.set('tab', 'trash');
    } else {
      params.delete('tab');
    }
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedProgram('');
    setSelectedLearningStatus('');
    setSelectedJobStatus('');
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (activeTab === 'trash') params.set('tab', 'trash');
    setSearchParams(params);
  };

  // Move to trash
  const handleMoveToTrash = async () => {
    if (!archiveTarget) return;
    try {
      await studentService.setStudentArchive(archiveTarget.id, true, profile);
      success(`Siswa ${archiveTarget.full_name} berhasil dipindahkan ke Tong Sampah.`);
      setArchiveTarget(null);
      fetchStudents();
    } catch (err) {
      toastError(err.message || 'Gagal memindahkan siswa ke tong sampah');
    }
  };

  // Restore from trash
  const handleRestore = async () => {
    if (!restoreTarget) return;
    try {
      await studentService.restoreStudent(restoreTarget.id, profile);
      success(`Siswa ${restoreTarget.full_name} berhasil dipulihkan ke daftar aktif.`);
      setRestoreTarget(null);
      fetchStudents();
    } catch (err) {
      toastError(err.message || 'Gagal memulihkan siswa');
    }
  };

  // Permanently delete from database
  const handlePermanentDelete = async () => {
    if (!deletePermanentTarget) return;
    try {
      await studentService.deleteStudentPermanently(deletePermanentTarget.id, profile);
      success(`Siswa ${deletePermanentTarget.full_name} berhasil dihapus permanen.`);
      setDeletePermanentTarget(null);
      fetchStudents();
    } catch (err) {
      toastError(err.message || 'Gagal menghapus siswa permanen');
    }
  };

  // Empty trash bin (delete all archived students permanently)
  const handleEmptyTrash = async () => {
    try {
      setIsBulkDeleting(true);
      const res = await studentService.emptyTrash(profile);
      if (res.count === 0) {
        success('Tong sampah sudah kosong.');
      } else {
        success(`Berhasil menghapus permanen ${res.count} siswa dari tong sampah.`);
      }
      setShowEmptyTrashConfirm(false);
      fetchStudents();
    } catch (err) {
      toastError(err.message || 'Gagal mengosongkan tong sampah.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Delete ALL active students permanently
  const handleDeleteAllActive = async () => {
    try {
      setIsBulkDeleting(true);
      const res = await studentService.deleteAllActiveStudents(profile);
      if (res.count === 0) {
        success('Tidak ada siswa aktif yang tersisa.');
      } else {
        success(`Berhasil menghapus permanen ${res.count} data siswa aktif.`);
      }
      setShowDeleteAllConfirm(false);
      fetchStudents();
    } catch (err) {
      toastError(err.message || 'Gagal menghapus semua data siswa.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Active student table columns
  const activeColumns = [
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
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}
          onClick={(e) => e.stopPropagation()}
        >
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
            icon={Trash2}
            onClick={() => setArchiveTarget(row)}
            title="Pindahkan ke Tong Sampah"
            style={{ color: 'var(--text-tertiary)' }}
          />
        </div>
      ),
    },
  ];

  // Trash table columns
  const trashColumns = [
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
            color: 'var(--text-secondary)',
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
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Program: {row.program_type}
          </span>
        </div>
      ),
    },
    {
      header: 'TANGGAL MASUK',
      accessor: 'entry_date',
      render: (row) => (
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
          {formatDate(row.entry_date)}
        </span>
      ),
    },
    {
      header: 'STATUS ARSIP',
      render: () => <Badge variant="warning">Di Tong Sampah</Badge>,
    },
    {
      header: 'AKSI',
      align: 'right',
      render: (row) => (
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={() => setRestoreTarget(row)}
            title="Pulihkan Siswa ke Daftar Aktif"
          >
            Pulihkan
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => setDeletePermanentTarget(row)}
            title="Hapus Permanen dari Database"
            style={{ color: '#ef4444' }}
          >
            Hapus Permanen
          </Button>
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
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {activeTab === 'trash' ? 'Tong Sampah Siswa' : 'Pangkalan Data Siswa BMU'}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {activeTab === 'trash'
              ? 'Daftar siswa yang telah diarsipkan. Anda dapat memulihkan kembali atau menghapusnya secara permanen.'
              : 'Daftar siswa resmi, pengelolaan profil, checklist dokumen, dan status pipeline'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {activeTab === 'trash' ? (
            // ── Trash tab actions ──────────────────────────────────────────
            <>
              <Button
                variant="outline"
                icon={Flame}
                onClick={() => setShowEmptyTrashConfirm(true)}
                disabled={trashCount === 0}
                style={{
                  color: '#ef4444',
                  borderColor: 'rgba(239,68,68,0.4)',
                }}
                title="Hapus permanen semua siswa di tong sampah"
              >
                Kosongkan Tong Sampah {trashCount > 0 && `(${trashCount})`}
              </Button>
            </>
          ) : (
            // ── Active tab actions ─────────────────────────────────────────
            <>
              <Button variant="secondary" icon={Filter} onClick={() => navigate('/reports')}>
                Data Explorer
              </Button>
              <Button
                variant="secondary"
                icon={FileSpreadsheet}
                onClick={() => setShowImportModal(true)}
                title="Import banyak data siswa sekaligus dari file Excel atau CSV"
              >
                Import Excel
              </Button>
              <Button
                variant="outline"
                icon={AlertTriangle}
                onClick={() => setShowDeleteAllConfirm(true)}
                disabled={totalCount === 0}
                style={{
                  color: '#ef4444',
                  borderColor: 'rgba(239,68,68,0.4)',
                }}
                title="Hapus permanen SEMUA data siswa aktif"
              >
                Hapus Semua Data
              </Button>
              <Button variant="primary" icon={UserPlus} onClick={() => setShowAddModal(true)}>
                Tambah Siswa Baru
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs: Siswa Aktif vs Tong Sampah */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '2px',
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('active')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'active' ? 600 : 500,
            color: activeTab === 'active' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            borderBottom: activeTab === 'active' ? '2px solid var(--text-primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Users size={16} />
          <span>Siswa Aktif</span>
          {activeTab === 'active' && (
            <span
              style={{
                fontSize: '0.75rem',
                backgroundColor: 'var(--bg-surface-elevated)',
                padding: '1px 6px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {totalCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('trash')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'trash' ? 600 : 500,
            color: activeTab === 'trash' ? 'var(--text-primary)' : 'var(--text-tertiary)',
            borderBottom: activeTab === 'trash' ? '2px solid var(--text-primary)' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <Trash2 size={16} />
          <span>Tong Sampah</span>
          {trashCount > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                padding: '1px 6px',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontWeight: 600,
              }}
            >
              {trashCount}
            </span>
          )}
        </button>
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

            {activeTab === 'active' ? (
              <Select
                value={selectedLearningStatus}
                onChange={(e) => {
                  setSelectedLearningStatus(e.target.value);
                  setCurrentPage(1);
                }}
                options={[{ value: '', label: 'Semua Status Belajar' }, ...LEARNING_STATUSES]}
                placeholder=""
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                <span>Status arsip: Tong Sampah</span>
              </div>
            )}
          </div>

          {(searchQuery || selectedProgram || selectedLearningStatus || selectedJobStatus) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
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
            <TableSkeleton rows={5} cols={activeTab === 'trash' ? 5 : 7} />
          </CardBody>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title={
                activeTab === 'trash'
                  ? 'Tong Sampah Kosong'
                  : searchQuery || selectedProgram
                  ? 'Tidak Ada Siswa Sesuai Kriteria'
                  : 'Belum Ada Siswa Terdaftar'
              }
              description={
                activeTab === 'trash'
                  ? 'Tidak ada siswa yang sedang berada di dalam Tong Sampah.'
                  : searchQuery || selectedProgram
                  ? 'Coba sesuaikan kata kunci pencarian atau reset filter yang dipilih.'
                  : 'Pangkalan data belum memiliki siswa. Klik tombol di bawah untuk mendaftarkan siswa pertama.'
              }
              actionLabel={
                activeTab === 'trash'
                  ? 'Kembali ke Siswa Aktif'
                  : searchQuery || selectedProgram
                  ? 'Reset Filter'
                  : 'Tambah Siswa Baru'
              }
              onAction={
                activeTab === 'trash'
                  ? () => handleTabChange('active')
                  : searchQuery || selectedProgram
                  ? handleResetFilters
                  : () => setShowAddModal(true)
              }
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <Table
            columns={activeTab === 'trash' ? trashColumns : activeColumns}
            data={students}
            onRowClick={(row) => {
              if (activeTab === 'active') navigate(`/students/${row.id}`);
            }}
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

      {/* Bulk Excel Import Modal */}
      <StudentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={fetchStudents}
      />

      {/* 1. Move to Trash Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleMoveToTrash}
        title="Pindahkan Siswa ke Tong Sampah"
        message={`Apakah Anda yakin ingin memindahkan siswa "${archiveTarget?.full_name}" (${archiveTarget?.student_id_number}) ke Tong Sampah? Siswa ini tidak akan muncul di daftar aktif, namun dapat dipulihkan kembali kapan saja dari tab Tong Sampah.`}
        confirmText="Ya, Pindahkan ke Sampah"
        variant="warning"
      />

      {/* 2. Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Pulihkan Siswa dari Tong Sampah"
        message={`Apakah Anda yakin ingin memulihkan siswa "${restoreTarget?.full_name}" (${restoreTarget?.student_id_number}) kembali ke daftar siswa aktif?`}
        confirmText="Pulihkan Siswa"
        variant="primary"
      />

      {/* 3. Permanent Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletePermanentTarget)}
        onClose={() => setDeletePermanentTarget(null)}
        onConfirm={handlePermanentDelete}
        title="Hapus Permanen Siswa"
        message={`PERINGATAN: Tindakan ini akan menghapus siswa "${deletePermanentTarget?.full_name}" (${deletePermanentTarget?.student_id_number}) beserta seluruh berkas dokumen, riwayat pendidikan, keluarga, dan status perjalanannya secara PERMANEN dari database Supabase. Tindakan ini TIDAK DAPAT DIBATALKAN.`}
        confirmText="Hapus Permanen Sekarang"
        variant="danger"
      />

      {/* 4. Empty Trash Confirmation Modal */}
      <ConfirmModal
        isOpen={showEmptyTrashConfirm}
        onClose={() => setShowEmptyTrashConfirm(false)}
        onConfirm={handleEmptyTrash}
        title="⚠️ Kosongkan Tong Sampah?"
        message={`Tindakan ini akan menghapus PERMANEN ${trashCount} siswa yang ada di tong sampah beserta seluruh data terkaitnya (dokumen, riwayat, keluarga, dsb). Data yang sudah dihapus TIDAK BISA DIPULIHKAN kembali. Apakah Anda benar-benar yakin?`}
        confirmText={isBulkDeleting ? 'Menghapus...' : `Hapus Permanen ${trashCount} Siswa`}
        variant="danger"
      />

      {/* 5. Delete ALL Active Students Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={handleDeleteAllActive}
        title="🚨 HAPUS SEMUA DATA SISWA?"
        message={`PERINGATAN KERAS: Tindakan ini akan menghapus PERMANEN seluruh ${totalCount} data siswa aktif dari database beserta semua dokumen, riwayat pendidikan, riwayat kerja, data keluarga, sertifikasi, dan status perjalanannya. Operasi ini TIDAK DAPAT DIBATALKAN dalam kondisi apapun. Pastikan Anda memiliki backup sebelum melanjutkan.`}
        confirmText={isBulkDeleting ? 'Menghapus...' : `Hapus Permanen Semua ${totalCount} Siswa`}
        variant="danger"
      />
    </div>
  );
}
