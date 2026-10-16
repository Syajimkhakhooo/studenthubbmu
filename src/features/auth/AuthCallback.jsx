import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { Button } from '../../components/ui/Button';
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Key,
  Globe,
  RefreshCw,
} from 'lucide-react';

export function AuthCallback() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusMsg, setStatusMsg] = useState('Memverifikasi akun Google...');
  const [authError, setAuthError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Supabase callback URL that must be in Google Cloud Console
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const expectedGoogleRedirectUri = supabaseUrl
    ? `${supabaseUrl.replace(/\/$/, '')}/auth/v1/callback`
    : 'https://<project-ref>.supabase.co/auth/v1/callback';

  useEffect(() => {
    let isCancelled = false;

    async function handleAuth() {
      try {
        const url = window.location.href;
        const searchParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : window.location.hash;
        const hashParams = new URLSearchParams(hash);

        // 1. Check for OAuth error parameters from Supabase / Google
        const errorParam = searchParams.get('error') || hashParams.get('error');
        const errorCode = searchParams.get('error_code') || hashParams.get('error_code');
        const errorDesc =
          searchParams.get('error_description') || hashParams.get('error_description');

        if (errorParam || errorDesc) {
          console.error('OAuth Callback Error:', { errorParam, errorCode, errorDesc });
          if (!isCancelled) {
            setAuthError({
              error: errorParam || 'OAuth Error',
              code: errorCode || 'unknown',
              description:
                errorDesc ||
                'Terjadi kesalahan saat otorisasi pihak ketiga dengan Google OAuth.',
            });
          }
          return; // Stop immediately, do not timeout loop back to login
        }

        const hasCode = window.location.search.includes('code=');

        if (hasCode) {
          setStatusMsg('Menukar token otorisasi Google...');
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) {
            console.error('Code exchange error:', error);
            if (!isCancelled) {
              setAuthError({
                error: 'Exchange Failed',
                code: error.status || 'token_exchange_failed',
                description: error.message || 'Gagal menukar kode otorisasi.',
              });
            }
            return;
          }
        }

        // 2. Poll briefly until session is active
        let tries = 0;
        const checkSession = async () => {
          if (isCancelled) return;
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            setStatusMsg('Sesi aktif! Mengarahkan ke Beranda...');
            setTimeout(() => {
              if (!isCancelled) {
                navigate('/dashboard', { replace: true });
              }
            }, 300);
          } else if (tries < 15) {
            tries++;
            setTimeout(checkSession, 250);
          } else {
            // Timeout - no session found
            if (!isCancelled) {
              setAuthError({
                error: 'Session Timeout',
                code: 'no_session',
                description:
                  'Sesi login tidak terdeteksi setelah otorisasi Google. Kemungkinan token kadaluarsa atau kredensial OAuth belum sinkron.',
              });
            }
          }
        };

        checkSession();
      } catch (err) {
        console.error('Callback unexpected exception:', err);
        if (!isCancelled) {
          setAuthError({
            error: 'Unexpected Error',
            code: 'client_exception',
            description: err.message || 'Terjadi kesalahan sistem yang tidak terduga.',
          });
        }
      }
    }

    handleAuth();

    return () => {
      isCancelled = true;
    };
  }, [navigate]);

  const copyRedirectUri = () => {
    navigator.clipboard.writeText(expectedGoogleRedirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If there's an OAuth error, show rich diagnostic card
  if (authError) {
    const isExchangeError =
      authError.description?.toLowerCase().includes('exchange') ||
      authError.code === 'unexpected_failure';

    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-app)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '560px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            padding: '32px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '700', letterSpacing: '-0.01em' }}>
                Gagal Otorisasi Google OAuth
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                Kode Error: <code style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{authError.code}</code>
              </p>
            </div>
          </div>

          {/* Raw Error Banner */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              fontFamily: 'monospace',
              wordBreak: 'break-word',
              marginBottom: '20px',
              lineHeight: 1.5,
            }}
          >
            {authError.description}
          </div>

          {/* Diagnostic Guide */}
          <div style={{ marginBottom: '24px' }}>
            <h4
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-tertiary)',
                marginBottom: '12px',
              }}
            >
              Penyebab &amp; Solusi Perbaikan
            </h4>

            {isExchangeError ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Key size={14} /> 1. Client Secret di Supabase Dashboard
                  </div>
                  <p style={{ lineHeight: 1.5, margin: 0 }}>
                    Buka <strong>Supabase Dashboard &gt; Authentication &gt; Providers &gt; Google</strong>. Pastikan <strong>Client Secret</strong> yang dimasukkan sama persis dengan yang ada di Google Cloud Console (pastikan tidak ada spasi di awal atau akhir).
                  </p>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Globe size={14} /> 2. Authorized Redirect URI di Google Cloud
                  </div>
                  <p style={{ lineHeight: 1.5, marginBottom: '8px' }}>
                    Di <strong>Google Cloud Console &gt; Credentials &gt; OAuth 2.0 Client IDs</strong>, kolom <strong>Authorized redirect URIs</strong> harus diisi dengan URL callback Supabase ini (bukan localhost):
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'var(--bg-surface)',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <code style={{ fontSize: '0.75rem', flex: 1, wordBreak: 'break-all' }}>
                      {expectedGoogleRedirectUri}
                    </code>
                    <button
                      type="button"
                      onClick={copyRedirectUri}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                      <span>{copied ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-app)',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <ShieldAlert size={14} /> 3. Alternatif Langsung Masuk
                  </div>
                  <p style={{ lineHeight: 1.5, margin: 0 }}>
                    Anda juga dapat langsung masuk menggunakan tab <strong>Email &amp; Sandi</strong> di halaman login tanpa perlu menunggu konfigurasi Google Cloud selesai.
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Pastikan akun email Google Anda sudah terdaftar di daftar staf BMU dan koneksi internet stabil.
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '18px' }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/login', { replace: true })}
              icon={ArrowLeft}
            >
              Kembali ke Login
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setAuthError(null);
                window.location.href = '/login';
              }}
              icon={RefreshCw}
            >
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        gap: '16px',
        padding: '24px',
      }}
    >
      <div style={{ width: '320px' }}>
        <LoadingSkeleton lines={3} />
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        {statusMsg}
      </p>
    </div>
  );
}
