import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthUser, StudentProfile } from '../types';
import { firebaseService } from '../services/firebaseService';

interface AuthContextType {
  user: AuthUser | null;
  profile: StudentProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ user: AuthUser; profile?: StudentProfile }>;
  registerStudent: (params: {
    fullName: string;
    collegeEmail: string;
    studentId: string;
    department: string;
    password: string;
  }) => Promise<{ user: AuthUser; profile: StudentProfile }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<StudentProfile, 'fullName' | 'department' | 'phone' | 'bio'>>) => Promise<StudentProfile>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfileForUser = useCallback(async (u: AuthUser) => {
    try {
      const p = await firebaseService.getStudentProfile(u.uid);
      setProfile(p);
    } catch (err) {
      console.warn('Failed to fetch student profile:', err);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfileForUser(user);
    }
  }, [user, fetchProfileForUser]);

  useEffect(() => {
    // Initial user read
    const currentUser = firebaseService.getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      fetchProfileForUser(currentUser).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Subscribe to auth state transitions
    const unsubscribe = firebaseService.onAuthStateChanged(newUser => {
      setUser(newUser);
      if (newUser) {
        fetchProfileForUser(newUser);
      } else {
        setProfile(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [fetchProfileForUser]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await firebaseService.login(email, pass);
      setUser(res.user);
      setProfile(res.profile ?? null);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const registerStudent = async (params: {
    fullName: string;
    collegeEmail: string;
    studentId: string;
    department: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const res = await firebaseService.registerStudent(params);
      setUser(res.user);
      setProfile(res.profile);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseService.logout();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Pick<StudentProfile, 'fullName' | 'department' | 'phone' | 'bio'>>) => {
    if (!user) throw new Error('User not logged in');
    const updated = await firebaseService.updateStudentProfile(user.uid, updates);
    setProfile(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        registerStudent,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
