import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  formatDate,
  calculateAge,
  getLearningStatusMeta,
  getJobSelectionMeta,
  getDepartureStatusMeta,
  getStudentSswField,
  formatCertificationLabel,
} from '../../utils/formatters';

/**
 * Generate and download professional BMU Student Report in PDF format
 * Strictly without student photos, formatted in A4 Portrait or Landscape.
 */
export function generateStudentReportPdf({
  students = [],
  filterSummary = '',
  orientation = 'portrait', // 'portrait' | 'landscape'
  selectedColumns = ['student_id', 'name', 'gender', 'age', 'height', 'program', 'job_interest', 'learning_status', 'selection_status', 'certs'],
  reportTitle = 'LAPORAN REKAPITULASI DATA SISWA',
}) {
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. Header / Letterhead
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text('LPK BAHTERA MITRA UNGGULAN (BMU)', margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Sistem Informasi & Pangkalan Data Siswa — Student Hub BMU', margin, 20);

  // Divider line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(margin, 23, pageWidth - margin, 23);

  // 2. Report Title & Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 15, 15);
  doc.text(reportTitle.toUpperCase(), margin, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Waktu Cetak: ${printDate} WIB  |  Total Hasil: ${students.length} Siswa`, margin, 34);

  let currentY = 38;
  if (filterSummary) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(90, 90, 90);
    const filterTextLines = doc.splitTextToSize(`Filter Diterapkan: ${filterSummary}`, pageWidth - (margin * 2));
    doc.text(filterTextLines, margin, currentY);
    currentY += (filterTextLines.length * 3.5) + 2;
  }

  // 3. Prepare Table Columns and Rows
  const columnDefs = {
    student_id: { header: 'NO. ID SISWA', dataKey: 'student_id_number' },
    name: { header: 'NAMA LENGKAP', dataKey: 'full_name' },
    gender: { header: 'L/P', dataKey: 'gender' },
    age: { header: 'USIA', dataKey: 'age' },
    height: { header: 'TB (CM)', dataKey: 'height_cm' },
    weight: { header: 'BB (KG)', dataKey: 'weight_kg' },
    program: { header: 'PROGRAM', dataKey: 'program_type' },
    ssw_field: { header: 'BIDANG SSW & BAHASA', dataKey: 'ssw_field' },
    job_interest: { header: 'BIDANG MINAT', dataKey: 'target_job_interest' },
    entry_date: { header: 'TGL MASUK', dataKey: 'entry_date' },
    learning_status: { header: 'STATUS BELAJAR', dataKey: 'learning_status' },
    selection_status: { header: 'STATUS SELEKSI', dataKey: 'job_selection_status' },
    departure_status: { header: 'KEBERANGKATAN', dataKey: 'departure_status' },
    certs: { header: 'SERTIFIKASI & BAHASA', dataKey: 'certs' },
  };

  const activeHeaders = selectedColumns
    .filter((col) => columnDefs[col])
    .map((col) => columnDefs[col].header);

  const tableRows = students.map((s) => {
    const row = [];
    selectedColumns.forEach((col) => {
      switch (col) {
        case 'student_id':
          row.push(s.student_id_number || '-');
          break;
        case 'name':
          row.push(s.full_name || '-');
          break;
        case 'gender':
          row.push(s.gender || '-');
          break;
        case 'age':
          row.push(calculateAge(s.birth_date));
          break;
        case 'height':
          row.push(s.height_cm ? `${s.height_cm}` : '-');
          break;
        case 'weight':
          row.push(s.weight_kg ? `${s.weight_kg}` : '-');
          break;
        case 'program': {
          if (s.program_type === 'SSW') {
            row.push('Tokutei Ginou (SSW)');
          } else if (s.program_type === 'TG_INTERNSHIP') {
            row.push('Magang / Ikushei Shuro');
          } else {
            row.push(s.program_type || '-');
          }
          break;
        }
        case 'ssw_field': {
          const sswField = getStudentSswField(s);
          row.push(sswField || '-');
          break;
        }
        case 'job_interest':
          row.push(s.target_job_interest || '-');
          break;
        case 'entry_date':
          row.push(formatDate(s.entry_date));
          break;
        case 'learning_status':
          row.push(getLearningStatusMeta(s.student_journey?.learning_status).label);
          break;
        case 'selection_status':
          row.push(getJobSelectionMeta(s.student_journey?.job_selection_status).label);
          break;
        case 'departure_status':
          row.push(getDepartureStatusMeta(s.student_journey?.departure_status).label);
          break;
        case 'certs': {
          const certLabels = (s.certifications || []).map((c) => formatCertificationLabel(c));
          row.push(certLabels.length > 0 ? certLabels.join(', ') : '-');
          break;
        }
        default:
          row.push('-');
      }
    });
    return row;
  });

  // 4. Draw Table with autoTable
  autoTable(doc, {
    head: [activeHeaders],
    body: tableRows,
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 18 },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 30, 30],
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [30, 34, 40], // Professional deep graphite
      textColor: [245, 245, 245],
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250],
    },
    didDrawPage: (data) => {
      // 5. Footer with page numbering and confidentiality disclaimer
      const pageNumber = doc.internal.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);

      // Left footer: Confidentiality
      doc.text(
        'DOKUMEN INTERNAL LPK BAHTERA MITRA UNGGULAN — DILARANG MENYEBARLUASKAN TANPA IZIN',
        margin,
        pageHeight - 8
      );

      // Right footer: Page numbers
      const pageStr = `Halaman ${data.pageNumber} dari ${pageNumber}`;
      doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 8);
    },
  });

  // 6. Save PDF
  const cleanTitle = reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `BMU_Report_${cleanTitle}_${Date.now()}.pdf`;
  doc.save(filename);
}
