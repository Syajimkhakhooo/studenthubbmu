import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Textarea } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { formatDate } from '../../../utils/formatters';
import { studentService } from '../../../services/studentService';
import { useToast } from '../../../hooks/useToast';
import { Briefcase, Plus, Trash2, Edit2 } from 'lucide-react';

export function TabWorkExperience({ student, onUpdate }) {
  const { success, error: toastError } = useToast();
  const [workList, setWorkList] = useState(student?.work_experiences || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    industry_sector: '',
    position: '',
    start_date: '',
    end_date: '',
    job_description: '',
  });

  const openAdd = () => {
    setEditingIdx(null);
    setFormData({
      company_name: '',
      industry_sector: '',
      position: '',
      start_date: '',
      end_date: '',
      job_description: '',
    });
    setIsModalOpen(true);
  };

  const openEdit = (item, idx) => {
    setEditingIdx(idx);
    setFormData({
      company_name: item.company_name || '',
      industry_sector: item.industry_sector || '',
      position: item.position || '',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      job_description: item.job_description || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.company_name) {
      toastError('Nama perusahaan wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      let updated;
      if (editingIdx !== null) {
        updated = [...workList];
        updated[editingIdx] = formData;
      } else {
        updated = [...workList, formData];
      }

      await studentService.saveWorkExperiences(student.id, updated);
      setWorkList(updated);
      success('Pengalaman kerja berhasil diperbarui.');
      setIsModalOpen(false);
      onUpdate?.();
    } catch (err) {
      toastError(err.message || 'Gagal menyimpan pengalaman kerja.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (idx) => {
    if (!window.confirm('Hapus pengalaman kerja ini?')) return;
    try {
      const updated = workList.filter((_, i) => i !== idx);
      await studentService.saveWorkExperiences(student.id, updated);
      setWorkList(updated);
      success('Pengalaman kerja berhasil dihapus.');
      onUpdate?.();
    } catch (err) {
      toastError('Gagal menghapus data.');
    }
  };

  return (
    <Card>
      <CardHeader
        title="Pengalaman Kerja Terdahulu"
        subtitle="Riwayat pekerjaan profesional di Indonesia atau luar negeri"
      >
        <Button variant="secondary" size="sm" icon={Plus} onClick={openAdd}>
          Tambah Pengalaman
        </Button>
      </CardHeader>
      <CardBody>
        {workList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-tertiary)' }}>
            <Briefcase size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p>Belum ada catatan pengalaman kerja (Fresh Graduate).</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {workList.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                      {item.company_name}
                    </strong>
                    {item.industry_sector && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {item.industry_sector}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Posisi: <strong>{item.position || '-'}</strong>  •  Periode: {formatDate(item.start_date)} s/d {item.end_date ? formatDate(item.end_date) : 'Sekarang'}
                  </div>
                  {item.job_description && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                      {item.job_description}
                    </p>
                  )}
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
        title={editingIdx !== null ? 'Edit Pengalaman Kerja' : 'Tambah Pengalaman Kerja'}
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
          <Input
            label="Nama Perusahaan"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="PT Sukses Makmur Indonesia"
            required
          />
          <Input
            label="Bidang / Sektor Industri"
            value={formData.industry_sector}
            onChange={(e) => setFormData({ ...formData, industry_sector: e.target.value })}
            placeholder="Manufaktur / Pertanian / Perhotelan"
          />
          <Input
            label="Jabatan / Posisi Kerja"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            placeholder="Operator Produksi"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tanggal Mulai"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
          <Textarea
            label="Deskripsi Tugas & Tanggung Jawab"
            value={formData.job_description}
            onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
            placeholder="Jelaskan ringkas pekerjaan yang dilakukan..."
            rows={2}
          />
        </form>
      </Modal>
    </Card>
  );
}
