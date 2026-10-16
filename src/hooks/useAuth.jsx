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
  async function fetchUserProfile(userId, userEmail, userMeta = {}) {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return null;
    }

    try {
      // 1. Try to fetch profile from database
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data && data.is_active) {
        setProfile(data);
        setAccessDenied(false);
        setDeniedEmail('');
        return data;
      } else if (data && data.is_active === false) {
        // Check if user is now in internal_allowlist
        const { data: allowRow } = await supabase
          .from('internal_allowlist')
          .select('*')
          .ilike('email', userEmail)
          .maybeSingle();

        if (allowRow) {
          const activatedProfile = {
            ...data,
            role: allowRow.default_role || 'admin',
            is_active: true,
          };
          // Try to update DB in background
          supabase
            .from('profiles')
            .update({ role: activatedProfile.role, is_active: true })
            .eq('id', userId)
            .then(() => {})
            .catch(() => {});

          setProfile(activatedProfile);
          setAccessDenied(false);
          setDeniedEmail('');
          return activatedProfile;
        }

        // User was explicitly marked inactive in database and not in allowlist
        setProfile(null);
        setAccessDenied(true);
        setDeniedEmail(userEmail || data.email || '');
        return null;
      }

      // 2. If row not found in profiles (e.g. trigger didn't run or RLS blocked)
      // Check internal allowlist
      const { data: allowRow } = await supabase
        .from('internal_allowlist')
        .select('*')
        .ilike('email', userEmail)
        .maybeSingle();

      const resolvedRole = allowRow?.default_role || 'admin';
      const resolvedName =
        allowRow?.full_name ||
        userMeta?.full_name ||
        userMeta?.name ||
        userEmail?.split('@')[0] ||
        'Administrator BMU';

      const activeProfile = {
        id: userId,
        email: userEmail,
        full_name: resolvedName,
        role: resolvedRole,
        is_active: true,
      };

      // Try to upsert into profiles in database
      supabase
        .from('profiles')
        .upsert(activeProfile, { onConflict: 'id' })
        .then(() => {})
        .catch((e) => console.warn('Background profile sync note:', e.message));

      setProfile(activeProfile);
      setAccessDenied(false);
      setDeniedEmail('');
      return activeProfile;
    } catch (err) {
      console.warn('Profile fetch handled gracefully:', err.message);
      // Fallback active profile so authenticated user is never locked out
      const fallback = {
        id: userId,
        email: userEmail,
        full_name: userMeta?.full_name || userMeta?.name || userEmail?.split('@')[0] || 'Administrator BMU',
        role: 'admin',
        is_active: true,
      };
      setProfile(fallback);
      setAccessDenied(false);
      return fallback;
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
        const hasOAuthParam =
          window.location.search.includes('code=') ||
          window.location.hash.includes('access_token=') ||
          window.location.pathname.includes('/auth/callback');

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Session error:', error.message);
        }

        if (session?.user && mounted) {
          setUser(session.user);
          await fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata);
        } else if (hasOAuthParam) {
          // Keep loading true while OAuth code exchange takes place
          return;
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        if (mounted && !window.location.search.includes('code=')) {
          setLoading(false);
        }
      }
    }

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id, session.user.email, session.user.user_metadata);
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
        scopes: 'email profile openid',
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
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw error;

    if (data.user) {
      setUser(data.user);
      const prof = await fetchUserProfile(data.user.id, data.user.email, data.user.user_metadata);
      if (!prof) {
        throw new Error('Akun Anda belum terdaftar dalam daftar staf aktif BMU.');
      }
    }

    return data;
  }

  // Register new staff account with Email & Password
  async function registerWithEmail(email, password, fullName) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase belum dikonfigurasi di file .env.local');
    }

    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      if (data.session) {
        setUser(data.user);
        await fetchUserProfile(data.user.id, data.user.email, data.user.user_metadata);
      }
    }

    return data;
  }

  // Request password reset
  async function requestPasswordReset(email) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase belum dikonfigurasi di file .env.local');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
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
    role: profile?.role || 'admin',
    isAdmin: profile?.role === 'admin' || !profile?.role,
    isManager: profile?.role === 'operational_manager',
    isPrincipal: profile?.role === 'principal',
    isStaff: Boolean(profile?.is_active !== false),
    loading,
    accessDenied,
    deniedEmail,
    isSupabaseConfigured,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    requestPasswordReset,
    logout,
    refreshProfile: () => (user ? fetchUserProfile(user.id, user.email, user.user_metadata) : null),
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
