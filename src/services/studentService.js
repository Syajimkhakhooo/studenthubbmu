import { supabase, isSupabaseConfigured } from '../lib/supabase';

let hasSyncedLegacyJourney = false;

export const studentService = {
  /**
   * Helper to normalize student journey dimensions per business rules:
   * Rule 1: Lulus pelatihan -> otomatis siap wawancara (interview_readiness = 'siap')
   * Rule 2: Lulus pelatihan -> izin cuti tidak berlaku (leave_status = 'normal')
   * Rule 3: Sudah di Jepang -> kesiapan & izin cuti tidak berlaku (leave_status = 'normal')
   */
  normalizeStudentJourney(student) {
    if (!student || !student.student_journey) return student;
    const j = { ...student.student_journey };
    if (j.departure_status === 'sudah_berangkat') {
      j.leave_status = 'normal';
    } else if (j.learning_status === 'lulus') {
      j.leave_status = 'normal';
      j.interview_readiness = 'siap';
    }
    return { ...student, student_journey: j };
  },

  /**
   * Synchronize legacy records in Supabase to maintain database integrity
   */
  async syncLegacyJourneyStatus() {
    if (!isSupabaseConfigured) return;
    try {
      // 1. Siswa yang sudah berangkat ke Jepang -> izin cuti dinormalkan
      await supabase
        .from('student_journey')
        .update({ leave_status: 'normal', updated_at: new Date().toISOString() })
        .eq('departure_status', 'sudah_berangkat')
        .in('leave_status', ['cuti', 'dicutikan']);

      // 2. Siswa yang sudah lulus pelatihan -> izin cuti dinormalkan
      await supabase
        .from('student_journey')
        .update({ leave_status: 'normal', updated_at: new Date().toISOString() })
        .eq('learning_status', 'lulus')
        .in('leave_status', ['cuti', 'dicutikan']);

      // 3. Siswa yang sudah lulus pelatihan tapi belum berangkat -> otomatis siap interview
      await supabase
        .from('student_journey')
        .update({ interview_readiness: 'siap', updated_at: new Date().toISOString() })
        .eq('learning_status', 'lulus')
        .neq('departure_status', 'sudah_berangkat')
        .neq('interview_readiness', 'siap');
    } catch (err) {
      console.warn('Sync legacy journey status notice:', err);
    }
  },

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
    departureReadiness = '',
    leaveStatus = '',
    interviewReadiness = '',
    entryPeriod = false,
    certCategory = '', // '' | 'jft' | 'ssw' | 'both' — siswa pemilik sertifikat (di luar yang sudah di Jepang)
    includeDeparted = false, // true = ikutkan siswa yang sudah di Jepang (mis. halaman Journey)
    sortBy = 'created_at',
    sortAsc = false,
    includeArchived = false,
    onlyArchived = false,
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

      // Archive / Trash filter
      if (onlyArchived) {
        query = query.eq('is_archived', true);
      } else if (!includeArchived) {
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

      // Sorting
      query = query.order(sortBy, { ascending: sortAsc });

      // Siswa AKTIF = belum diarsipkan & belum berangkat ke Jepang.
      // Kecuali: Tong Sampah, pemanggil yang meminta includeDeparted, atau filter
      // yang memang khusus meminta status "Sudah Berangkat ke Jepang".
      const excludeDeparted = !onlyArchived && !includeDeparted && departureStatus !== 'sudah_berangkat';

      const hasJourneyFilter = Boolean(
        learningStatus ||
        jobStatus ||
        departureStatus ||
        departureReadiness ||
        leaveStatus ||
        interviewReadiness ||
        entryPeriod ||
        certCategory ||
        excludeDeparted
      );

      // Trigger one-time asynchronous database synchronization for legacy records
      if (!hasSyncedLegacyJourney) {
        hasSyncedLegacyJourney = true;
        this.syncLegacyJourneyStatus().catch(() => {});
      }

      // If no nested relational filters, use standard database pagination directly
      if (!hasJourneyFilter) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;
        query = query.range(from, to);

        const { data, count, error } = await query;
        if (error) throw error;

        const normalizedData = (data || []).map((s) => this.normalizeStudentJourney(s));

        return {
          data: normalizedData,
          total: count || 0,
          page,
          pageSize,
        };
      }

      // If relational/journey filter is active, fetch all matching dataset to filter reliably without page skew
      const { data, error } = await query;
      if (error) throw error;

      // Always normalize journey rules first before evaluating filters
      let filteredData = (data || []).map((s) => this.normalizeStudentJourney(s));

      // Siswa aktif hanya yang masih dalam proses (belum berangkat ke Jepang)
      if (excludeDeparted) {
        filteredData = filteredData.filter(
          (s) => s.student_journey?.departure_status !== 'sudah_berangkat'
        );
      }

      // Filter: Leave status (Izin Cuti / Dicutikan Lembaga)
      // Note: Siswa yang sudah_berangkat atau lulus otomatis dinormalkan ke 'normal'
      if (leaveStatus) {
        if (leaveStatus === 'cuti' || leaveStatus === 'leave_cuti') {
          filteredData = filteredData.filter(
            (s) => s.student_journey?.leave_status === 'cuti' || s.student_journey?.leave_status === 'dicutikan'
          );
        } else {
          filteredData = filteredData.filter((s) => s.student_journey?.leave_status === leaveStatus);
        }
      }

      // Filter: Learning status
      if (learningStatus) {
        filteredData = filteredData.filter((s) => s.student_journey?.learning_status === learningStatus);
      }

      // Filter: Job selection status
      if (jobStatus) {
        filteredData = filteredData.filter((s) => s.student_journey?.job_selection_status === jobStatus);
      }

      // Filter: Interview readiness (selama belum berangkat ke Jepang)
      if (interviewReadiness) {
        filteredData = filteredData.filter(
          (s) =>
            s.student_journey?.departure_status !== 'sudah_berangkat' &&
            s.student_journey?.interview_readiness === interviewReadiness
        );
      }

      // Filter: Departure readiness (hanya bagi yang belum berangkat)
      if (departureReadiness) {
        filteredData = filteredData.filter(
          (s) =>
            s.student_journey?.departure_status !== 'sudah_berangkat' &&
            s.student_journey?.departure_readiness === departureReadiness
        );
      }

      // Filter: Departure status
      if (departureStatus) {
        filteredData = filteredData.filter((s) => s.student_journey?.departure_status === departureStatus);
      }

      // Filter: Entry period (Current Month & Year)
      if (entryPeriod) {
        const now = new Date();
        const curYear = now.getFullYear();
        const curMonth = now.getMonth();
        filteredData = filteredData.filter((s) => {
          if (!s.entry_date) return false;
          const d = new Date(s.entry_date);
          return d.getFullYear() === curYear && d.getMonth() === curMonth;
        });
      }

      // Filter: Kepemilikan sertifikat Bahasa & SSW (dipisah per kategori)
      // JFT = sertifikat JFT-Basic, SSW = sertifikat keahlian SSW (Tokutei Ginou)
      // Siswa yang sudah berangkat ke Jepang TIDAK dihitung/ditampilkan di kategori ini
      if (certCategory) {
        filteredData = filteredData.filter((s) => {
          if (s.student_journey?.departure_status === 'sudah_berangkat') return false;
          const certs = s.certifications || [];
          const hasJft = certs.some((c) => c.cert_type === 'JFT_BASIC');
          const hasSsw = certs.some((c) => c.cert_type === 'SSW');
          if (certCategory === 'jft') return hasJft;
          if (certCategory === 'ssw') return hasSsw;
          if (certCategory === 'both') return hasJft && hasSsw;
          return true;
        });
      }

      const total = filteredData.length;
      const from = (page - 1) * pageSize;
      const paginatedData = filteredData.slice(from, from + pageSize);

      return {
        data: paginatedData,
        total,
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
          certifications (*),
          student_status_history (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return this.normalizeStudentJourney(data);
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
   * Batch check existing student ID numbers
   * @param {string[]} idNumbers 
   * @returns {Promise<string[]>} List of ID numbers that already exist
   */
  async checkStudentIdsExist(idNumbers = []) {
    if (!isSupabaseConfigured || !Array.isArray(idNumbers) || idNumbers.length === 0) {
      return [];
    }
    try {
      const cleanList = idNumbers.filter(Boolean).map(id => String(id).trim());
      if (cleanList.length === 0) return [];

      const { data, error } = await supabase
        .from('students')
        .select('student_id_number')
        .in('student_id_number', cleanList);

      if (error) throw error;
      return (data || []).map(row => row.student_id_number);
    } catch (err) {
      console.warn('Batch check ID error:', err);
      return [];
    }
  },

  /**
   * Clean and sanitize student payload for PostgreSQL numeric and date types
   */
  sanitizeStudentPayload(data) {
    const payload = { ...data };

    // Numeric fields: empty string or NaN -> null
    if (payload.height_cm === '' || payload.height_cm === undefined || payload.height_cm === null) {
      payload.height_cm = null;
    } else {
      const parsed = parseFloat(payload.height_cm);
      payload.height_cm = Number.isNaN(parsed) ? null : parsed;
    }

    if (payload.weight_kg === '' || payload.weight_kg === undefined || payload.weight_kg === null) {
      payload.weight_kg = null;
    } else {
      const parsed = parseFloat(payload.weight_kg);
      payload.weight_kg = Number.isNaN(parsed) ? null : parsed;
    }

    // Date fields: empty string -> null
    if (!payload.birth_date || payload.birth_date === '') {
      payload.birth_date = null;
    }
    if (!payload.entry_date || payload.entry_date === '') {
      payload.entry_date = new Date().toISOString().split('T')[0];
    }

    // Text fields: empty string -> null
    [
      'nickname',
      'birth_place',
      'religion',
      'blood_type',
      'domicile_address',
      'id_card_address',
      'phone_number',
      'email',
      'emergency_contact_name',
      'emergency_contact_relation',
      'emergency_contact_phone',
      'target_job_interest',
      'eye_vision_status',
      'driving_license_type',
      'marital_status',
      'kelas',
      'notes',
    ].forEach((key) => {
      if (payload[key] === '') {
        payload[key] = null;
      }
    });

    // Whitelist only valid DB columns for public.students table
    // (Prevents UI metadata like 'errors', 'isValid', 'rowNumber' or relations from leaking to Supabase)
    const validColumns = [
      'student_id_number',
      'full_name',
      'nickname',
      'gender',
      'birth_place',
      'birth_date',
      'religion',
      'blood_type',
      'height_cm',
      'weight_kg',
      'domicile_address',
      'id_card_address',
      'phone_number',
      'email',
      'emergency_contact_name',
      'emergency_contact_relation',
      'emergency_contact_phone',
      'entry_date',
      'program_type',
      'target_job_interest',
      'eye_vision_status',
      'smoking_status',
      'tattoo_status',
      'driving_license_type',
      'willing_overtime',
      'willing_relocation',
      'marital_status',
      'kelas',
      'is_archived',
      'notes',
      'created_by',
      'updated_by',
    ];

    const cleanPayload = {};
    validColumns.forEach((col) => {
      if (payload[col] !== undefined) {
        cleanPayload[col] = payload[col];
      }
    });

    return cleanPayload;
  },

  /**
   * Create new student with basic journey record
   */
  async createStudent(studentData, actorProfile) {
    if (!isSupabaseConfigured) throw new Error('Supabase belum terhubung.');
    if (actorProfile?.role === 'viewer') {
      throw new Error('Akun Viewer (Hanya Lihat) tidak memiliki izin untuk menambah data siswa.');
    }

    // Check duplicate student_id_number
    const isDuplicate = await this.checkStudentIdExists(studentData.student_id_number);
    if (isDuplicate) {
      throw new Error(`Nomor ID Siswa "${studentData.student_id_number}" sudah terdaftar.`);
    }

    try {
      const sanitized = this.sanitizeStudentPayload(studentData);
      const payload = {
        ...sanitized,
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
   * Bulk insert students from parsed Excel/CSV rows
   * @param {Array} studentsList Array of student objects
   * @param {Object} actorProfile Currently authenticated user profile
   * @returns {Promise<{inserted: Array, count: number}>}
   */
  async bulkCreateStudents(studentsList, actorProfile) {
    if (!isSupabaseConfigured) throw new Error('Supabase belum terhubung.');
    if (actorProfile?.role === 'viewer') {
      throw new Error('Akun Viewer (Hanya Lihat) tidak memiliki izin untuk mengimpor data.');
    }
    if (!Array.isArray(studentsList) || studentsList.length === 0) {
      throw new Error('Tidak ada data siswa untuk diimpor.');
    }

    try {
      // 1. Sanitize all student payloads
      const payloads = studentsList.map((item) => {
        const sanitized = this.sanitizeStudentPayload(item);
        return {
          ...sanitized,
          created_by: actorProfile?.id || null,
          updated_by: actorProfile?.id || null,
        };
      });

      // 2. Insert into Supabase in chunks of 50 to avoid HTTP limits
      const chunkSize = 50;
      const allInserted = [];

      for (let i = 0; i < payloads.length; i += chunkSize) {
        const chunk = payloads.slice(i, i + chunkSize);
        const { data, error } = await supabase
          .from('students')
          .insert(chunk)
          .select();

        if (error) throw error;
        if (data) allInserted.push(...data);
      }

      // 3. Log audit event
      await this.logAudit({
        actorProfile,
        action: 'BULK_IMPORT',
        entityType: 'student',
        entityId: allInserted[0]?.id || null,
        summary: `Mengimpor ${allInserted.length} siswa baru secara bulk melalui file Excel/CSV`,
      });

      return {
        inserted: allInserted,
        count: allInserted.length,
      };
    } catch (err) {
      console.error('Error in bulkCreateStudents:', err);
      throw err;
    }
  },

  /**
   * Update student basic identity
   */
  async updateStudent(id, updateData, actorProfile) {
    if (!isSupabaseConfigured) throw new Error('Supabase belum terhubung.');
    if (actorProfile?.role === 'viewer') {
      throw new Error('Akun Viewer (Hanya Lihat) tidak memiliki izin untuk mengubah data.');
    }

    try {
      const sanitized = this.sanitizeStudentPayload(updateData);
      const payload = {
        ...sanitized,
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
    if (actorProfile?.role === 'viewer') {
      throw new Error('Akun Viewer (Hanya Lihat) tidak memiliki izin untuk mengarsipkan data.');
    }

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
   * Get total number of students in trash bin
   */
  async getTrashCount() {
    if (!isSupabaseConfigured) return 0;
    try {
      const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', true);
      if (error) throw error;
      return count || 0;
    } catch {
      return 0;
    }
  },

  /**
   * Hitung jumlah siswa aktif per kategori sertifikat (untuk badge tab Daftar Siswa)
   * @returns {Promise<{jft: number, ssw: number, both: number}>}
   */
  async getCertificationCounts() {
    if (!isSupabaseConfigured) return { jft: 0, ssw: 0, both: 0 };
    try {
      const [jft, ssw, both] = await Promise.all([
        this.getStudents({ page: 1, pageSize: 1, certCategory: 'jft' }),
        this.getStudents({ page: 1, pageSize: 1, certCategory: 'ssw' }),
        this.getStudents({ page: 1, pageSize: 1, certCategory: 'both' }),
      ]);
      return { jft: jft.total || 0, ssw: ssw.total || 0, both: both.total || 0 };
    } catch {
      return { jft: 0, ssw: 0, both: 0 };
    }
  },

  /**
   * Restore a student from trash bin to active students
   */
  async restoreStudent(id, actorProfile) {
    return this.setStudentArchive(id, false, actorProfile);
  },

  /**
   * Permanently delete a student and all related relational data
   */
  async deleteStudentPermanently(id, actorProfile) {
    if (!isSupabaseConfigured) throw new Error('Supabase belum terhubung.');
    if (actorProfile?.role === 'viewer') {
      throw new Error('Akun Viewer (Hanya Lihat) tidak memiliki izin untuk menghapus data.');
    }

    try {
      // 1. Fetch student info first for audit trail
      const { data: studentInfo } = await supabase
        .from('students')
        .select('full_name, student_id_number')
        .eq('id', id)
        .maybeSingle();

      // 2. Perform hard delete (foreign keys cascade automatically)
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // 3. Log permanent deletion
      await this.logAudit({
        actorProfile,
        action: 'PERMANENT_DELETE',
        entityType: 'student',
        entityId: id,
        summary: `Menghapus permanen siswa: ${studentInfo?.full_name || id} (${studentInfo?.student_id_number || '-'})`,
      });

      return true;
    } catch (err) {
      console.error('Error permanently deleting student:', err);
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
        file_storage_path: c.file_storage_path || null,
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

  /**
   * Permanently delete ALL students in the trash bin (is_archived = true)
   * @returns {Promise<{count: number}>}
   */
  async emptyTrash(actorProfile) {
    if (!isSupabaseConfigured) throw new Error('Supabase belum terhubung.');
    if (actorProfile?.role === 'viewer') {
      throw new Error('Akun Viewer (Hanya Lihat) tidak memiliki izin untuk mengosongkan tong sampah.');
    }

    try {
      // Count first for audit summary
      const { count: trashCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', true);

      if (!trashCount || trashCount === 0) return { count: 0 };

      const { error } = await supabase
        .from('students')
        .delete()
        .eq('is_archived', true);

      if (error) throw error;

      await this.logAudit({
        actorProfile,
        action: 'BULK_DELETE',
        entityType: 'student',
        entityId: null,
        summary: `Mengosongkan tong sampah: ${trashCount} siswa dihapus permanen sekaligus`,
      });

      return { count: trashCount };
    } catch (err) {
      console.error('Error emptying trash:', err);
      throw err;
    }
  },

  /**
   * Permanently delete ALL active students (is_archived = false)
   * ⚠️ EXTREME DANGER — irreversible, used only after double-confirmation
   * @returns {Promise<{count: number}>}
   */
  async deleteAllActiveStudents(actorProfile) {
    if (!isSupabaseConfigured) throw new Error('Supabase belum terhubung.');
    if (actorProfile?.role === 'viewer') {
      throw new Error('Akun Viewer (Hanya Lihat) tidak memiliki izin untuk menghapus semua data.');
    }

    try {
      // Count first for audit summary
      const { count: activeCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('is_archived', false);

      if (!activeCount || activeCount === 0) return { count: 0 };

      const { error } = await supabase
        .from('students')
        .delete()
        .eq('is_archived', false);

      if (error) throw error;

      await this.logAudit({
        actorProfile,
        action: 'BULK_DELETE_ALL',
        entityType: 'student',
        entityId: null,
        summary: `HAPUS SEMUA DATA: ${activeCount} siswa aktif dihapus permanen sekaligus`,
      });

      return { count: activeCount };
    } catch (err) {
      console.error('Error deleting all active students:', err);
      throw err;
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
