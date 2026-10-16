import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SupabaseConfigAlert } from '../../components/feedback/SupabaseConfigAlert';
import { CookiePolicyModal } from './CookiePolicyModal';
import { Lock, Mail, ShieldAlert, ArrowRight, Info } from 'lucide-react';

export function LoginPage() {
  const { loginWithGoogle, loginWithEmail, requestPasswordReset, isSupabaseConfigured, user, profile, accessDenied } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [authMethod, setAuthMethod] = useState('google'); // 'google' | 'email'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showCookieModal, setShowCookieModal] = useState(false);

  // If already authenticated and active, redirect to destination
  React.useEffect(() => {
    if (user && profile && !accessDenied) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, profile, accessDenied, navigate, location]);

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

  async function handleEmailLogin(e) {
    e.preventDefault();
    if (!email || !password) {
      toastError('Harap masukkan email dan kata sandi.');
      return;
    }

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
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Supabase status warning if not yet configured */}
        {!isSupabaseConfigured && <SupabaseConfigAlert />}

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 32px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header & Logo */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--text-inverse)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '1.125rem',
                marginBottom: '14px',
              }}
            >
              BMU
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
              Student Hub BMU
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Pangkalan Data Siswa &amp; Operasional LPK BMU
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              padding: '3px',
              marginBottom: '20px',
            }}
          >
            <button
              type="button"
              onClick={() => setAuthMethod('google')}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: authMethod === 'google' ? 'var(--bg-surface)' : 'transparent',
                color: authMethod === 'google' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: authMethod === 'google' ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              Google Workspace
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '0.8125rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: authMethod === 'email' ? 'var(--bg-surface)' : 'transparent',
                color: authMethod === 'email' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                boxShadow: authMethod === 'email' ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              Email &amp; Sandi
            </button>
          </div>

          {authMethod === 'google' ? (
            <div>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '18px',
                  textAlign: 'center',
                  lineHeight: '1.5',
                }}
              >
                Gunakan akun Google yang telah terdaftar dalam allowlist staf internal LPK BMU.
              </p>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading || !isSupabaseConfigured}
                style={{
                  width: '100%',
                  height: '44px',
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-text)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: isSupabaseConfigured ? 'pointer' : 'not-allowed',
                  opacity: isSupabaseConfigured ? 1 : 0.6,
                  transition: 'opacity var(--transition-fast)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>{isLoading ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Input
                label="Alamat Email BMU"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@bmu.co.id"
                leadIcon={Mail}
                required
              />

              <Input
                label="Kata Sandi"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leadIcon={Lock}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    textDecoration: 'underline',
                  }}
                >
                  Lupa kata sandi?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={!isSupabaseConfigured}
                className="w-full"
                style={{ width: '100%', height: '42px', marginTop: '6px' }}
              >
                Masuk ke Student Hub
              </Button>
            </form>
          )}

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
