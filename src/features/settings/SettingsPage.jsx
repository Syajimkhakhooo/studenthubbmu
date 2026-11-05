import React, { useState, useEffect, useCallback } from 'react';
import { settingsService } from '../../services/settingsService';
import { testSupabaseConnection, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { TableSkeleton } from '../../components/feedback/LoadingSkeleton';
import { ConfirmModal } from '../../components/feedback/ConfirmModal';
import { ROLE_LABELS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';
import { useTheme } from '../../hooks/useTheme';
import {
  Users,
  ShieldCheck,
  Activity,
  UserPlus,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  History,
  Key,
  Palette,
  Sun,
  Moon,
  Check,
  Wrench,
  Eye,
  Lock,
  Unlock,
} from 'lucide-react';

export function SettingsPage() {
  const { profile, isAdmin, isPrincipal } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('appearance');
  const [loading, setLoading] = useState(true);

  // Allowlist state
  const [allowlist, setAllowlist] = useState([]);
  const [isAddAllowlistOpen, setIsAddAllowlistOpen] = useState(false);
  const [allowlistForm, setAllowlistForm] = useState({
    email: '',
    default_role: 'sensei_staff',
    full_name: '',
    notes: '',
  });
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Profiles state
  const [profiles, setProfiles] = useState([]);
  const [editingProfile, setEditingProfile] = useState(null);
  const [newRole, setNewRole] = useState('sensei_staff');
  const [newIsActive, setNewIsActive] = useState(true);

  // Connection diagnostics
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);

  // Maintenance Mode state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [isConfirmMaintenanceOpen, setIsConfirmMaintenanceOpen] = useState(false);
  const [pendingMaintenanceState, setPendingMaintenanceState] = useState(false);

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'operational_manager', label: 'Manajer Operasional' },
    { value: 'principal', label: 'Kepala Sekolah' },
    { value: 'sensei_staff', label: 'Sensei / Staf Pengajar' },
    { value: 'viewer', label: 'Viewer (Hanya Lihat — Read-Only)' },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [al, pr, logs, maintMode] = await Promise.all([
        settingsService.getAllowlist(),
        settingsService.getProfiles(),
        settingsService.getAuditLogs(30),
        settingsService.getMaintenanceMode(),
      ]);
      setAllowlist(al);
      setProfiles(pr);
      setAuditLogs(logs);
      setMaintenanceMode(maintMode);
    } catch (err) {
      toastError('Gagal memuat pengaturan.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res = await testSupabaseConnection();
      setConnectionStatus(res);
      if (res.connected) {
        success('Koneksi ke Supabase aktif dan berhasil diverifikasi.');
      } else {
        toastError(res.message);
      }
    } catch (err) {
      setConnectionStatus({ connected: false, message: err.message });
      toastError('Uji koneksi gagal.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleAddAllowlist = async (e) => {
    e.preventDefault();
    if (!allowlistForm.email) {
      toastError('Email wajib diisi.');
      return;
    }

    try {
      await settingsService.addAllowlistEmail(allowlistForm, profile);
      success(`Email ${allowlistForm.email} berhasil ditambahkan ke allowlist.`);
      setIsAddAllowlistOpen(false);
      setAllowlistForm({ email: '', default_role: 'sensei_staff', full_name: '', notes: '' });
      fetchData();
    } catch (err) {
      toastError(err.message || 'Gagal menambahkan email ke allowlist.');
    }
  };

  const handleDeleteAllowlist = async () => {
    if (!deleteTarget) return;
    try {
      await settingsService.deleteAllowlistEmail(deleteTarget.id, deleteTarget.email, profile);
      success(`Email ${deleteTarget.email} berhasil dihapus dari allowlist.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toastError('Gagal menghapus allowlist.');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editingProfile) return;

    try {
      await settingsService.updateProfile(
        editingProfile.id,
        { role: newRole, is_active: newIsActive },
        profile
      );
      success('Peran pengguna berhasil diperbarui.');
      setEditingProfile(null);
      fetchData();
    } catch (err) {
      toastError(err.message || 'Gagal memperbarui peran.');
    }
  };

  // Handle maintenance mode toggle (with confirmation)
  const requestToggleMaintenance = (targetState) => {
    setPendingMaintenanceState(targetState);
    setIsConfirmMaintenanceOpen(true);
  };

  const confirmToggleMaintenance = async () => {
    setMaintenanceLoading(true);
    setIsConfirmMaintenanceOpen(false);
    try {
      await settingsService.setMaintenanceMode(pendingMaintenanceState, profile);
      setMaintenanceMode(pendingMaintenanceState);
      if (pendingMaintenanceState) {
        success('Mode Pemeliharaan AKTIF — Sistem dikunci untuk pengguna non-admin.');
      } else {
        success('Mode Pemeliharaan NONAKTIF — Sistem kembali normal untuk semua pengguna.');
      }
    } catch (err) {
      toastError(err.message || 'Gagal mengubah mode pemeliharaan.');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const tabsConfig = [
    { id: 'appearance', label: 'Tema & Tampilan', icon: Palette },
    { id: 'allowlist', label: 'Allowlist Email Internal', icon: Key, count: allowlist.length },
    { id: 'users', label: 'Pengguna Terdaftar & Peran', icon: Users, count: profiles.length },
    { id: 'maintenance', label: 'Mode Pemeliharaan', icon: Wrench },
    { id: 'diagnostics', label: 'Koneksi & Status Sistem', icon: Activity },
    { id: 'logs', label: 'Audit Log Perubahan', icon: History, count: auditLogs.length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Pengguna &amp; Pengaturan Sistem</h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Manajemen allowlist Google OAuth, hak akses role internal, status Supabase, audit log, dan mode pemeliharaan
        </p>
      </div>

      {/* Maintenance Mode Banner — shown when active */}
      {maintenanceMode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 20px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <Wrench size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#ef4444', fontSize: '0.875rem' }}>Mode Pemeliharaan Aktif</strong>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Pengguna non-admin (viewer, sensei_staff, dll.) tidak dapat mengakses atau mengubah data saat ini.
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={Unlock}
            onClick={() => requestToggleMaintenance(false)}
            isLoading={maintenanceLoading}
          >
            Nonaktifkan
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* TAB 0: Appearance / Theme */}
      {activeTab === 'appearance' && (
        <Card>
          <CardHeader
            title="Preferensi Tema & Tampilan Antarmuka"
            subtitle="Pilih tema tampilan yang paling nyaman untuk operasional harian Anda di LPK BMU"
          />
          <CardBody>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Option 1: Tema Gelap (Dark Mode) */}
              <div
                onClick={() => setTheme('dark')}
                style={{
                  border: isDark ? '2px solid var(--text-primary)' : '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '20px',
                  backgroundColor: isDark ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all var(--transition-fast)',
                  boxShadow: isDark ? 'var(--shadow-md)' : 'none',
                }}
              >
                {isDark && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--accent-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={14} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#15181c',
                      color: '#e3b341',
                      border: '1px solid #2d333b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Moon size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Tema Gelap (Dark Mode)</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Hitam pekat / Startup SaaS</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                  Nuansa karbon gelap elegan, mengurangi ketegangan mata saat bekerja di ruangan redup atau malam hari.
                </p>

                {/* Visual miniature preview */}
                <div
                  style={{
                    backgroundColor: '#0b0c0e',
                    border: '1px solid #21262d',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ height: '8px', width: '40%', backgroundColor: '#2d333b', borderRadius: '4px' }} />
                  <div style={{ height: '18px', width: '100%', backgroundColor: '#121417', borderRadius: '4px', border: '1px solid #21262d' }} />
                  <div style={{ height: '18px', width: '100%', backgroundColor: '#121417', borderRadius: '4px', border: '1px solid #21262d' }} />
                </div>
              </div>

              {/* Option 2: Tema Terang (Light Mode) */}
              <div
                onClick={() => setTheme('light')}
                style={{
                  border: !isDark ? '2px solid var(--text-primary)' : '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '20px',
                  backgroundColor: !isDark ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all var(--transition-fast)',
                  boxShadow: !isDark ? 'var(--shadow-md)' : 'none',
                }}
              >
                {!isDark && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--accent-text)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={14} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: '#f8fafc',
                      color: '#d97706',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sun size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Tema Terang (Light Mode)</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Putih bersih / Kontras tinggi</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                  Latar belakang putih bersih dan terang, memudahkan pencetakan dan keterbacaan data di siang hari.
                </p>

                {/* Visual miniature preview */}
                <div
                  style={{
                    backgroundColor: '#f4f6f8',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ height: '8px', width: '40%', backgroundColor: '#cbd5e1', borderRadius: '4px' }} />
                  <div style={{ height: '18px', width: '100%', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                  <div style={{ height: '18px', width: '100%', backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* TAB 1: Allowlist */}
      {activeTab === 'allowlist' && (
        <Card>
          <CardHeader
            title="Daftar Email yang Diizinkan (Internal Allowlist)"
            subtitle="Hanya akun Google dengan email di bawah ini yang dapat login ke aplikasi Student Hub BMU"
          >
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                icon={UserPlus}
                onClick={() => setIsAddAllowlistOpen(true)}
              >
                Tambah Email ke Allowlist
              </Button>
            )}
          </CardHeader>
          <CardBody>
            {loading ? (
              <TableSkeleton rows={4} cols={4} />
            ) : allowlist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-tertiary)' }}>
                <Key size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p>Belum ada email di dalam daftar allowlist.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {allowlist.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="font-mono text-sm" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.email}
                        </span>
                        <Badge variant={item.default_role === 'viewer' ? 'warning' : 'neutral'}>
                          Peran Awal: {ROLE_LABELS[item.default_role] || item.default_role}
                        </Badge>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {item.full_name ? `Pemilik: ${item.full_name}  •  ` : ''}
                        {item.notes ? `Catatan: ${item.notes}  •  ` : ''}
                        Didaftarkan: {formatDateTime(item.created_at)}
                      </div>
                    </div>

                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => setDeleteTarget(item)}
                        title="Hapus dari Allowlist"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* TAB 2: Users & Roles */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader
            title="Daftar Pengguna Terdaftar"
            subtitle="Pengguna yang telah berhasil melakukan login dan memiliki profil di database"
          />
          <CardBody>
            {loading ? (
              <TableSkeleton rows={4} cols={4} />
            ) : profiles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-tertiary)' }}>
                <Users size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p>Belum ada profil pengguna terdaftar.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {p.full_name || p.email}
                        </strong>
                        <Badge variant={p.role === 'admin' ? 'info' : p.role === 'viewer' ? 'warning' : 'neutral'}>
                          {ROLE_LABELS[p.role] || p.role}
                        </Badge>
                        <Badge variant={p.is_active ? 'success' : 'danger'}>
                          {p.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Email: {p.email}  •  Terdaftar: {formatDateTime(p.created_at)}
                      </div>
                    </div>

                    {isAdmin && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Edit2}
                        onClick={() => {
                          setEditingProfile(p);
                          setNewRole(p.role);
                          setNewIsActive(p.is_active);
                        }}
                      >
                        Ubah Hak Akses
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Viewer Role Info */}
            <div
              style={{
                marginTop: '20px',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-surface-elevated)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Eye size={16} style={{ color: 'var(--text-tertiary)' }} />
                <strong style={{ fontSize: '0.875rem' }}>Tentang Akun Viewer (Hanya Lihat)</strong>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Role <strong>Viewer</strong> memberikan akses <em>read-only</em> — pengguna dapat melihat data siswa,
                laporan, dan dashboard, namun tidak bisa menambah, mengubah, atau menghapus data apapun.
                Cocok untuk keperluan monitoring eksternal atau tamu staf sementara.
                Tambahkan email viewer ke Allowlist dengan role <em>Viewer (Hanya Lihat)</em>.
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* TAB 3: Maintenance Mode */}
      {activeTab === 'maintenance' && (
        <Card>
          <CardHeader
            title="Mode Pemeliharaan Sistem"
            subtitle="Blokir akses pengguna non-admin sementara saat proses input data massal atau migrasi"
          />
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Current Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${maintenanceMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                backgroundColor: maintenanceMode
                  ? 'rgba(239, 68, 68, 0.06)'
                  : 'rgba(16, 185, 129, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {maintenanceMode ? (
                  <Lock size={28} style={{ color: '#ef4444' }} />
                ) : (
                  <Unlock size={28} style={{ color: '#10b981' }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {maintenanceMode ? 'Mode Pemeliharaan: AKTIF' : 'Mode Pemeliharaan: NONAKTIF'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {maintenanceMode
                      ? 'Sistem sedang dikunci. Hanya admin yang bisa mengakses. Pengguna lain akan melihat halaman pemeliharaan.'
                      : 'Sistem berjalan normal. Semua pengguna aktif dapat mengakses sesuai perannya.'}
                  </div>
                </div>
              </div>

              {isAdmin && (
                <Button
                  variant={maintenanceMode ? 'outline' : 'primary'}
                  icon={maintenanceMode ? Unlock : Lock}
                  onClick={() => requestToggleMaintenance(!maintenanceMode)}
                  isLoading={maintenanceLoading}
                  style={{
                    borderColor: maintenanceMode ? '#ef4444' : undefined,
                    color: maintenanceMode ? '#ef4444' : undefined,
                    flexShrink: 0,
                  }}
                >
                  {maintenanceMode ? 'Nonaktifkan Pemeliharaan' : 'Aktifkan Mode Pemeliharaan'}
                </Button>
              )}
            </div>

            {/* Explanation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Cara Kerja Mode Pemeliharaan</h4>
              {[
                {
                  icon: Lock,
                  title: 'Mengaktifkan Mode Pemeliharaan',
                  desc: 'Semua pengguna selain Administrator akan melihat halaman "Sistem Sedang Pemeliharaan" dan tidak bisa mengakses data. Admin tetap dapat login dan mengelola sistem.',
                },
                {
                  icon: Users,
                  title: 'Kapan Digunakan?',
                  desc: 'Gunakan saat melakukan impor data massal dari spreadsheet, perubahan skema database, atau saat staf admin perlu menginput data baru tanpa gangguan dari pengguna lain.',
                },
                {
                  icon: Unlock,
                  title: 'Menonaktifkan Mode Pemeliharaan',
                  desc: 'Klik "Nonaktifkan Pemeliharaan" untuk mengembalikan akses normal ke semua pengguna. Perubahan berlaku segera secara realtime.',
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '14px',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface-elevated)',
                    }}
                  >
                    <Icon size={18} style={{ color: 'var(--text-tertiary)', marginTop: '1px', flexShrink: 0 }} />
                    <div>
                      <strong style={{ fontSize: '0.875rem' }}>{item.title}</strong>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {!isAdmin && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.8125rem',
                  color: 'var(--text-tertiary)',
                }}
              >
                Hanya Administrator yang dapat mengaktifkan atau menonaktifkan Mode Pemeliharaan.
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* TAB 4: Diagnostics */}
      {activeTab === 'diagnostics' && (
        <Card>
          <CardHeader
            title="Diagnostik Sistem & Koneksi Supabase"
            subtitle="Pemeriksaan status environment variables, database, dan private storage"
          >
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              isLoading={testingConnection}
              onClick={handleTestConnection}
            >
              Uji Koneksi Ulang
            </Button>
          </CardHeader>
          <CardBody style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.875rem' }}>Environment Variables (.env.local)</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  VITE_SUPABASE_URL &amp; VITE_SUPABASE_ANON_KEY
                </div>
              </div>
              <Badge variant={isSupabaseConfigured ? 'success' : 'warning'}>
                {isSupabaseConfigured ? 'Terkonfigurasi' : 'Belum Dikonfigurasi'}
              </Badge>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.875rem' }}>Koneksi Database PostgreSQL</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {connectionStatus ? connectionStatus.message : 'Klik "Uji Koneksi Ulang" untuk verifikasi status'}
                </div>
              </div>
              <Badge
                variant={
                  connectionStatus?.connected
                    ? 'success'
                    : connectionStatus
                    ? 'danger'
                    : 'neutral'
                }
              >
                {connectionStatus?.connected ? 'Terhubung' : connectionStatus ? 'Gagal' : 'Belum Diuji'}
              </Badge>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.875rem' }}>Private Storage Bucket</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Bucket <code>student-documents</code> (Akses lewat signed URL)
                </div>
              </div>
              <Badge variant="neutral">Private Mode</Badge>
            </div>
          </CardBody>
        </Card>
      )}

      {/* TAB 5: Audit Logs */}
      {activeTab === 'logs' && (
        <Card>
          <CardHeader
            title="Catatan Audit Sistem (Audit Log)"
            subtitle="Riwayat aktivitas dan perubahan data penting yang dilakukan oleh pengguna"
          />
          <CardBody>
            {loading ? (
              <TableSkeleton rows={5} cols={4} />
            ) : auditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-tertiary)' }}>
                <History size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p>Belum ada catatan audit log yang terekam.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      fontSize: '0.8125rem',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          className="font-mono text-xs"
                          style={{
                            padding: '1px 5px',
                            backgroundColor: 'var(--bg-app)',
                            borderRadius: '3px',
                            fontWeight: 600,
                          }}
                        >
                          {log.action}
                        </span>
                        <strong style={{ color: 'var(--text-primary)' }}>{log.actor_email}</strong>
                      </div>
                      <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {log.change_summary}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Add Allowlist Modal */}
      {isAddAllowlistOpen && (
        <Modal
          isOpen={isAddAllowlistOpen}
          onClose={() => setIsAddAllowlistOpen(false)}
          title="Tambah Email Google ke Allowlist Internal"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAddAllowlistOpen(false)}>
                Batal
              </Button>
              <Button variant="primary" onClick={handleAddAllowlist}>
                Simpan ke Allowlist
              </Button>
            </>
          }
        >
          <form onSubmit={handleAddAllowlist} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="Alamat Email Google / Gmail"
              type="email"
              value={allowlistForm.email}
              onChange={(e) => setAllowlistForm({ ...allowlistForm, email: e.target.value })}
              placeholder="nama.staf@gmail.com"
              required
            />
            <Input
              label="Nama Lengkap Staf"
              value={allowlistForm.full_name}
              onChange={(e) => setAllowlistForm({ ...allowlistForm, full_name: e.target.value })}
              placeholder="Contoh: Budi Santoso"
            />
            <Select
              label="Peran Default (Role)"
              value={allowlistForm.default_role}
              onChange={(e) => setAllowlistForm({ ...allowlistForm, default_role: e.target.value })}
              options={roleOptions}
              required
            />
            <Input
              label="Catatan Internal"
              value={allowlistForm.notes}
              onChange={(e) => setAllowlistForm({ ...allowlistForm, notes: e.target.value })}
              placeholder="Misal: Sensei kelas bahasa intensif"
            />
          </form>
        </Modal>
      )}

      {/* Edit Profile Role Modal */}
      {editingProfile && (
        <Modal
          isOpen={Boolean(editingProfile)}
          onClose={() => setEditingProfile(null)}
          title={`Ubah Hak Akses: ${editingProfile.full_name || editingProfile.email}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setEditingProfile(null)}>
                Batal
              </Button>
              <Button variant="primary" onClick={handleUpdateProfile}>
                Simpan Peran
              </Button>
            </>
          }
        >
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Select
              label="Peran Pengguna (Role)"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              options={roleOptions}
              required
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
              <input
                type="checkbox"
                checked={newIsActive}
                onChange={(e) => setNewIsActive(e.target.checked)}
              />
              <span>Akun Aktif (Dapat Mengakses Sistem)</span>
            </label>
          </form>
        </Modal>
      )}

      {/* Delete Allowlist Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteAllowlist}
        title="Hapus dari Allowlist"
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.email}" dari daftar allowlist? Pengguna ini tidak akan bisa login ke aplikasi lagi.`}
        confirmText="Ya, Hapus"
        variant="danger"
      />

      {/* Maintenance Mode Confirmation */}
      <ConfirmModal
        isOpen={isConfirmMaintenanceOpen}
        onClose={() => setIsConfirmMaintenanceOpen(false)}
        onConfirm={confirmToggleMaintenance}
        title={pendingMaintenanceState ? 'Aktifkan Mode Pemeliharaan?' : 'Nonaktifkan Mode Pemeliharaan?'}
        message={
          pendingMaintenanceState
            ? 'Mengaktifkan Mode Pemeliharaan akan memblokir akses semua pengguna non-admin (viewer, sensei_staff, dll.) dari sistem. Hanya Administrator yang dapat masuk. Lanjutkan?'
            : 'Menonaktifkan Mode Pemeliharaan akan memulihkan akses normal untuk semua pengguna. Pastikan proses input data sudah selesai. Lanjutkan?'
        }
        confirmText={pendingMaintenanceState ? 'Ya, Aktifkan Pemeliharaan' : 'Ya, Buka Kembali Akses'}
        variant={pendingMaintenanceState ? 'danger' : 'default'}
      />
    </div>
  );
}
