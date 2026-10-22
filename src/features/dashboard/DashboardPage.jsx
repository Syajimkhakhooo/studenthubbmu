import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { EmptyState } from '../../components/feedback/EmptyState';
import { DonutChart } from '../../components/charts';
import {
  Users,
  UserPlus,
  BookOpen,
  UserCheck,
  Award,
  FileText,
  Clock,
  PlaneTakeoff,
  AlertCircle,
  FileCheck2,
  Filter,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Radio,
  Briefcase,
  Layers,
} from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [stats, setStats] = useState({
    totalStudents: 0,
    newStudentsThisPeriod: 0,
    activeLearning: 0,
    readyInterview: 0,
    passedJobSelection: 0,
    waitingContract: 0,
    waitingCoe: 0,
    readyDeparture: 0,
    onLeave: 0,
    departed: 0,
    programDistribution: {
      ssw: 0,
      internship: 0,
      other: 0,
    },
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

  const fetchDashboardStats = useCallback(
    async (showSkeleton = true) => {
      if (!isSupabaseConfigured) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showSkeleton) setLoading(true);
      else setRefreshing(true);

      try {
        const { data: students, error: studentErr } = await supabase
          .from('students')
          .select(`
            id,
            entry_date,
            program_type,
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

        const targetYear = parseInt(selectedYear);
        const targetMonth = parseInt(selectedMonth) - 1;

        let newInPeriod = 0;
        let learning = 0;
        let interview = 0;
        let jobPassed = 0;
        let waitingContract = 0;
        let waitingCoe = 0;
        let departureReady = 0;
        let onLeave = 0;
        let departed = 0;

        let progSSW = 0;
        let progIntern = 0;
        let progOther = 0;

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

          // Program distribution
          if (s.program_type === 'SSW') progSSW++;
          else if (s.program_type === 'TG_INTERNSHIP') progIntern++;
          else progOther++;

          // Student Journey
          const j = s.student_journey;
          if (j) {
            if (j.learning_status === 'sedang_belajar') learning++;
            if (j.interview_readiness === 'siap') interview++;
            if (j.job_selection_status === 'lolos') jobPassed++;

            // Departure Readiness Breakdown
            if (j.departure_readiness === 'menunggu_kontrak') waitingContract++;
            if (j.departure_readiness === 'menunggu_coe') waitingCoe++;
            if (j.departure_readiness === 'siap') departureReady++;

            if (j.leave_status === 'cuti' || j.leave_status === 'dicutikan') onLeave++;
            if (j.departure_status === 'sudah_berangkat') departed++;
          }

          (s.certifications || []).forEach((c) => {
            if (c.cert_type === 'JFT_BASIC') jftCount++;
            else if (c.cert_type && c.cert_type.startsWith('JLPT')) jlptCount++;
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
          waitingContract,
          waitingCoe,
          readyDeparture: departureReady,
          onLeave,
          departed,
          programDistribution: {
            ssw: progSSW,
            internship: progIntern,
            other: progOther,
          },
          certsCount: { jft: jftCount, jlpt: jlptCount, ssw: sswCount },
          docsSummary: { verified: docsVerified, uploaded: docsUploaded, missing: docsMissing },
        });

        setLastUpdated(new Date());
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedYear, selectedMonth]
  );

  // Initial load
  useEffect(() => {
    fetchDashboardStats(true);
  }, [fetchDashboardStats]);

  // Realtime Supabase Subscription & Fallback Polling
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('dashboard-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        fetchDashboardStats(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_journey' }, () => {
        fetchDashboardStats(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_documents' }, () => {
        fetchDashboardStats(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certifications' }, () => {
        fetchDashboardStats(false);
      })
      .subscribe();

    // Fallback polling interval every 30 seconds
    const intervalId = setInterval(() => {
      fetchDashboardStats(false);
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, [fetchDashboardStats]);

  // Format last updated time
  const formattedLastUpdated = useMemo(() => {
    return lastUpdated.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [lastUpdated]);

  // Donut 1: Pipeline Perjalanan & Kesiapan Siswa
  const pipelineDonutData = useMemo(() => {
    return [
      { label: 'Sedang Belajar (Aktif)', value: stats.activeLearning, color: '#3b82f6', route: '/student-journey' },
      { label: 'Siap Interview', value: stats.readyInterview, color: '#06b6d4', route: '/student-journey' },
      { label: 'Lolos Seleksi Kerja', value: stats.passedJobSelection, color: '#8b5cf6', route: '/student-journey' },
      { label: 'Menunggu Kontrak', value: stats.waitingContract, color: '#f59e0b', route: '/student-journey' },
      { label: 'Sedang Menunggu COE', value: stats.waitingCoe, color: '#f97316', route: '/student-journey' },
      { label: 'Siap Berangkat (Visa/COE)', value: stats.readyDeparture, color: '#10b981', route: '/student-journey' },
      { label: 'Sudah di Jepang', value: stats.departed, color: '#14b8a6', route: '/student-journey' },
      { label: 'Izin Cuti / Nonaktif', value: stats.onLeave, color: '#ef4444', route: '/student-journey' },
    ];
  }, [stats]);

  // Donut 2: Komposisi Program Siswa BMU
  const programDonutData = useMemo(() => {
    return [
      { label: 'Tokutei Ginou (SSW)', value: stats.programDistribution.ssw, color: '#3b82f6' },
      { label: 'Magang / Ikushei Shuro', value: stats.programDistribution.internship, color: '#10b981' },
      { label: 'Program Lainnya', value: stats.programDistribution.other, color: '#8b5cf6' },
    ];
  }, [stats.programDistribution]);

  // Donut 3: Status Kelengkapan & Verifikasi Dokumen
  const docsDonutData = useMemo(() => {
    return [
      { label: 'Terverifikasi Valid', value: stats.docsSummary.verified, color: '#10b981' },
      { label: 'Menunggu Verifikasi', value: stats.docsSummary.uploaded, color: '#f59e0b' },
      { label: 'Belum Tersedia (Missing)', value: stats.docsSummary.missing, color: '#ef4444' },
    ];
  }, [stats.docsSummary]);

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
      subtitle: `Periode ${monthOptions.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`,
      icon: UserPlus,
      actionFilter: 'entry_period',
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
      title: 'Menunggu Kontrak',
      value: stats.waitingContract,
      subtitle: 'Tahap pengajuan kontrak kerja',
      icon: FileText,
      actionFilter: 'departure_menunggu_kontrak',
      highlightColor: '#f59e0b',
    },
    {
      title: 'Sedang Menunggu COE',
      value: stats.waitingCoe,
      subtitle: 'Proses imigrasi Jepang berjalan',
      icon: Clock,
      actionFilter: 'departure_menunggu_coe',
      highlightColor: '#f97316',
    },
    {
      title: 'Siap Berangkat',
      value: stats.readyDeparture,
      subtitle: 'Dokumen COE/Visa tahap akhir',
      icon: PlaneTakeoff,
      actionFilter: 'departure_ready',
    },
    {
      title: 'Sudah di Jepang',
      value: stats.departed,
      subtitle: 'Telah bekerja aktif di Jepang',
      icon: TrendingUp,
      actionFilter: 'departure_sudah',
    },
    {
      title: 'Izin Cuti / Nonaktif',
      value: stats.onLeave,
      subtitle: 'Status proses ditunda sementara',
      icon: AlertCircle,
      actionFilter: 'leave_cuti',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner: Period Filter, Realtime Indicator & Actions */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Ringkasan Operasional Siswa</h1>
            {/* Realtime Live Pulse Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.28)',
                color: '#10b981',
                fontSize: '0.6875rem',
                fontWeight: 600,
                letterSpacing: '0.03em',
              }}
              title={`Sinkronisasi realtime otomatis aktif. Terakhir diperbarui: ${formattedLastUpdated}`}
            >
              <span className="realtime-live-dot" />
              <span>REALTIME SYNC</span>
            </div>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Data pangkalan siswa aktual LPK Bahtera Mitra Unggulan • Update: <span className="font-mono">{formattedLastUpdated}</span>
          </p>
        </div>

        {/* Month & Year Selectors + Refresh Button */}
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
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={() => fetchDashboardStats(false)}
            disabled={refreshing}
            title="Muat ulang data statistik sekarang"
          >
            {refreshing ? 'Sinkron...' : 'Segarkan'}
          </Button>

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
              description="Belum ada data siswa yang tercatat di Supabase. Anda dapat menambahkan siswa baru atau mengimpor data spreadsheet pendaftaran BMU."
              actionLabel="Tambah Siswa Baru Pertama"
              onAction={() => navigate('/students?action=add')}
            />
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Main KPI Cards Grid (5 cols on 2xl, 3 on lg, 2 on md, 1 on sm) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '16px',
            }}
          >
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (card.actionFilter.startsWith('departure_')) {
                      navigate('/student-journey');
                    } else {
                      navigate(`/students?filter=${card.actionFilter}`);
                    }
                  }}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 18px',
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
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {card.title}
                      </span>
                      <div
                        style={{
                          fontSize: '1.625rem',
                          fontWeight: 700,
                          color: card.highlightColor || 'var(--text-primary)',
                          marginTop: '4px',
                          letterSpacing: '-0.03em',
                        }}
                      >
                        {card.value}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        color: card.highlightColor || 'var(--text-primary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <Icon size={17} />
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '14px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                      {card.subtitle}
                    </span>
                    <ArrowRight size={12} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* REALTIME DONUT CHARTS SECTION */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Radio size={16} style={{ color: '#10b981' }} />
                  Grafik Statistik Realtime
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Visualisasi proporsi pipeline keberangkatan, program pelatihan, dan verifikasi dokumen secara langsung
                </p>
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Arahkan kursor pada segmen donat untuk melihat detail dan persentase</span>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px',
              }}
            >
              {/* Donut 1: Pipeline Perjalanan Siswa */}
              <Card>
                <CardHeader
                  title="Tahap Perjalanan &amp; Pipeline"
                  subtitle="Distribusi siswa dari pelatihan hingga Jepang"
                >
                  <TrendingUp size={16} style={{ color: 'var(--text-tertiary)' }} />
                </CardHeader>
                <CardBody>
                  <DonutChart
                    data={pipelineDonutData}
                    size={210}
                    thickness={26}
                    centerLabel="Total Siswa"
                    centerSubtext="Aktif di Pipeline"
                    onSliceClick={() => navigate('/student-journey')}
                  />
                  <div
                    style={{
                      marginTop: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={ArrowRight}
                      onClick={() => navigate('/student-journey')}
                      style={{ fontSize: '0.75rem' }}
                    >
                      Buka Papan Pipeline Lengkap
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Donut 2: Komposisi Program Siswa BMU */}
              <Card>
                <CardHeader
                  title="Komposisi Program BMU"
                  subtitle="Perbandingan Tokutei Ginou vs Magang"
                >
                  <Layers size={16} style={{ color: 'var(--text-tertiary)' }} />
                </CardHeader>
                <CardBody>
                  <DonutChart
                    data={programDonutData}
                    size={210}
                    thickness={26}
                    centerLabel="Total Siswa"
                    centerSubtext="Program Terdaftar"
                    onSliceClick={() => navigate('/students')}
                  />
                  <div
                    style={{
                      marginTop: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={ArrowRight}
                      onClick={() => navigate('/students')}
                      style={{ fontSize: '0.75rem' }}
                    >
                      Lihat Daftar Siswa Per Program
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Donut 3: Status Kelengkapan & Verifikasi Dokumen */}
              <Card>
                <CardHeader
                  title="Verifikasi Dokumen Berkas"
                  subtitle="Kesiapan administrasi paspor, KK, ijazah, dll."
                >
                  <FileCheck2 size={16} style={{ color: 'var(--text-tertiary)' }} />
                </CardHeader>
                <CardBody>
                  <DonutChart
                    data={docsDonutData}
                    size={210}
                    thickness={26}
                    centerLabel="Total Berkas"
                    centerSubtext="Semua Dokumen Siswa"
                    onSliceClick={() => navigate('/documents')}
                  />
                  <div
                    style={{
                      marginTop: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={ArrowRight}
                      onClick={() => navigate('/documents')}
                      style={{ fontSize: '0.75rem' }}
                    >
                      Buka Manajemen Dokumen
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Secondary Summary: Certifications Breakdown */}
          <div className="grid grid-cols-2 gap-4 md-grid-cols-1">
            {/* Certifications Overview */}
            <Card>
              <CardHeader
                title="Sertifikasi Bahasa &amp; Keahlian"
                subtitle="Jumlah sertifikat yang tersimpan pada database siswa"
              >
                <Award size={16} style={{ color: 'var(--text-tertiary)' }} />
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>JFT-Basic A2</span>
                    <span className="font-mono" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                      {stats.certsCount.jft}
                    </span>
                  </div>
                  <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>JLPT (N5 / N4 / N3 / N2 / N1)</span>
                    <span className="font-mono" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                      {stats.certsCount.jlpt}
                    </span>
                  </div>
                  <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sertifikat SSW (Tokutei Ginou)</span>
                    <span className="font-mono" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                      {stats.certsCount.ssw}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Quick Navigation / Information Card */}
            <Card>
              <CardHeader
                title="Alur Kesiapan Keberangkatan Siswa"
                subtitle="Tahapan standar keberangkatan kerja ke Jepang"
              >
                <Briefcase size={16} style={{ color: 'var(--text-tertiary)' }} />
              </CardHeader>
              <CardBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      1
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <strong>Pemberkasan:</strong> KTP, KK, Ijazah, MCU &amp; Paspor
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      2
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <strong>Menunggu Kontrak:</strong> Pengajuan kontrak ke Kaisha/Kumiai Jepang
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(249, 115, 22, 0.15)',
                        color: '#f97316',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: '1px solid rgba(249, 115, 22, 0.3)',
                      }}
                    >
                      3
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <strong>Sedang Menunggu COE:</strong> Pengurusan izin tinggal imigrasi Jepang
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      4
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      <strong>Siap Berangkat &amp; Terbang:</strong> Visa terbit &amp; jadwal penerbangan
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
