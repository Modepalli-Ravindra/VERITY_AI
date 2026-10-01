import React, { createContext, useContext, useEffect, useState } from 'react';
import { insforge } from '../lib/insforge';

export interface User {
  id: string;
  email?: string;
  name?: string;
  user_metadata?: {
    display_name?: string;
    full_name?: string;
    name?: string;
  };
  profile?: {
    full_name?: string;
    display_name?: string;
    email?: string;
  };
}

export const getUserDisplayName = (user: User | null): string => {
  if (!user) return '';
  const fullName =
    user.profile?.full_name ||
    user.profile?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.name ||
    user.name;

  if (fullName && fullName.trim()) {
    return fullName.trim();
  }

  if (user.email) {
    return user.email.split('@')[0];
  }

  return 'User';
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ data?: any; error?: any }>;
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  verifyEmail: (email: string, otp: string) => Promise<{ data?: any; error?: any }>;
  resendVerificationCode: (email: string) => Promise<{ data?: any; error?: any }>;
  updateProfile: (fullName: string) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (authUser: any): Promise<User> => {
    if (!authUser) return authUser;
    let profile: any = null;

    // 1. Check local storage cache for user profile
    try {
      const cached = localStorage.getItem(`verity_profile_${authUser.id}`);
      if (cached) {
        profile = JSON.parse(cached);
      }
    } catch {
      // ignore
    }

    // 2. Fetch profile row from InsForge database
    try {
      const res = await insforge.database
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (res?.data) {
        profile = {
          ...profile,
          ...res.data
        };
      }
    } catch (err) {
      console.warn('InsForge profile query error:', err);
    }

    const resolvedName =
      profile?.full_name ||
      profile?.display_name ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.display_name ||
      authUser.user_metadata?.name ||
      authUser.name;

    return {
      ...authUser,
      name: resolvedName || authUser.name,
      user_metadata: {
        ...authUser.user_metadata,
        full_name: resolvedName || authUser.user_metadata?.full_name,
        display_name: resolvedName || authUser.user_metadata?.display_name,
        name: resolvedName || authUser.user_metadata?.name
      },
      profile: {
        ...profile,
        full_name: resolvedName || profile?.full_name,
        display_name: resolvedName || profile?.display_name,
        email: authUser.email
      }
    };
  };

  useEffect(() => {
    // Check initial session
    const getInitialSession = async () => {
      try {
        const { data } = await insforge.auth.getCurrentUser();
        if (data?.user) {
          // If we have a pending name in local storage for this email, try to apply it
          const email = data.user.email;
          if (email) {
            await applyPendingNameIfAny(data.user.id, email);
          }
          const fullUser = await fetchUserProfile(data.user);
          setUser(fullUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();
  }, []);

  const applyPendingNameIfAny = async (userId: string, email: string) => {
    try {
      const pendingName = localStorage.getItem(`verity_pending_name_${email}`);
      if (pendingName) {
        try {
           await insforge.database.from('profiles').upsert([{
              user_id: userId,
              email,
              full_name: pendingName,
              display_name: pendingName
           }]);
        } catch (err) {
           console.warn('Upsert profile post-verify failed', err);
        }
        try {
           localStorage.setItem(`verity_profile_${userId}`, JSON.stringify({
             full_name: pendingName,
             display_name: pendingName
           }));
           localStorage.removeItem(`verity_pending_name_${email}`);
        } catch {}
        
        try {
           if ((insforge.auth as any).updateUser) {
              await (insforge.auth as any).updateUser({ data: { full_name: pendingName, name: pendingName } });
           }
        } catch {}
      }
    } catch (err) {}
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const nameVal = (displayName && displayName.trim()) || email.split('@')[0];
      const res = await insforge.auth.signUp({
        email,
        password,
        name: nameVal
      });

      if (res.data?.user) {
        const userId = res.data.user.id;
        try {
          await insforge.database.from('profiles').insert([{
            user_id: userId,
            email,
            full_name: nameVal,
            display_name: nameVal
          }]);
        } catch {
          // ignore duplicate insert
        }

        try {
          localStorage.setItem(`verity_profile_${userId}`, JSON.stringify({
            full_name: nameVal,
            display_name: nameVal
          }));
        } catch {
          // ignore
        }

        const fullUser = await fetchUserProfile(res.data.user);
        setUser(fullUser);
      }
      
      try {
        localStorage.setItem(`verity_pending_name_${email}`, nameVal);
      } catch {}

      return res;
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await insforge.auth.signInWithPassword({ email, password });
      if (res.data?.user) {
        await applyPendingNameIfAny(res.data.user.id, email);
        const fullUser = await fetchUserProfile(res.data.user);
        setUser(fullUser);
      }
      return res;
    } catch (error: any) {
      return { error };
    }
  };

  const verifyEmail = async (email: string, otp: string) => {
    try {
      const res = await insforge.auth.verifyEmail({ email, otp });
      if (res.data?.user) {
        await applyPendingNameIfAny(res.data.user.id, email);
        const fullUser = await fetchUserProfile(res.data.user);
        setUser(fullUser);
      }
      return res;
    } catch (error: any) {
      return { error };
    }
  };

  const resendVerificationCode = async (email: string) => {
    try {
      const res = await insforge.auth.resendVerificationEmail({ email });
      return res;
    } catch (error: any) {
      return { error };
    }
  };

  const updateProfile = async (fullName: string) => {
    if (!user) return { error: { message: 'Not authenticated' } };
    try {
      const cleanName = fullName.trim();
      if (!cleanName) {
        return { error: { message: 'Full name cannot be empty' } };
      }

      // 1. Check if profile row exists for this user_id in database
      let dbSuccess = false;
      try {
        const { data: existing } = await insforge.database
          .from('profiles')
          .select('*')
          .eq('user_id', user.id);

        if (existing && existing.length > 0) {
          const updateRes = await insforge.database
            .from('profiles')
            .update({
              full_name: cleanName,
              display_name: cleanName
            })
            .eq('user_id', user.id);
          
          if (!updateRes.error) {
            dbSuccess = true;
          }
        }
      } catch (err) {
        console.warn('Database update profile error:', err);
      }

      if (!dbSuccess) {
        try {
          await insforge.database
            .from('profiles')
            .upsert([{
              user_id: user.id,
              email: user.email,
              full_name: cleanName,
              display_name: cleanName
            }]);
        } catch (upsertErr) {
          console.warn('Database upsert profile error:', upsertErr);
        }
      }

      // 2. Try setProfile on auth if supported
      try {
        if ((insforge.auth as any).setProfile) {
          await (insforge.auth as any).setProfile({ name: cleanName });
        } else if ((insforge.auth as any).updateUser) {
          await (insforge.auth as any).updateUser({
            data: { full_name: cleanName, display_name: cleanName, name: cleanName }
          });
        }
      } catch (authErr) {
        console.warn('Auth setProfile error:', authErr);
      }

      // 3. Cache to localStorage
      try {
        localStorage.setItem(`verity_profile_${user.id}`, JSON.stringify({
          full_name: cleanName,
          display_name: cleanName
        }));
      } catch {
        // ignore
      }

      // 4. Update active user state synchronously
      const updatedUser: User = {
        ...user,
        name: cleanName,
        user_metadata: {
          ...user.user_metadata,
          full_name: cleanName,
          display_name: cleanName,
          name: cleanName
        },
        profile: {
          ...user.profile,
          full_name: cleanName,
          display_name: cleanName,
          email: user.email
        }
      };

      setUser(updatedUser);
      return { data: updatedUser };
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      return { error: { message: error.message || 'Failed to save profile' } };
    }
  };

  const signOut = async () => {
    try {
      if (user) {
        const keysToRemove = [
          `verity_analyze_text_${user.id}`,
          `verity_analyze_result_${user.id}`,
          `verity_paraphrase_orig_${user.id}`,
          `verity_paraphrase_hum_${user.id}`,
          `verity_paraphrase_res_${user.id}`,
          `verity_compare_orig_${user.id}`,
          `verity_compare_hum_${user.id}`,
          `verity_compare_ores_${user.id}`,
          `verity_compare_hres_${user.id}`
        ];
        keysToRemove.forEach(k => localStorage.removeItem(k));
      }
      
      const genericKeysToRemove = [
        'verity_analyze_text',
        'verity_analyze_result',
        'verity_paraphrase_orig',
        'verity_paraphrase_hum',
        'verity_paraphrase_res',
        'verity_compare_orig',
        'verity_compare_hum',
        'verity_compare_ores',
        'verity_compare_hres'
      ];
      genericKeysToRemove.forEach(k => localStorage.removeItem(k));

      await insforge.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, verifyEmail, resendVerificationCode, updateProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
