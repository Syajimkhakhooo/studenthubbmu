import React from 'react';
import { AlertTriangle, Database, Key, ShieldCheck, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../ui/Card';

export function SupabaseConfigAlert({ fullScreen = false }) {
  const content = (
    <Card style={{ maxWidth: '800px', margin: fullScreen ? '40px auto' : '0 0 24px 0', borderColor: 'var(--status-warning-border)' }}>
      <CardHeader
        title="Konfigurasi Supabase Diperlukan"
        subtitle="Aplikasi Student Hub BMU memerlukan koneksi ke proyek Supabase untuk menyimpan dan memproses data aktual."
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--status-warning-text)',
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          <AlertTriangle size={16} /> Belum Terhubung
        </span>
      </CardHeader>
      <CardBody>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Variabel lingkungan <code className="font-mono text-xs" style={{ background: 'var(--bg-surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>VITE_SUPABASE_URL</code> dan{' '}
          <code className="font-mono text-xs" style={{ background: 'var(--bg-surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>VITE_SUPABASE_ANON_KEY</code> belum diisi di file <code className="font-mono text-xs" style={{ background: 'var(--bg-surface-elevated)', padding: '2px 6px', borderRadius: '4px' }}>.env.local</code>. Sesuai prinsip produk, data palsu atau seeder tidak akan dibuat.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-primary)' }}>
              <Database size={16} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.875rem', marginBottom: '2px' }}>1. Buat / Buka Proyek Supabase</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                Buka <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'var(--text-primary)' }}>Supabase Dashboard <ExternalLink size={12} style={{ display: 'inline' }} /></a> dan buat project baru.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-primary)' }}>
              <Key size={16} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.875rem', marginBottom: '2px' }}>2. Atur Environment Variable di .env.local</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                Salin <code className="font-mono text-xs">.env.example</code> menjadi <code className="font-mono text-xs">.env.local</code> lalu isi URL dan anon key dari menu <strong>Project Settings &gt; API</strong>:
              </p>
              <pre
                className="font-mono text-xs"
                style={{
                  marginTop: '6px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                VITE_SUPABASE_URL=https://your-project.supabase.co{'\n'}
                VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
              </pre>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-primary)' }}>
              <ShieldCheck size={16} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.875rem', marginBottom: '2px' }}>3. Jalankan Migration SQL &amp; Allowlist</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                Buka menu <strong>SQL Editor</strong> di Supabase, jalankan skrip dari <code className="font-mono text-xs">supabase/migrations/20261016_initial_schema.sql</code>, dan masukkan email admin utama Anda ke tabel <code className="font-mono text-xs">internal_allowlist</code>.
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-app)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
