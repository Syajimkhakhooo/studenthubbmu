import { supabase, isSupabaseConfigured } from '../lib/supabase';

const BUCKET_NAME = 'student-documents';

export const documentService = {
  /**
   * Upload file to private Supabase Storage and update document record
   */
  async uploadStudentDocument({ studentId, docType, file, actorProfile }) {
    if (!isSupabaseConfigured) throw new Error('Supabase belum terhubung.');

    try {
      const fileExt = file.name.split('.').pop();
      const cleanFileName = `${studentId}/${docType}_${Date.now()}.${fileExt}`;

      // Upload to private storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(cleanFileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Update or insert into student_documents table
      const docPayload = {
        student_id: studentId,
        doc_type: docType,
        file_storage_path: uploadData.path,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        status: 'uploaded', // status changes to uploaded until verified
        uploaded_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('student_documents')
        .upsert(docPayload, { onConflict: 'student_id,doc_type' })
        .select()
        .single();

      if (error) throw error;

      // Audit log
      await supabase.from('audit_logs').insert([
        {
          actor_id: actorProfile?.id || null,
          actor_email: actorProfile?.email || 'system',
          action: 'UPLOAD_DOCUMENT',
          entity_type: 'student_document',
          entity_id: data.id,
          change_summary: `Mengunggah dokumen ${docType} (${file.name})`,
        },
      ]);

      return data;
    } catch (err) {
      console.error('Error uploading document:', err);
      throw err;
    }
  },

  /**
   * Generate short-lived signed URL for private document
   */
  async getSignedUrl(storagePath, expiresIn = 300) {
    if (!isSupabaseConfigured || !storagePath) return null;

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (err) {
      console.error('Error generating signed URL:', err);
      return null;
    }
  },

  /**
   * Update document verification status (verified, rejected, not_required, missing)
   */
  async updateVerificationStatus({ docId, status, reviewerNotes, actorProfile }) {
    if (!isSupabaseConfigured) throw new Error('Supabase belum terhubung.');

    try {
      const payload = {
        status,
        reviewer_notes: reviewerNotes || null,
        verified_by: actorProfile?.id || null,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase
        .from('student_documents')
        .update(payload)
        .eq('id', docId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert([
        {
          actor_id: actorProfile?.id || null,
          actor_email: actorProfile?.email || 'system',
          action: 'VERIFY_DOCUMENT',
          entity_type: 'student_document',
          entity_id: docId,
          change_summary: `Mengubah status dokumen ke "${status}". Catatan: ${reviewerNotes || '-'}`,
        },
      ]);

      return data;
    } catch (err) {
      console.error('Error updating document status:', err);
      throw err;
    }
  },

  /**
   * Get all documents with student details for Document Hub page
   */
  async getAllDocuments({ status = '', docType = '', search = '' } = {}) {
    if (!isSupabaseConfigured) return [];

    try {
      let query = supabase
        .from('student_documents')
        .select(`
          *,
          students (
            id,
            student_id_number,
            full_name,
            program_type
          ),
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }
      if (docType) {
        query = query.eq('doc_type', docType);
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = data || [];
      if (search) {
        const lowerSearch = search.toLowerCase();
        results = results.filter(d =>
          d.students?.full_name?.toLowerCase().includes(lowerSearch) ||
          d.students?.student_id_number?.toLowerCase().includes(lowerSearch)
        );
      }

      return results;
    } catch (err) {
      console.error('Error fetching all documents:', err);
      throw err;
    }
  },
};
