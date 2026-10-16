import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  Users,
  UserPlus,
  BookOpen,
  UserCheck,
  Award,
  PlaneTakeoff,
  AlertCircle,
  FileCheck2,
  Calendar,
  Filter,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    newStudentsThisPeriod: 0,
    activeLearning: 0,
    readyInterview: 0,
    passedJobSelection: 0,
    readyDeparture: 0,
    onLeave: 0,
    departed: 0,
    certsCount: { jft: 0, jlpt: 0, ssw: 0 },
    docsSummary: { verified: 0, uploaded: 0, missing: 0 },
  });

  const monthOptions = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const yearOptions = [
    { value: (currentDate.getFullYear() - 1).toString(), label: (currentDate.getFullYear() - 1).toString() },
    { value: currentDate.getFullYear().toString(), label: currentDate.getFullYear().toString() },
    { value: (currentDate.getFullYear() + 1).toString(), label: (currentDate.getFullYear() + 1).toString() },
  ];

  useEffect(() => {
    async function fetchDashboardStats() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Fetch all non-archived students with journey & certs
        const { data: students, error: studentErr } = await supabase
          .from('students')
          .select(`
            id,
            entry_date,
            student_journey (
              learning_status,
              leave_status,
              interview_readiness,
              job_selection_status,
              departure_readiness,
              departure_status
            ),
            certifications (
              cert_type
            ),
            student_documents (
              status
            )
          `)
          .eq('is_archived', false);

        if (studentErr) throw studentErr;

        const allStudents = students || [];
        const total = allStudents.length;

        // Filter new students by selected month & year
        const targetYear = parseInt(selectedYear);
        const targetMonth = parseInt(selectedMonth) - 1; // 0-indexed

        let newInPeriod = 0;
        let learning = 0;
        let interview = 0;
        let jobPassed = 0;
        let departureReady = 0;
        let onLeave = 0;
        let departed = 0;

        let jftCount = 0;
        let jlptCount = 0;
        let sswCount = 0;

        let docsVerified = 0;
        let docsUploaded = 0;
        let docsMissing = 0;

        allStudents.forEach((s) => {
          // Check entry date
          if (s.entry_date) {
            const entryD = new Date(s.entry_date);
            if (entryD.getFullYear() === targetYear && entryD.getMonth() === targetMonth) {
              newInPeriod++;
            }
          }

          const j = s.student_journey;
          if (j) {
            if (j.learning_status === 'sedang_belajar') learning++;
            if (j.interview_readiness === 'siap') interview++;
            if (j.job_selection_status === 'lolos') jobPassed++;
            if (j.departure_readiness === 'siap') departureReady++;
            if (j.leave_status === 'cuti' || j.leave_status === 'dicutikan') onLeave++;
            if (j.departure_status === 'sudah_berangkat') departed++;
          }

          (s.certifications || []).forEach((c) => {
            if (c.cert_type === 'JFT_BASIC') jftCount++;
            else if (c.cert_type.startsWith('JLPT')) jlptCount++;
            else if (c.cert_type === 'SSW') sswCount++;
          });

          (s.student_documents || []).forEach((d) => {
            if (d.status === 'verified') docsVerified++;
            else if (d.status === 'uploaded') docsUploaded++;
            else if (d.status === 'missing') docsMissing++;
          });
        });

        setStats({
          totalStudents: total,
          newStudentsThisPeriod: newInPeriod,
          activeLearning: learning,
          readyInterview: interview,
          passedJobSelection: jobPassed,
          readyDeparture: departureReady,
          onLeave: onLeave,
          departed: departed,
          certsCount: { jft: jftCount, jlpt: jlptCount, ssw: sswCount },
          docsSummary: { verified: docsVerified, uploaded: docsUploaded, missing: docsMissing },
        });
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardStats();
  }, [selectedYear, selectedMonth]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <LoadingSkeleton lines={4} />
        <div className="grid grid-cols-4 gap-4 md-grid-cols-1">
          <LoadingSkeleton lines={3} />
          <LoadingSkeleton lines={3} />
          <LoadingSkeleton lines={3} />
          <LoadingSkeleton lines={3} />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Siswa Terdaftar',
      value: stats.totalStudents,
      subtitle: 'Semua siswa aktif di database',
      icon: Users,
      actionFilter: '',
    },
    {
      title: 'Siswa Baru Bulan Ini',
      value: stats.newStudentsThisPeriod,
      subtitle: `Periode ${monthOptions.find(m => m.value === selectedMonth)?.label} ${selectedYear}`,
      icon: UserPlus,
      actionFilter: `entry_period`,
    },
    {
      title: 'Sedang Belajar (Aktif)',
      value: stats.activeLearning,
      subtitle: 'Menjalani kurikulum bahasa & skill',
      icon: BookOpen,
      actionFilter: 'learning_sedang_belajar',
    },
    {
      title: 'Siap Interview',
      value: stats.readyInterview,
      subtitle: 'Memenuhi syarat tes wawancara',
      icon: UserCheck,
      actionFilter: 'interview_siap',
    },
    {
      title: 'Lolos Seleksi Kerja',
      value: stats.passedJobSelection,
      subtitle: 'Mendapat job order / perusahaan',
      icon: Award,
      actionFilter: 'job_lolos',
    },
    {
      title: 'Siap Berangkat',
      value: stats.readyDeparture,
      subtitle: 'Dokumen COE/Visa tahap akhir',
      icon: PlaneTakeoff,
      actionFilter: 'departure_ready',
    },
    {
      title: 'Izin Cuti / Dicutikan',
      value: stats.onLeave,
      subtitle: 'Status proses ditunda sementara',
      icon: AlertCircle,
      actionFilter: 'leave_cuti',
    },
    {
      title: 'Sudah Berangkat ke Jepang',
      value: stats.departed,
      subtitle: 'Telah bekerja di Jepang',
      icon: TrendingUp,
      actionFilter: 'departure_sudah',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner: Period Filter & Quick Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '16px 20px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Ringkasan Operasional Siswa</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Data pangkalan siswa aktual LPK Bahtera Mitra Unggulan dari database Supabase
          </p>
        </div>

        {/* Month & Year Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ width: '130px' }}>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              options={monthOptions}
              placeholder=""
            />
          </div>
          <div style={{ width: '90px' }}>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              options={yearOptions}
              placeholder=""
            />
          </div>
          <Button
            variant="primary"
            size="md"
            icon={Filter}
            onClick={() => navigate('/reports')}
          >
            Data Explorer &amp; PDF
          </Button>
        </div>
      </div>

      {/* Zero State if no students exist in database */}
      {stats.totalStudents === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={Users}
              title="Database Siswa Masih Kosong"
              description="Belum ada data siswa yang tercatat di Supabase. Sesuai prinsip produk, data palsu/seeder tidak dibuat. Anda dapat menambahkan siswa baru atau mengimpor data spreadsheet pendaftaran BMU."
              actionLabel="Tambah Siswa Baru Pertama"
              onAction={() => navigate('/students?action=add')}
            />
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Main 8 Metric Cards Grid */}
          <div className="grid grid-cols-4 gap-4 lg-grid-cols-2 md-grid-cols-1">
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(`/students?filter=${card.actionFilter}`)}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-emphasis)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {card.title}
                      </span>
                      <div
                        style={{
                          fontSize: '1.75rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          marginTop: '4px',
                          letterSpacing: '-0.03em',
                        }}
                      >
                        {card.value}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <Icon size={18} />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '16px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {card.subtitle}
                    </span>
                    <ArrowRight size={13} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secondary Summary: Certifications & Document Verification */}
          <div className="grid grid-cols-2 gap-4 md-grid-cols-1">
            {/* Certifications Overview */}
            <Card>
              <CardHeader
                title="Sertifikasi Bahasa & Keahlian"
                subtitle="Jumlah sertifikat yang tersimpan pada database siswa"
              >
                <Award size={16} style={{ color: 'var(--text-tertiary)' }} />
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>JFT-Basic A2</span>
                    <span className="font-mono" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{stats.certsCount.jft}</span>
                  </div>
                  <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>JLPT (N5 / N4 / N3 / N2 / N1)</span>
                    <span className="font-mono" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{stats.certsCount.jlpt}</span>
                  </div>
                  <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sertifikat SSW (Tokutei Ginou)</span>
                    <span className="font-mono" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{stats.certsCount.ssw}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Document Completion Status */}
            <Card>
              <CardHeader
                title="Status Kelengkapan Dokumen"
                subtitle="Monitoring berkas KTP, KK, Ijazah, Paspor, SKCK, dll."
              >
                <FileCheck2 size={16} style={{ color: 'var(--text-tertiary)' }} />
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Dokumen Terverifikasi Valid</span>
                    <span className="font-mono" style={{ color: 'var(--status-success-text)', fontWeight: 600, fontSize: '0.9375rem' }}>
                      {stats.docsSummary.verified}
                    </span>
                  </div>
                  <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Diunggah &amp; Menunggu Verifikasi</span>
                    <span className="font-mono" style={{ color: 'var(--status-warning-text)', fontWeight: 600, fontSize: '0.9375rem' }}>
                      {stats.docsSummary.uploaded}
                    </span>
                  </div>
                  <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Dokumen Belum Tersedia (Missing)</span>
                    <span className="font-mono" style={{ color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '0.9375rem' }}>
                      {stats.docsSummary.missing}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
