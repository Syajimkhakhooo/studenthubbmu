import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { studentService } from '../../../services/studentService';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import { DollarSign, ShieldAlert, Plus, Trash2, Edit2 } from 'lucide-react';

export function TabFinances({ student, onUpdate }) {
  const { profile, isAdmin, isManager } = useAuth();
  const { success, error: toastError } = useToast();

  const isAuthorized = isAdmin || isManager;
  const [finances, setFinances] = useState(student?.student_finances || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fee_category: 'Biaya Pendaftaran',
    total_amount: '',
    paid_amount: '',
    payment_status: 'belum_bayar',
    payment_date: '',
    receipt_number: '',
    notes: '',
  });

  const categoryOptions = [
    'Biaya Pendaftaran',
    'Pelatihan Bahasa & Budaya',
    'Ujian Sertifikasi JFT/SSW',
    'Pemberkasan Dokumen & Terjemahan',
    'Medical Checkup (MCU)',
    'Pengurusan Visa & Paspor',
    'Tiket Penerbangan ke Jepang',
    'Biaya Operasional Lainnya',
  ];

  if (!isAuthorized) {
    return (
      <Card>
        <CardBody>
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
            <ShieldAlert size={40} style={{ margin: '0 auto 12px', color: 'var(--status-danger-text)' }} />
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>Akses Finansial Dibatasi</h4>
            <p style={{ fontSize: '0.8125rem', maxWidth: '420px', margin: '0 auto' }}>
              Data administrasi biaya siswa merupakan data sensitif yang hanya dapat dilihat dan dikelola oleh Administrator dan Manajer Operasional BMU.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const openAdd = () => {
    setEditingIdx(null);
    setFormData({
      fee_category: 'Biaya Pendaftaran',
      total_amount: '',
      paid_amount: '',
      payment_status: 'belum_bayar',
      payment_date: '',
      receipt_number: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEdit = (item, idx) => {
    setEditingIdx(idx);
    setFormData({
      fee_category: item.fee_category || 'Biaya Pendaftaran',
      total_amount: item.total_amount || '',
      paid_amount: item.paid_amount || '',
      payment_status: item.payment_status || 'belum_bayar',
      payment_date: item.payment_date || '',
      receipt_number: item.receipt_number || '',
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let updated;
      if (editingIdx !== null) {
        updated = [...finances];
        updated[editingIdx] = formData;
      } else {
        updated = [...finances, formData];
      }

      await studentService.saveFinances(student.id, updated, profile);
      setFinances(updated);
      success('Data administrasi biaya berhasil disimpan.');
      setIsModalOpen(false);
      onUpdate?.();
    } catch (err) {
      toastError(err.message || 'Gagal menyimpan data finansial.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (idx) => {
    if (!window.confirm('Hapus rincian biaya ini?')) return;
    try {
      const updated = finances.filter((_, i) => i !== idx);
      await studentService.saveFinances(student.id, updated, profile);
      setFinances(updated);
      success('Rincian biaya berhasil dihapus.');
      onUpdate?.();
    } catch (err) {
      toastError('Gagal menghapus data.');
    }
  };

  const totalBill = finances.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0);
  const totalPaid = finances.reduce((acc, curr) => acc + (parseFloat(curr.paid_amount) || 0), 0);
  const balance = totalBill - totalPaid;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Financial Summary */}
      <div className="grid grid-cols-3 gap-4 md-grid-cols-1">
        <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span className="text-xs text-subtle">Total Tagihan Biaya</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
            {formatCurrency(totalBill)}
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span className="text-xs text-subtle">Total Terbayar</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px', color: 'var(--status-success-text)' }}>
            {formatCurrency(totalPaid)}
          </div>
        </div>

        <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <span className="text-xs text-subtle">Sisa Tagihan (Kekurangan)</span>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px', color: balance > 0 ? 'var(--status-warning-text)' : 'var(--text-secondary)' }}>
            {formatCurrency(balance)}
          </div>
        </div>
      </div>

      {/* Financial Items Table */}
      <Card>
        <CardHeader
          title="Rincian Administrasi Biaya & Pembayaran"
          subtitle="Catatan pembayaran program siswa LPK BMU"
        >
          <Button variant="secondary" size="sm" icon={Plus} onClick={openAdd}>
            Tambah Tagihan / Biaya
          </Button>
        </CardHeader>
        <CardBody>
          {finances.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-tertiary)' }}>
              <DollarSign size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>Belum ada rincian tagihan atau pembayaran yang dicatat.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {finances.map((item, idx) => (
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.fee_category}</strong>
                      <Badge
                        variant={
                          item.payment_status === 'lunas'
                            ? 'success'
                            : item.payment_status === 'sebagian'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {item.payment_status === 'lunas'
                          ? 'Lunas'
                          : item.payment_status === 'sebagian'
                          ? 'Sebagian'
                          : 'Belum Bayar'}
                      </Badge>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Tagihan: {formatCurrency(item.total_amount)}  •  Terbayar: {formatCurrency(item.paid_amount)}
                      {item.receipt_number ? `  •  Kuitansi: ${item.receipt_number}` : ''}
                      {item.payment_date ? `  •  Tgl: ${formatDate(item.payment_date)}` : ''}
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
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIdx !== null ? 'Edit Catatan Biaya' : 'Tambah Catatan Biaya'}
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
            label="Kategori Biaya"
            value={formData.fee_category}
            onChange={(e) => setFormData({ ...formData, fee_category: e.target.value })}
            options={categoryOptions}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nominal Total Tagihan (Rp)"
              type="number"
              value={formData.total_amount}
              onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
              placeholder="5000000"
              required
            />
            <Input
              label="Nominal yang Sudah Dibayar (Rp)"
              type="number"
              value={formData.paid_amount}
              onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
              placeholder="5000000"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Status Pembayaran"
              value={formData.payment_status}
              onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
              options={[
                { value: 'belum_bayar', label: 'Belum Bayar' },
                { value: 'sebagian', label: 'Sebagian / Cicilan' },
                { value: 'lunas', label: 'Lunas Penuh' },
              ]}
            />
            <Input
              label="Tanggal Pembayaran"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
            />
          </div>
          <Input
            label="Nomor Kuitansi / Bukti Transfer"
            value={formData.receipt_number}
            onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
            placeholder="INV-BMU-2026-001"
          />
          <Textarea
            label="Catatan Keuangan"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Catatan tambahan..."
            rows={2}
          />
        </form>
      </Modal>
    </div>
  );
}
