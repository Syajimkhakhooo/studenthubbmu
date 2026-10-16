import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, Lock, Cookie, Users } from 'lucide-react';

export function CookiePolicyModal({ isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kebijakan Privasi & Penggunaan Sesi"
      maxWidth="max-w-lg"
      footer={
        <Button variant="primary" onClick={onClose}>
          Saya Memahami
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-elevated)', height: 'fit-content' }}>
            <Cookie size={18} style={{ color: 'var(--text-primary)' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Cookie &amp; Sesi Esensial</h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Student Hub BMU hanya menggunakan penyimpanan sesi esensial resmi dari Supabase Auth untuk menjaga sesi masuk Anda tetap aman, memverifikasi hak akses internal, dan mencegah serangan CSRF.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-elevated)', height: 'fit-content' }}>
            <Lock size={18} style={{ color: 'var(--text-primary)' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Tanpa Pelacak atau Iklan Pihak Ketiga</h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Sistem ini tidak memuat skrip analitik komersial, cookie pemasaran, atau pelacak pihak ketiga. Seluruh transmisi data dilakukan secara privat untuk kepentingan operasional internal LPK BMU.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-elevated)', height: 'fit-content' }}>
            <Users size={18} style={{ color: 'var(--text-primary)' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Kerahasiaan Dokumen &amp; Data Siswa</h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Dokumen identitas, paspor, ijazah, dan informasi pribadi siswa tersimpan dalam storage privat terenkripsi. Pengguna dilarang menyebarluaskan data siswa kepada pihak yang tidak berhak.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-elevated)', height: 'fit-content' }}>
            <ShieldCheck size={18} style={{ color: 'var(--text-primary)' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.875rem', marginBottom: '4px' }}>Pengakhiran Sesi &amp; Bantuan Admin</h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Selalu lakukan <em>Logout</em> saat menggunakan perangkat bersama. Apabila membutuhkan pembaharuan akun atau pemulihan akses, silakan hubungi tim Administrator BMU.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
