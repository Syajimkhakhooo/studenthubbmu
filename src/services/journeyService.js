import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const journeyService = {
  /**
   * Update student journey status dimension with history recording
   */
  async updateJourneyDimension({
    studentId,
    dimension, // e.g. 'learning_status', 'interview_readiness', etc.
    oldValue,
    newValue,
    reason = '',
    actorProfile,
    extraFields = {}, // e.g. matched_company_name, target_departure_date
  }) {
    if (!isSupabaseConfigured) throw new Error('Supabase belum terhubung.');

    try {
      // 1. Update student_journey table
      const sanitizedExtra = { ...extraFields };
      if (sanitizedExtra.target_departure_date === '') sanitizedExtra.target_departure_date = null;
      if (sanitizedExtra.actual_departure_date === '') sanitizedExtra.actual_departure_date = null;

      const updatePayload = {
        [dimension]: newValue,
        updated_by: actorProfile?.id || null,
        updated_at: new Date().toISOString(),
        ...sanitizedExtra,
      };

      const { data, error } = await supabase
        .from('student_journey')
        .update(updatePayload)
        .eq('student_id', studentId)
        .select()
        .single();

      if (error) throw error;

      // 2. Insert into student_status_history
      if (oldValue !== newValue) {
        await supabase.from('student_status_history').insert([
          {
            student_id: studentId,
            status_dimension: dimension,
            old_value: oldValue || 'none',
            new_value: newValue,
            reason: reason || null,
            changed_by: actorProfile?.id || null,
          },
        ]);
      }

      // 3. Log to audit_logs
      await supabase.from('audit_logs').insert([
        {
          actor_id: actorProfile?.id || null,
          actor_email: actorProfile?.email || 'system',
          action: 'UPDATE_JOURNEY_STATUS',
          entity_type: 'student_journey',
          entity_id: studentId,
          change_summary: `Memperbarui ${dimension} dari "${oldValue}" menjadi "${newValue}". ${reason ? `Alasan: ${reason}` : ''}`,
        },
      ]);

      return data;
    } catch (err) {
      console.error('Error updating journey status:', err);
      throw err;
    }
  },

  /**
   * Fetch all status history timeline for a student
   */
  async getStudentStatusHistory(studentId) {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('student_status_history')
        .select(`
          *,
          profiles (
            full_name,
            email,
            role
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching status history:', err);
      return [];
    }
  },

  /**
   * Fetch journey pipeline overview across all students
   */
  async getJourneyOverview() {
    if (!isSupabaseConfigured) {
      return {
        learning: { baru: 0, sedang_belajar: 0, lulus: 0, berhenti: 0 },
        interview: { belum_siap: 0, siap: 0 },
        jobSelection: { belum_mengikuti: 0, proses: 0, lolos: 0, tidak_lolos: 0, mengundurkan_diri: 0 },
        departureReadiness: { belum_siap: 0, menunggu_kontrak: 0, menunggu_coe: 0, siap: 0 },
        departure: { belum_berangkat: 0, sudah_berangkat: 0 },
        leave: { normal: 0, cuti: 0, dicutikan: 0 },
        total: 0,
      };
    }

    try {
      const { data, error } = await supabase
        .from('student_journey')
        .select('learning_status, leave_status, interview_readiness, job_selection_status, departure_status, departure_readiness');

      if (error) throw error;

      const summary = {
        learning: { baru: 0, sedang_belajar: 0, lulus: 0, berhenti: 0 },
        interview: { belum_siap: 0, siap: 0 },
        jobSelection: { belum_mengikuti: 0, proses: 0, lolos: 0, tidak_lolos: 0, mengundurkan_diri: 0 },
        departureReadiness: { belum_siap: 0, menunggu_kontrak: 0, menunggu_coe: 0, siap: 0 },
        departure: { belum_berangkat: 0, sudah_berangkat: 0 },
        leave: { normal: 0, cuti: 0, dicutikan: 0 },
        total: data ? data.length : 0,
      };

      (data || []).forEach((row) => {
        if (summary.learning[row.learning_status] !== undefined) summary.learning[row.learning_status]++;
        if (summary.interview[row.interview_readiness] !== undefined) summary.interview[row.interview_readiness]++;
        if (summary.jobSelection[row.job_selection_status] !== undefined) summary.jobSelection[row.job_selection_status]++;
        if (summary.departureReadiness[row.departure_readiness] !== undefined) summary.departureReadiness[row.departure_readiness]++;
        if (summary.departure[row.departure_status] !== undefined) summary.departure[row.departure_status]++;
        if (summary.leave[row.leave_status] !== undefined) summary.leave[row.leave_status]++;
      });

      return summary;
    } catch (err) {
      console.error('Error fetching journey overview:', err);
      return null;
    }
  },
};
