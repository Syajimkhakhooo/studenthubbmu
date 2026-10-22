import {
  LEARNING_STATUSES,
  LEAVE_STATUSES,
  INTERVIEW_READINESS,
  JOB_SELECTION_STATUSES,
  DEPARTURE_READINESS,
  DEPARTURE_STATUSES,
  DOCUMENT_STATUSES,
} from './constants';

export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function calculateAge(birthDate) {
  if (!birthDate) return '-';
  try {
    const birth = new Date(birthDate);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age}` : '-';
  } catch {
    return '-';
  }
}

export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getStatusMeta(statusList, value) {
  const match = statusList.find((item) => item.value === value);
  return match || { label: value || '-', badge: 'neutral' };
}

export function getLearningStatusMeta(val) {
  return getStatusMeta(LEARNING_STATUSES, val);
}

export function getLeaveStatusMeta(val) {
  return getStatusMeta(LEAVE_STATUSES, val);
}

export function getInterviewReadinessMeta(val) {
  return getStatusMeta(INTERVIEW_READINESS, val);
}

export function getJobSelectionMeta(val) {
  return getStatusMeta(JOB_SELECTION_STATUSES, val);
}

export function getDepartureReadinessMeta(val) {
  return getStatusMeta(DEPARTURE_READINESS, val);
}

export function getDepartureStatusMeta(val) {
  return getStatusMeta(DEPARTURE_STATUSES, val);
}

export function getDocStatusMeta(val) {
  return getStatusMeta(DOCUMENT_STATUSES, val);
}

/**
 * Retrieve the full SSW and language certification qualifications from student's data.
 * e.g. "JFT A2 Basic, SSW Pertanian" or "SSW Pertanian" or "JFT A2 Basic"
 */
export function getStudentSswField(student) {
  if (!student) return '';
  const certs = student.certifications || [];
  if (!Array.isArray(certs) || certs.length === 0) return '';

  const langCerts = [];
  const sswCerts = [];
  const otherCerts = [];

  certs.forEach((c) => {
    if (!c) return;
    if (c.cert_type === 'SSW') {
      const lvl = c.cert_level?.trim() || '';
      const label = lvl ? (lvl.toUpperCase().startsWith('SSW') ? lvl : `SSW ${lvl}`) : 'SSW';
      sswCerts.push(label);
    } else if (c.cert_type === 'JFT_BASIC') {
      const lvl = c.cert_level?.trim() || 'A2';
      const label = lvl.toUpperCase().includes('JFT') ? lvl : `JFT ${lvl} Basic`;
      langCerts.push(label);
    } else if (c.cert_type && c.cert_type.startsWith('JLPT_')) {
      const defaultLvl = c.cert_type.replace('JLPT_', '');
      const lvl = c.cert_level?.trim() || defaultLvl;
      langCerts.push(`JLPT ${lvl}`);
    } else if (c.cert_type) {
      const lbl = formatCertificationLabel(c);
      if (lbl) otherCerts.push(lbl);
    }
  });

  // Urutkan Bahasa terlebih dahulu lalu Bidang SSW (contoh: JFT A2 Basic, SSW Pertanian)
  const combined = [...langCerts, ...sswCerts, ...otherCerts];
  return combined.join(', ');
}

/**
 * Format a single certification object into a clear human-readable string
 * e.g. SSW with cert_level 'Pertanian' -> 'SSW Pertanian'
 * e.g. JFT_BASIC with cert_level 'A2' -> 'JFT A2 Basic'
 * e.g. JLPT_N4 -> 'JLPT N4'
 */
export function formatCertificationLabel(cert) {
  if (!cert) return '';
  if (cert.cert_type === 'SSW') {
    const lvl = cert.cert_level?.trim() || '';
    if (!lvl) return 'SSW';
    return lvl.toUpperCase().startsWith('SSW') ? lvl : `SSW ${lvl}`;
  }
  if (cert.cert_type === 'JFT_BASIC') {
    const lvl = cert.cert_level?.trim() || 'A2';
    return lvl.toUpperCase().includes('JFT') ? lvl : `JFT ${lvl} Basic`;
  }
  if (cert.cert_type && cert.cert_type.startsWith('JLPT_')) {
    const defaultLevel = cert.cert_type.replace('JLPT_', '');
    const level = cert.cert_level && cert.cert_level.trim() ? cert.cert_level.trim() : defaultLevel;
    return `JLPT ${level}`;
  }
  if (cert.cert_type === 'OTHER') {
    return cert.cert_level && cert.cert_level.trim() ? cert.cert_level.trim() : 'Sertifikat Lainnya';
  }
  return cert.cert_level && cert.cert_level.trim()
    ? `${cert.cert_type} (${cert.cert_level.trim()})`
    : cert.cert_type;
}

