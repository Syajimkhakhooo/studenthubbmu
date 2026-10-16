import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { studentService } from '../../../services/studentService';
import { useToast } from '../../../hooks/useToast';
import { Users, Plus, Trash2, Edit2 } from 'lucide-react';

export function TabFamily({ student, onUpdate }) {
  const { success, error: toastError } = useToast();
  const [familyList, setFamilyList] = useState(student?.family_members || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    relation: 'Ayah',
    full_name: '',
    age: '',
    occupation: '',
    phone_number: '',
  });

  const relationOptions = ['Ayah', 'Ibu', 'Kakak', 'Adik', 'Pasangan (Suami/Istri)', 'Anak', 'Wali'];

  const openAdd = () => {
    setEditingIdx(null);
    setFormData({
      relation: 'Ayah',
      full_name: '',
      age: '',
      occupation: '',
      phone_number: '',
    });
    setIsModalOpen(true);
  };

  const openEdit = (item, idx) => {
    setEditingIdx(idx);
    setFormData({
      relation: item.relation || 'Ayah',
      full_name: item.full_name || '',
      age: item.age || '',
      occupation: item.occupation || '',
      phone_number: item.phone_number || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.full_name) {
      toastError('Nama anggota keluarga wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      let updated;
      if (editingIdx !== null) {
        updated = [...familyList];
        updated[editingIdx] = formData;
      } else {
        updated = [...familyList, formData];
      }

      await studentService.saveFamilyMembers(student.id, updated);
      setFamilyList(updated);
      success('Data keluarga berhasil disimpan.');
      setIsModalOpen(false);
      onUpdate?.();
    } catch (err) {
      toastError(err.message || 'Gagal menyimpan data keluarga.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (idx) => {
    if (!window.confirm('Hapus anggota keluarga ini?')) return;
    try {
      const updated = familyList.filter((_, i) => i !== idx);
      await studentService.saveFamilyMembers(student.id, updated);
      setFamilyList(updated);
      success('Anggota keluarga berhasil dihapus.');
      onUpdate?.();
    } catch (err) {
      toastError('Gagal menghapus data.');
    }
  };

  return (
    <Card>
      <CardHeader
        title="Susunan Anggota Keluarga"
        subtitle="Data orang tua, saudara kandung, atau tanggungan keluarga siswa"
      >
        <Button variant="secondary" size="sm" icon={Plus} onClick={openAdd}>
          Tambah Anggota
        </Button>
      </CardHeader>
      <CardBody>
        {familyList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-tertiary)' }}>
            <Users size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p>Belum ada data anggota keluarga yang dicatat.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {familyList.map((item, idx) => (
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
                      {item.relation}
                    </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{item.full_name}</strong>
                    {item.age && (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                        ({item.age} tahun)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Pekerjaan: <strong>{item.occupation || '-'}</strong>
                    {item.phone_number ? `  •  No. HP: ${item.phone_number}` : ''}
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
        title={editingIdx !== null ? 'Edit Anggota Keluarga' : 'Tambah Anggota Keluarga'}
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
            label="Hubungan Keluarga"
            value={formData.relation}
            onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
            options={relationOptions}
            required
          />
          <Input
            label="Nama Lengkap"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Nama lengkap anggota keluarga"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Usia (Tahun)"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="52"
            />
            <Input
              label="Pekerjaan"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              placeholder="Wiraswasta / Petani / dll."
            />
          </div>
          <Input
            label="Nomor Telepon / WhatsApp (Opsional)"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            placeholder="081234567890"
          />
        </form>
      </Modal>
    </Card>
  );
}
