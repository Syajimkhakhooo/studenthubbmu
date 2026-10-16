import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedEmail, setDeniedEmail] = useState('');

  // Fetch user profile from database and verify internal allowlist status
  async function fetchUserProfile(userId, userEmail) {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      }

      if (data && data.is_active) {
        setProfile(data);
        setAccessDenied(false);
        setDeniedEmail('');
        return data;
      } else {
        // User exists in auth, but either has no profile or is_active is false
        setProfile(null);
        setAccessDenied(true);
        setDeniedEmail(userEmail || (data ? data.email : ''));
        return null;
      }
    } catch (err) {
      console.error('Error checking user access:', err);
      setProfile(null);
      return null;
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function initSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Session error:', error.message);
        }

        if (session?.user && mounted) {
          setUser(session.user);
          await fetchUserProfile(session.user.id, session.user.email);
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id, session.user.email);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setAccessDenied(false);
        setDeniedEmail('');
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Google OAuth Login
  async function loginWithGoogle() {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase belum dikonfigurasi di file .env.local');
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
  }

  // Email/Password Login
  async function loginWithEmail(email, password) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase belum dikonfigurasi di file .env.local');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      setUser(data.user);
      const prof = await fetchUserProfile(data.user.id, data.user.email);
      if (!prof) {
        throw new Error('Akun Anda belum terdaftar dalam daftar staf aktif BMU.');
      }
    }

    return data;
  }

  // Request password reset
  async function requestPasswordReset(email) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase belum dikonfigurasi di file .env.local');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
  }

  // Logout
  async function logout() {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setAccessDenied(false);
    setDeniedEmail('');
  }

  const value = {
    user,
    profile,
    role: profile?.role || null,
    isAdmin: profile?.role === 'admin',
    isManager: profile?.role === 'operational_manager',
    isPrincipal: profile?.role === 'principal',
    isStaff: Boolean(profile?.is_active),
    loading,
    accessDenied,
    deniedEmail,
    isSupabaseConfigured,
    loginWithGoogle,
    loginWithEmail,
    requestPasswordReset,
    logout,
    refreshProfile: () => (user ? fetchUserProfile(user.id, user.email) : null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
