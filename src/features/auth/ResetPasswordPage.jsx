import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Lock, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check if session / recovery token is present
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User arrived via password recovery link
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toastError('Harap isi kata sandi baru dan konfirmasinya.');
      return;
    }

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
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setIsSuccess(true);
      toastSuccess('Kata sandi berhasil diperbarui!');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      toastError(err.message || 'Gagal memperbarui kata sandi. Tautan mungkin telah kedaluwarsa.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          padding: '36px 32px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: isSuccess ? 'rgba(34, 197, 94, 0.12)' : 'rgba(59, 130, 246, 0.12)',
              border: `1px solid ${isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            {isSuccess ? (
              <CheckCircle2 size={28} style={{ color: '#22c55e' }} />
            ) : (
              <ShieldCheck size={28} style={{ color: 'var(--accent-primary)' }} />
            )}
          </div>

          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {isSuccess ? 'Kata Sandi Diperbarui' : 'Atur Ulang Kata Sandi'}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
            {isSuccess
              ? 'Kata sandi akun Anda telah berhasil diubah. Mengarahkan Anda ke halaman login...'
              : 'Silakan masukkan kata sandi baru untuk akun Student Hub BMU Anda.'}
          </p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Kata Sandi Baru"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              leadIcon={Lock}
              required
              autoFocus
            />

            <Input
              label="Konfirmasi Kata Sandi Baru"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi kata sandi baru"
              leadIcon={Lock}
              required
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              style={{ width: '100%', height: '42px', marginTop: '6px' }}
            >
              Simpan Kata Sandi Baru
            </Button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.8125rem',
                color: 'var(--text-tertiary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginTop: '8px',
              }}
            >
              <ArrowLeft size={14} /> Kembali ke Halaman Login
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <Button variant="secondary" onClick={() => navigate('/login')} style={{ width: '100%' }}>
              Masuk Sekarang
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

