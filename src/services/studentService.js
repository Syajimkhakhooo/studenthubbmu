import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const studentService = {
  /**
   * Fetch paginated list of students with optional search & filter
   */
  async getStudents({
    page = 1,
    pageSize = 10,
    search = '',
    program = '',
    learningStatus = '',
    jobStatus = '',
    departureStatus = '',
    sortBy = 'created_at',
    sortAsc = false,
    includeArchived = false,
  } = {}) {
    if (!isSupabaseConfigured) {
      return { data: [], total: 0, page, pageSize };
    }

    try {
      let query = supabase
        .from('students')
        .select(`
          *,
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
            verification_status
          )
        `, { count: 'exact' });

      // Archive filter
      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      // Search filter (ID Number or Full Name)
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,student_id_number.ilike.%${search}%`);
      }

      // Program filter
      if (program) {
        query = query.eq('program_type', program);
      }

      // Range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Sorting
      query = query.order(sortBy, { ascending: sortAsc }).range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      // Optional post-filter on nested journey fields if needed
      let filteredData = data || [];
      if (learningStatus) {
        filteredData = filteredData.filter(s => s.student_journey?.learning_status === learningStatus);
      }
      if (jobStatus) {
        filteredData = filteredData.filter(s => s.student_journey?.job_selection_status === jobStatus);
      }
      if (departureStatus) {
        filteredData = filteredData.filter(s => s.student_journey?.departure_status === departureStatus);
      }

      return {
        data: filteredData,
        total: count || filteredData.length,
        page,
        pageSize,
      };
    } catch (err) {
      console.error('Error fetching students:', err);
      throw err;
    }
  },

  /**
   * Fetch complete student profile with all relational data
   */
  async getStudentById(id) {
    if (!isSupabaseConfigured) return null;

    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          student_journey (*),
          education_histories (*),
          work_experiences (*),
          family_members (*),
          certifications (*),
          student_documents (*),
          student_preferences (*),
          student_finances (*),
          student_status_history (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching student detail:', err);
      throw err;
    }
  },

  /**
   * Check if student ID number is already taken
   */
  async checkStudentIdExists(studentIdNumber, excludeId = null) {
    if (!isSupabaseConfigured) return false;
    try {
      let query = supabase
        .from('students')
        .select('id')
        .eq('student_id_number', studentIdNumber);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data && data.length > 0);
    } catch {
      return false;
    }
  },

  /**
   * Create new student with basic journey record
   */
  async createStudent(studentData, actorProfile) {
    if (!isSupabaseConfigured) throw new Error('Supabase belum terhubung.');

    // Check duplicate student_id_number
    const isDuplicate = await this.checkStudentIdExists(studentData.student_id_number);
    if (isDuplicate) {
      throw new Error(`Nomor ID Siswa "${studentData.student_id_number}" sudah terdaftar.`);
    }

    try {
      const payload = {
        ...studentData,
        created_by: actorProfile?.id || null,
        updated_by: actorProfile?.id || null,
      };

      const { data, error } = await supabase
        .from('students')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Log to audit log
      await this.logAudit({
        actorProfile,
        action: 'CREATE',
        entityType: 'student',
        entityId: data.id,
        summary: `Menambahkan siswa baru: ${data.full_name} (${data.student_id_number})`,
      });

      return data;
    } catch (err) {
      console.error('Error creating student:', err);
      throw err;
    }
  },

  /**
   * Update student basic identity
   */
  async updateStudent(id, updateData, actorProfile) {
    if (!isSupabaseConfigured) throw new Error('Supabase belum terhubung.');

    try {
      const payload = {
        ...updateData,
        updated_by: actorProfile?.id || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('students')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await this.logAudit({
        actorProfile,
        action: 'UPDATE',
        entityType: 'student',
        entityId: id,
        summary: `Memperbarui data identitas siswa: ${data.full_name}`,
      });

      return data;
    } catch (err) {
      console.error('Error updating student:', err);
      throw err;
    }
  },

  /**
   * Archive / Unarchive student
   */
  async setStudentArchive(id, isArchived, actorProfile) {
    if (!isSupabaseConfigured) throw new Error('Supabase belum terhubung.');

    try {
      const { data, error } = await supabase
        .from('students')
        .update({ is_archived: isArchived, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await this.logAudit({
        actorProfile,
        action: isArchived ? 'ARCHIVE' : 'UNARCHIVE',
        entityType: 'student',
        entityId: id,
        summary: `${isArchived ? 'Mengarsipkan' : 'Mengaktifkan kembali'} siswa: ${data.full_name}`,
      });

      return data;
    } catch (err) {
      console.error('Error toggling student archive:', err);
      throw err;
    }
  },

  /**
   * Child table CRUD helpers (Education, Work, Family, Certifications, Preferences, Finances)
   */
  async saveEducation(studentId, eduList) {
    if (!isSupabaseConfigured) return;
    // Delete existing and reinsert for complete sync
    await supabase.from('education_histories').delete().eq('student_id', studentId);
    if (eduList.length > 0) {
      const formatted = eduList.map(e => ({
        student_id: studentId,
        level: e.level,
        institution_name: e.institution_name,
        major: e.major || null,
        start_year: e.start_year ? parseInt(e.start_year) : null,
        end_year: e.end_year ? parseInt(e.end_year) : null,
        is_graduated: e.is_graduated !== false,
      }));
      const { error } = await supabase.from('education_histories').insert(formatted);
      if (error) throw error;
    }
  },

  async saveWorkExperiences(studentId, workList) {
    if (!isSupabaseConfigured) return;
    await supabase.from('work_experiences').delete().eq('student_id', studentId);
    if (workList.length > 0) {
      const formatted = workList.map(w => ({
        student_id: studentId,
        company_name: w.company_name,
        industry_sector: w.industry_sector || null,
        position: w.position || null,
        start_date: w.start_date || null,
        end_date: w.end_date || null,
        job_description: w.job_description || null,
      }));
      const { error } = await supabase.from('work_experiences').insert(formatted);
      if (error) throw error;
    }
  },

  async saveFamilyMembers(studentId, familyList) {
    if (!isSupabaseConfigured) return;
    await supabase.from('family_members').delete().eq('student_id', studentId);
    if (familyList.length > 0) {
      const formatted = familyList.map(f => ({
        student_id: studentId,
        relation: f.relation,
        full_name: f.full_name,
        age: f.age ? parseInt(f.age) : null,
        occupation: f.occupation || null,
        phone_number: f.phone_number || null,
      }));
      const { error } = await supabase.from('family_members').insert(formatted);
      if (error) throw error;
    }
  },

  async saveCertifications(studentId, certList) {
    if (!isSupabaseConfigured) return;
    await supabase.from('certifications').delete().eq('student_id', studentId);
    if (certList.length > 0) {
      const formatted = certList.map(c => ({
        student_id: studentId,
        cert_type: c.cert_type,
        cert_level: c.cert_level || null,
        score: c.score ? parseFloat(c.score) : null,
        test_date: c.test_date || null,
        issue_date: c.issue_date || null,
        expiry_date: c.expiry_date || null,
        certificate_number: c.certificate_number || null,
        verification_status: c.verification_status || 'unverified',
        reviewer_notes: c.reviewer_notes || null,
      }));
      const { error } = await supabase.from('certifications').insert(formatted);
      if (error) throw error;
    }
  },

  async savePreferences(studentId, preferences) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('student_preferences')
      .upsert({
        student_id: studentId,
        preferred_prefectures: preferences.preferred_prefectures || [],
        preferred_job_categories: preferences.preferred_job_categories || [],
        min_acceptable_salary: preferences.min_acceptable_salary || null,
        notes: preferences.notes || null,
      }, { onConflict: 'student_id' });
    if (error) throw error;
  },

  async saveFinances(studentId, finances, actorProfile) {
    if (!isSupabaseConfigured) return;
    await supabase.from('student_finances').delete().eq('student_id', studentId);
    if (finances.length > 0) {
      const formatted = finances.map(f => ({
        student_id: studentId,
        fee_category: f.fee_category,
        total_amount: parseFloat(f.total_amount) || 0,
        paid_amount: parseFloat(f.paid_amount) || 0,
        payment_status: f.payment_status || 'belum_bayar',
        payment_date: f.payment_date || null,
        receipt_number: f.receipt_number || null,
        notes: f.notes || null,
        created_by: actorProfile?.id || null,
      }));
      const { error } = await supabase.from('student_finances').insert(formatted);
      if (error) throw error;
    }
  },

  /**
   * Internal audit logger
   */
  async logAudit({ actorProfile, action, entityType, entityId, summary }) {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.from('audit_logs').insert([
        {
          actor_id: actorProfile?.id || null,
          actor_email: actorProfile?.email || 'system',
          action,
          entity_type: entityType,
          entity_id: entityId,
          change_summary: summary,
        },
      ]);
    } catch (err) {
      console.warn('Failed to record audit log:', err);
    }
  },
};
