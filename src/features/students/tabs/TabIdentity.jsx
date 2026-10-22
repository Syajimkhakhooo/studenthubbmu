import React from 'react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { formatDate, calculateAge } from '../../../utils/formatters';
import { User, Phone, Mail, MapPin, AlertCircle, Calendar } from 'lucide-react';

export function TabIdentity({ student }) {
  if (!student) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Basic Demographics */}
      <Card>
        <CardHeader title="Identitas Pokok & Pendaftaran" />
        <CardBody>
          <div className="grid grid-cols-3 gap-4 md-grid-cols-1">
            <div>
              <span className="text-xs text-subtle">Nomor ID Siswa</span>
              <div className="font-mono font-bold" style={{ marginTop: '2px', color: 'var(--text-primary)' }}>
                {student.student_id_number}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Nama Lengkap Sesuai KTP</span>
              <div style={{ fontWeight: 600, marginTop: '2px', color: 'var(--text-primary)' }}>
                {student.full_name}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Nama Panggilan</span>
              <div style={{ marginTop: '2px', color: 'var(--text-primary)' }}>
                {student.nickname || '-'}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Jenis Kelamin</span>
              <div style={{ marginTop: '2px', color: 'var(--text-primary)' }}>
                {student.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Tempat, Tanggal Lahir</span>
              <div style={{ marginTop: '2px', color: 'var(--text-primary)' }}>
                {student.birth_place || '-'}, {formatDate(student.birth_date)} ({calculateAge(student.birth_date)} tahun)
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Agama</span>
              <div style={{ marginTop: '2px', color: 'var(--text-primary)' }}>
                {student.religion || '-'}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Status Pernikahan</span>
              <div style={{ marginTop: '2px', color: 'var(--text-primary)' }}>
                {student.marital_status || 'Belum Menikah'}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Tanggal Masuk LPK BMU</span>
              <div style={{ marginTop: '2px', color: 'var(--text-primary)' }}>
                {formatDate(student.entry_date)}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Program BMU</span>
              <div style={{ marginTop: '2px', color: 'var(--text-primary)', fontWeight: 600 }}>
                {student.program_type}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Contact & Domicile */}
      <Card>
        <CardHeader title="Kontak & Domisili" />
        <CardBody>
          <div className="grid grid-cols-2 gap-4 md-grid-cols-1">
            <div>
              <span className="text-xs text-subtle">Nomor Telepon / WhatsApp Siswa</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <Phone size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span>{student.phone_number || '-'}</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Alamat Email</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <Mail size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span>{student.email || '-'}</span>
              </div>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <span className="text-xs text-subtle">Alamat Domisili Sekarang</span>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
                <MapPin size={14} style={{ color: 'var(--text-tertiary)', marginTop: '2px', flexShrink: 0 }} />
                <span>{student.domicile_address || '-'}</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader title="Kontak Darurat (Orang Tua / Wali)" />
        <CardBody>
          <div className="grid grid-cols-3 gap-4 md-grid-cols-1">
            <div>
              <span className="text-xs text-subtle">Nama Kontak Darurat</span>
              <div style={{ marginTop: '2px', fontWeight: 500 }}>
                {student.emergency_contact_name || '-'}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Hubungan Keluarga</span>
              <div style={{ marginTop: '2px' }}>
                {student.emergency_contact_relation || '-'}
              </div>
            </div>

            <div>
              <span className="text-xs text-subtle">Nomor Telepon Darurat</span>
              <div style={{ marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                {student.emergency_contact_phone || '-'}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
