import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const settingsService = {
  /**
   * Get all registered profiles
   */
  async getProfiles() {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching profiles:', err);
      return [];
    }
  },

  /**
   * Update profile role or active status
   */
  async updateProfile(id, { role, is_active }, actorProfile) {
    if (!isSupabaseConfigured) throw new Error('Supabase belum terhubung.');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role, is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert([
        {
          actor_id: actorProfile?.id || null,
          actor_email: actorProfile?.email || 'system',
          action: 'UPDATE_PROFILE_ROLE',
          entity_type: 'profile',
          entity_id: id,
          change_summary: `Memperbarui role ke "${role}", aktif: ${is_active}`,
        },
      ]);

      return data;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  },

  /**
   * Get internal allowlist records
   */
  async getAllowlist() {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('internal_allowlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching allowlist:', err);
      return [];
    }
  },

  /**
   * Add email to internal allowlist
   */
  async addAllowlistEmail({ email, default_role = 'sensei_staff', full_name = '', notes = '' }, actorProfile) {
    if (!isSupabaseConfigured) throw new Error('Supabase belum terhubung.');

    try {
      const { data, error } = await supabase
        .from('internal_allowlist')
        .insert([
          {
            email: email.trim().toLowerCase(),
            default_role,
            full_name: full_name.trim(),
            notes: notes.trim(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert([
        {
          actor_id: actorProfile?.id || null,
          actor_email: actorProfile?.email || 'system',
          action: 'ADD_ALLOWLIST',
          entity_type: 'internal_allowlist',
          entity_id: data.id,
          change_summary: `Menambahkan email ${email} (${default_role}) ke allowlist`,
        },
      ]);

      return data;
    } catch (err) {
      console.error('Error adding to allowlist:', err);
      throw err;
    }
  },

  /**
   * Delete email from internal allowlist
   */
  async deleteAllowlistEmail(id, email, actorProfile) {
    if (!isSupabaseConfigured) throw new Error('Supabase belum terhubung.');

    try {
      const { error } = await supabase
        .from('internal_allowlist')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await supabase.from('audit_logs').insert([
        {
          actor_id: actorProfile?.id || null,
          actor_email: actorProfile?.email || 'system',
          action: 'DELETE_ALLOWLIST',
          entity_type: 'internal_allowlist',
          entity_id: id,
          change_summary: `Menghapus email ${email} dari allowlist`,
        },
      ]);

      return true;
    } catch (err) {
      console.error('Error deleting from allowlist:', err);
      throw err;
    }
  },

  /**
   * Fetch recent audit logs
   */
  async getAuditLogs(limit = 50) {
    if (!isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      return [];
    }
  },
};
