import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import { StudentFormModal } from './StudentFormModal';
import { TabIdentity } from './tabs/TabIdentity';
import { TabEducation } from './tabs/TabEducation';
import { TabLanguageCert } from './tabs/TabLanguageCert';
import { TabWorkExperience } from './tabs/TabWorkExperience';
import { TabPersonalProfile } from './tabs/TabPersonalProfile';
import { TabFamily } from './tabs/TabFamily';
import { TabDocuments } from './tabs/TabDocuments';
import { TabJourneyStatus } from './tabs/TabJourneyStatus';
import { TabFinances } from './tabs/TabFinances';
import {
  getLearningStatusMeta,
  getJobSelectionMeta,
  getDepartureStatusMeta,
} from '../../utils/formatters';
import {
  ArrowLeft,
  Edit2,
  User,
  GraduationCap,
  Award,
  Briefcase,
  Activity,
  Users,
  FileCheck2,
  Route,
  DollarSign,
} from 'lucide-react';

export function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { error: toastError } = useToast();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('identitas');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentService.getStudentById(id);
      if (!data) {
        toastError('Siswa tidak ditemukan.');
        navigate('/students');
        return;
      }
      setStudent(data);
    } catch (err) {
      toastError('Gagal memuat detail profil siswa.');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toastError]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <LoadingSkeleton lines={3} />
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  if (!student) return null;

  const tabsConfig = [
    { id: 'identitas', label: '1. Identitas', icon: User },
    { id: 'pendidikan', label: '2. Pendidikan', icon: GraduationCap, count: student.education_histories?.length },
    { id: 'bahasa', label: '3. Bahasa & SSW', icon: Award, count: student.certifications?.length },
    { id: 'pengalaman', label: '4. Pengalaman Kerja', icon: Briefcase, count: student.work_experiences?.length },
    { id: 'personal', label: '5. Profil Fisik', icon: Activity },
    { id: 'keluarga', label: '6. Keluarga', icon: Users, count: student.family_members?.length },
    { id: 'dokumen', label: '7. Dokumen', icon: FileCheck2 },
    { id: 'status', label: '8. Status & Riwayat', icon: Route },
    { id: 'finansial', label: '9. Administrasi Biaya', icon: DollarSign },
  ];

  const learningMeta = getLearningStatusMeta(student.student_journey?.learning_status);
  const jobMeta = getJobSelectionMeta(student.student_journey?.job_selection_status);
  const depMeta = getDepartureStatusMeta(student.student_journey?.departure_status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/students')}
            >
              Kembali ke Daftar
            </Button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  className="font-mono text-xs"
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {student.student_id_number}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>•</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Program {student.program_type}
                </span>
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {student.full_name}
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={Edit2}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Data Pokok
            </Button>
          </div>
        </div>

        {/* Current Pipeline Status Pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginRight: '4px' }}>
            Status Saat Ini:
          </span>
          <Badge variant={learningMeta.badge}>{learningMeta.label}</Badge>
          <Badge variant={jobMeta.badge}>{jobMeta.label}</Badge>
          <Badge variant={depMeta.badge}>{depMeta.label}</Badge>
          {student.student_journey?.matched_company_name && (
            <Badge variant="neutral">
              Perusahaan: {student.student_journey.matched_company_name}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <Tabs tabs={tabsConfig} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Active Tab Content */}
      <div>
        {activeTab === 'identitas' && <TabIdentity student={student} onUpdate={fetchDetail} />}
        {activeTab === 'pendidikan' && <TabEducation student={student} onUpdate={fetchDetail} />}
        {activeTab === 'bahasa' && <TabLanguageCert student={student} onUpdate={fetchDetail} />}
        {activeTab === 'pengalaman' && <TabWorkExperience student={student} onUpdate={fetchDetail} />}
        {activeTab === 'personal' && <TabPersonalProfile student={student} onUpdate={fetchDetail} />}
        {activeTab === 'keluarga' && <TabFamily student={student} onUpdate={fetchDetail} />}
        {activeTab === 'dokumen' && <TabDocuments student={student} onUpdate={fetchDetail} />}
        {activeTab === 'status' && <TabJourneyStatus student={student} onUpdate={fetchDetail} />}
        {activeTab === 'finansial' && <TabFinances student={student} onUpdate={fetchDetail} />}
      </div>

      {/* Edit Basic Info Modal */}
      {isEditModalOpen && (
        <StudentFormModal
          isOpen={isEditModalOpen}
          student={student}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={fetchDetail}
        />
      )}
    </div>
  );
}
