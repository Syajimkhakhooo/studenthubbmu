import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { studentService } from '../../../services/studentService';
import { useToast } from '../../../hooks/useToast';
import { GraduationCap, Plus, Trash2, Edit2 } from 'lucide-react';

export function TabEducation({ student, onUpdate }) {
  const { success, error: toastError } = useToast();
  const [eduList, setEduList] = useState(student?.education_histories || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    level: 'SMA/SMK',
    institution_name: '',
    major: '',
    start_year: '',
    end_year: '',
    is_graduated: true,
  });

  const levelOptions = ['SD', 'SMP', 'SMA/SMK', 'D3', 'D4/S1', 'S2', 'Kursus / Pelatihan'];

  const openAdd = () => {
    setEditingIdx(null);
    setFormData({
      level: 'SMA/SMK',
      institution_name: '',
      major: '',
      start_year: '',
      end_year: '',
      is_graduated: true,
    });
    setIsModalOpen(true);
  };

  const openEdit = (item, idx) => {
    setEditingIdx(idx);
    setFormData({
      level: item.level || 'SMA/SMK',
      institution_name: item.institution_name || '',
      major: item.major || '',
      start_year: item.start_year || '',
      end_year: item.end_year || '',
      is_graduated: item.is_graduated !== false,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.institution_name) {
      toastError('Nama institusi/sekolah wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      let updated;
      if (editingIdx !== null) {
        updated = [...eduList];
        updated[editingIdx] = formData;
      } else {
        updated = [...eduList, formData];
      }

      await studentService.saveEducation(student.id, updated);
      setEduList(updated);
      success('Riwayat pendidikan berhasil diperbarui.');
      setIsModalOpen(false);
      onUpdate?.();
    } catch (err) {
      toastError(err.message || 'Gagal menyimpan riwayat pendidikan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (idx) => {
    if (!window.confirm('Hapus riwayat pendidikan ini?')) return;
    try {
      const updated = eduList.filter((_, i) => i !== idx);
      await studentService.saveEducation(student.id, updated);
      setEduList(updated);
      success('Riwayat pendidikan berhasil dihapus.');
      onUpdate?.();
    } catch (err) {
      toastError('Gagal menghapus data.');
    }
  };

  return (
    <Card>
      <CardHeader
        title="Riwayat Pendidikan Siswa"
        subtitle="Jenjang pendidikan formal dan non-formal yang pernah ditempuh"
      >
        <Button variant="secondary" size="sm" icon={Plus} onClick={openAdd}>
          Tambah Pendidikan
        </Button>
      </CardHeader>
      <CardBody>
        {eduList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-tertiary)' }}>
            <GraduationCap size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p>Belum ada data riwayat pendidikan yang dicatat.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {eduList.map((item, idx) => (
              <div
                key={idx}
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
                    <span
                      style={{
                        padding: '2px 8px',
                        backgroundColor: 'var(--bg-app)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {item.level}
                    </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{item.institution_name}</strong>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {item.major ? `Jurusan: ${item.major}  •  ` : ''}
                    Tahun: {item.start_year || '?'} - {item.end_year || 'Sekarang'}
                    {item.is_graduated ? ' (Lulus)' : ' (Tidak Lulus)'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <Button variant="ghost" size="sm" icon={Edit2} onClick={() => openEdit(item, idx)} />
                  <Button variant="ghost" size="sm" icon={Trash2} onClick={() => handleDelete(idx)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIdx !== null ? 'Edit Riwayat Pendidikan' : 'Tambah Riwayat Pendidikan'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleSave} isLoading={isLoading}>
              Simpan
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Select
            label="Jenjang Pendidikan"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            options={levelOptions}
            required
          />
          <Input
            label="Nama Sekolah / Institusi"
            value={formData.institution_name}
            onChange={(e) => setFormData({ ...formData, institution_name: e.target.value })}
            placeholder="SMK Negeri 1 Surabaya"
            required
          />
          <Input
            label="Jurusan / Program Studi"
            value={formData.major}
            onChange={(e) => setFormData({ ...formData, major: e.target.value })}
            placeholder="Teknik Mesin / Tata Boga / dll."
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tahun Masuk"
              type="number"
              value={formData.start_year}
              onChange={(e) => setFormData({ ...formData, start_year: e.target.value })}
              placeholder="2018"
            />
            <Input
              label="Tahun Lulus"
              type="number"
              value={formData.end_year}
              onChange={(e) => setFormData({ ...formData, end_year: e.target.value })}
              placeholder="2021"
            />
          </div>
        </form>
      </Modal>
    </Card>
  );
}
