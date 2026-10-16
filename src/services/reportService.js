import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const reportService = {
  /**
   * Run multi-criteria query against Supabase database
   */
  async queryStudents(filters = {}) {
    if (!isSupabaseConfigured) return [];

    try {
      let query = supabase
        .from('students')
        .select(`
          id,
          student_id_number,
          full_name,
          nickname,
          gender,
          birth_date,
          height_cm,
          weight_kg,
          entry_date,
          program_type,
          target_job_interest,
          smoking_status,
          tattoo_status,
          driving_license_type,
          willing_overtime,
          willing_relocation,
          student_journey (
            learning_status,
            leave_status,
            interview_readiness,
            job_selection_status,
            departure_readiness,
            departure_status,
            matched_company_name,
            matched_job_sector
          ),
          certifications (
            cert_type,
            cert_level,
            score,
            verification_status
          ),
          work_experiences (
            company_name,
            industry_sector,
            position
          ),
          student_documents (
            doc_type,
            status
          )
        `)
        .eq('is_archived', false);

      // Direct column filters
      if (filters.gender) {
        query = query.eq('gender', filters.gender);
      }
      if (filters.programType) {
        query = query.eq('program_type', filters.programType);
      }
      if (filters.targetJobInterest) {
        query = query.ilike('target_job_interest', `%${filters.targetJobInterest}%`);
      }
      if (filters.smokingStatus !== undefined && filters.smokingStatus !== '') {
        query = query.eq('smoking_status', filters.smokingStatus === 'true');
      }
      if (filters.willingOvertime !== undefined && filters.willingOvertime !== '') {
        query = query.eq('willing_overtime', filters.willingOvertime === 'true');
      }
      if (filters.willingRelocation !== undefined && filters.willingRelocation !== '') {
        query = query.eq('willing_relocation', filters.willingRelocation === 'true');
      }
      if (filters.hasLicense !== undefined && filters.hasLicense !== '') {
        if (filters.hasLicense === 'true') {
          query = query.neq('driving_license_type', 'Tidak Ada');
        } else {
          query = query.eq('driving_license_type', 'Tidak Ada');
        }
      }

      // Height range filter
      if (filters.minHeight) {
        query = query.gte('height_cm', parseFloat(filters.minHeight));
      }
      if (filters.maxHeight) {
        query = query.lte('height_cm', parseFloat(filters.maxHeight));
      }

      // Entry Month & Year filter
      if (filters.entryYear) {
        const year = filters.entryYear;
        const month = filters.entryMonth ? filters.entryMonth.padStart(2, '0') : null;
        if (month) {
          const startDate = `${year}-${month}-01`;
          const endDate = new Date(year, parseInt(month), 0).toISOString().split('T')[0];
          query = query.gte('entry_date', startDate).lte('entry_date', endDate);
        } else {
          query = query.gte('entry_date', `${year}-01-01`).lte('entry_date', `${year}-12-31`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = data || [];

      // Age range filter (calculated from birth_date in memory or query)
      if (filters.minAge || filters.maxAge) {
        const now = new Date();
        results = results.filter((s) => {
          if (!s.birth_date) return false;
          const birth = new Date(s.birth_date);
          let age = now.getFullYear() - birth.getFullYear();
          const m = now.getMonth() - birth.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;

          if (filters.minAge && age < parseInt(filters.minAge)) return false;
          if (filters.maxAge && age > parseInt(filters.maxAge)) return false;
          return true;
        });
      }

      // Relational filters (Journey)
      if (filters.learningStatus) {
        results = results.filter((s) => s.student_journey?.learning_status === filters.learningStatus);
      }
      if (filters.leaveStatus) {
        results = results.filter((s) => s.student_journey?.leave_status === filters.leaveStatus);
      }
      if (filters.interviewReadiness) {
        results = results.filter((s) => s.student_journey?.interview_readiness === filters.interviewReadiness);
      }
      if (filters.jobSelectionStatus) {
        results = results.filter((s) => s.student_journey?.job_selection_status === filters.jobSelectionStatus);
      }
      if (filters.departureReadiness) {
        results = results.filter((s) => s.student_journey?.departure_readiness === filters.departureReadiness);
      }
      if (filters.departureStatus) {
        results = results.filter((s) => s.student_journey?.departure_status === filters.departureStatus);
      }

      // Certifications filter (JFT, JLPT, SSW)
      if (filters.hasJft) {
        results = results.filter((s) =>
          (s.certifications || []).some((c) => c.cert_type === 'JFT_BASIC')
        );
      }
      if (filters.hasJlpt) {
        results = results.filter((s) =>
          (s.certifications || []).some((c) => c.cert_type.startsWith('JLPT'))
        );
      }
      if (filters.hasSsw) {
        results = results.filter((s) =>
          (s.certifications || []).some((c) => c.cert_type === 'SSW')
        );
      }

      // Work experience filter
      if (filters.hasWorkExperience !== undefined && filters.hasWorkExperience !== '') {
        const wantsExp = filters.hasWorkExperience === 'true';
        results = results.filter((s) => {
          const hasExp = (s.work_experiences || []).length > 0;
          return wantsExp ? hasExp : !hasExp;
        });
      }

      // Specific Document Completion filter
      if (filters.verifiedDocType) {
        results = results.filter((s) =>
          (s.student_documents || []).some(
            (d) => d.doc_type === filters.verifiedDocType && d.status === 'verified'
          )
        );
      }

      return results;
    } catch (err) {
      console.error('Error running report query:', err);
      throw err;
    }
  },
};
