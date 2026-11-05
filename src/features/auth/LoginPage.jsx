import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SupabaseConfigAlert } from '../../components/feedback/SupabaseConfigAlert';
import { CookiePolicyModal } from './CookiePolicyModal';
import { settingsService } from '../../services/settingsService';
import { Lock, Mail, User, Info, UserPlus, LogIn, Sun, Moon, ArrowLeft, Wrench } from 'lucide-react';

export function LoginPage() {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    requestPasswordReset,
    isSupabaseConfigured,
    user,
    profile,
    accessDenied,
  } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { error: toastError, success: toastSuccess, info: toastInfo } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [authMethod, setAuthMethod] = useState('google'); // 'google' as primary
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check maintenance mode
  React.useEffect(() => {
    let cancelled = false;
    async function checkMaintenance() {
      try {
        const isMaint = await settingsService.getMaintenanceMode();
        if (!cancelled) setMaintenanceMode(isMaint);
      } catch {
        // ignore
      }
    }
    checkMaintenance();
    return () => { cancelled = true; };
  }, []);

  // Forgot password
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showCookieModal, setShowCookieModal] = useState(false);

  // If already authenticated and active, redirect to destination
  React.useEffect(() => {
    if (user && !accessDenied) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, accessDenied, navigate, location]);

  async function handleGoogleLogin() {
    if (!isSupabaseConfigured) {
      toastError('Konfigurasi Supabase belum selesai. Periksa panduan di atas.');
      return;
    }

    try {
      setIsLoading(true);
      await loginWithGoogle();
    } catch (err) {
      toastError(err.message || 'Gagal memulai login Google');
      setIsLoading(false);
    }
  }

  async function handleEmailAuth(e) {
    e.preventDefault();
    if (!email || !password) {
      toastError('Harap masukkan email dan kata sandi.');
      return;
    }

    if (isRegisterMode) {
      if (password.length < 6) {
        toastError('Kata sandi minimal 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        toastError('Konfirmasi kata sandi tidak cocok.');
        return;
      }

      try {
        setIsLoading(true);
        const res = await registerWithEmail(email, password, fullName);
        if (res.session) {
          toastSuccess('Akun berhasil didaftarkan dan Anda langsung masuk!');
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        } else {
          toastSuccess('Pendaftaran berhasil! Silakan masuk dengan email dan kata sandi Anda.');
          setIsRegisterMode(false);
        }
      } catch (err) {
        toastError(err.message || 'Gagal mendaftar akun.');
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        setIsLoading(true);
        await loginWithEmail(email, password);
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } catch (err) {
        toastError(err.message || 'Login gagal. Periksa email atau password Anda.');
      } finally {
        setIsLoading(false);
      }
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    if (!forgotEmail) {
      toastError('Harap masukkan alamat email akun Anda.');
      return;
    }

    try {
      setIsLoading(true);
      await requestPasswordReset(forgotEmail);
      toastSuccess('Tautan pemulihan kata sandi telah dikirim ke email Anda.');
      setShowForgotModal(false);
      setForgotEmail('');
    } catch (err) {
      toastError(err.message || 'Gagal mengirim email reset kata sandi.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px 16px',
        position: 'relative',
      }}
    >
      {/* Floating Theme Switcher */}
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Beralih ke Tema Terang (Putih)' : 'Beralih ke Tema Gelap (Hitam)'}
          style={{
            color: 'var(--text-secondary)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all var(--transition-fast)',
          }}
        >
          {isDark ? (
            <>
              <Sun size={15} style={{ color: '#e3b341' }} />
              <span>Tema Terang</span>
            </>
          ) : (
            <>
              <Moon size={15} style={{ color: '#4f46e5' }} />
              <span>Tema Gelap</span>
            </>
          )}
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Supabase status warning if not yet configured */}
        {!isSupabaseConfigured && <SupabaseConfigAlert />}

        {/* Maintenance Alert Card on Login Page */}
        {maintenanceMode && (
          <div
            style={{
              marginBottom: '14px',
              padding: '12px 14px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <Wrench size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', display: 'block' }}>
                Website Sedang Dalam Pemeliharaan
              </strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block', lineHeight: 1.4 }}>
                Hanya akun <strong>Administrator</strong> yang diizinkan masuk saat ini.
              </span>
            </div>
          </div>
        )}

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px 22px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Header & Logo */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <img
              src="/logo.png"
              alt="Logo LPK BMU"
              style={{
                width: '44px',
                height: '44px',
                objectFit: 'contain',
                marginBottom: '8px',
                display: 'inline-block',
              }}
            />
            <h1 style={{ fontSize: '1.125rem', fontWeight: '700', letterSpacing: '-0.02em', margin: 0 }}>
              Student Hub BMU
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '3px', marginBottom: 0 }}>
              Pangkalan Data Siswa &amp; Operasional LPK BMU
            </p>
          </div>

          {/* Google Login as Primary Action */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading || !isSupabaseConfigured}
            style={{
              width: '100%',
              height: '40px',
              backgroundColor: 'var(--bg-surface-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: isSupabaseConfigured ? 'pointer' : 'not-allowed',
              opacity: isSupabaseConfigured ? 1 : 0.6,
              transition: 'all var(--transition-fast)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>{isLoading ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
          </button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              margin: '16px 0 14px',
              gap: '10px',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
              atau masuk dengan email
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            {isRegisterMode && (
              <Input
                label="Nama Lengkap Staf"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Hesti BMU"
                leadIcon={User}
                required
              />
            )}

            <Input
              label="Alamat Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@bmu.co.id atau nama@gmail.com"
              leadIcon={Mail}
              required
            />

            <Input
              label="Kata Sandi"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              leadIcon={Lock}
              required
            />

            {isRegisterMode && (
              <Input
                label="Konfirmasi Kata Sandi"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi"
                leadIcon={Lock}
                required
              />
            )}

            {!isRegisterMode && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Lupa kata sandi?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={!isSupabaseConfigured}
              className="w-full"
              style={{ width: '100%', height: '42px', marginTop: '4px' }}
              icon={isRegisterMode ? UserPlus : LogIn}
            >
              {isRegisterMode ? 'Daftar Akun Baru' : 'Masuk ke Student Hub'}
            </Button>

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                style={{
                  fontSize: '0.78125rem',
                  color: 'var(--text-secondary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                {isRegisterMode
                  ? 'Sudah memiliki akun? Masuk di sini'
                  : 'Belum memiliki akun? Daftar staf baru'}
              </button>
            </div>
          </form>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '18px',
              borderTop: '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => setShowCookieModal(true)}
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-tertiary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Info size={12} />
              <span>Privasi Sesi &amp; Informasi Cookie</span>
            </button>
          </div>
        </div>

        {/* Security watermark */}
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            textAlign: 'center',
            marginTop: '20px',
          }}
        >
          Sistem Akses Internal Khusus Tim BMU. Akses tanpa izin dilarang.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div
            className="modal-container max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="card-title">Pemulihan Kata Sandi</h3>
            </div>
            <form onSubmit={handleForgotPassword}>
              <div className="modal-body">
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Masukkan alamat email BMU Anda. Kami akan mengirimkan tautan resmi dari Supabase Auth untuk membuat kata sandi baru.
                </p>
                <Input
                  label="Email BMU"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="staf@bmu.co.id"
                  leadIcon={Mail}
                  required
                />
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setShowForgotModal(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" isLoading={isLoading}>
                  Kirim Tautan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cookie policy modal */}
      <CookiePolicyModal isOpen={showCookieModal} onClose={() => setShowCookieModal(false)} />
    </div>
  );
}
