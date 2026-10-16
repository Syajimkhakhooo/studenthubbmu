import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if credentials are validly provided
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-supabase-anon-key')
);

// If not configured, instantiate client with placeholder or null to avoid runtime throw,
// but guard all calls via isSupabaseConfigured.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'bmu_student_hub_auth',
      },
    })
  : createClient('https://placeholder-bmu.supabase.co', 'placeholder-anon-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

/**
 * Helper to check connection to Supabase database
 */
export async function testSupabaseConnection() {
  if (!isSupabaseConfigured) {
    return {
      connected: false,
      message: 'Kredensial Supabase (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) belum dikonfigurasi di file .env.local',
    };
  }

  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {
      return {
        connected: false,
        message: `Terhubung ke URL Supabase, namun terjadi error: ${error.message} (Pastikan SQL Migration sudah dijalankan).`,
      };
    }
    return {
      connected: true,
      message: 'Koneksi ke Supabase aktif dan siap digunakan.',
    };
  } catch (err) {
    return {
      connected: false,
      message: `Gagal menghubungi Supabase: ${err.message}`,
    };
  }
}
