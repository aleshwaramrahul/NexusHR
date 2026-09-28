import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Employee, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  role: UserRole;
  isLoggedIn: boolean;
  login: (email: string, role: UserRole, password?: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const DEFAULT_ADMIN: User = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  name: 'Sarah Jenkins',
  email: 'admin@example.com',
  role: 'ADMIN',
  isActive: true
};

const DEFAULT_EMPLOYEE_USER: User = {
  id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  name: 'Alex Morgan',
  email: 'employee@example.com',
  role: 'EMPLOYEE',
  isActive: true
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('nexushr_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('nexushr_current_user', JSON.stringify(user));
      if (user.role === 'EMPLOYEE') {
        const emp = storageService.getEmployeeById(user.id);
        if (emp) {
          setEmployee(emp);
        } else {
          const empByEmail = storageService.getEmployees().find(e => e.email === user.email);
          setEmployee(empByEmail || null);
        }
      } else {
        setEmployee(null);
      }
    } else {
      localStorage.removeItem('nexushr_current_user');
      setEmployee(null);
    }
  }, [user]);

  // Restore Supabase Auth session on mount and listen to auth state changes
  useEffect(() => {
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          loadSupabaseUserProfile(session.user);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          loadSupabaseUserProfile(session.user);
        } else if (_event === 'SIGNED_OUT') {
          setUser(null);
          setEmployee(null);
          localStorage.removeItem('nexushr_current_user');
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const loadSupabaseUserProfile = async (authUser: any) => {
    try {
      // 1. Check if user is an employee in `employees` table by user_id
      const { data: empData } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (empData) {
        if (empData.status === 'INACTIVE') {
          console.warn('Employee is INACTIVE');
          return;
        }

        const mappedEmp: Employee = {
          id: empData.id,
          userId: empData.user_id,
          employeeId: empData.employee_id,
          name: empData.name,
          email: empData.email,
          phone: empData.phone || '',
          department: empData.department,
          position: empData.position,
          joiningDate: empData.joining_date,
          profileImage: empData.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          status: empData.status || 'INVITED',
          createdAt: empData.created_at
        };

        setEmployee(mappedEmp);
        setUser({
          id: authUser.id,
          name: empData.name,
          email: authUser.email || empData.email,
          role: 'EMPLOYEE',
          isActive: true
        });
        return;
      }

      // 2. Check if user is an admin in `users` table
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle();

      if (userData && userData.role === 'ADMIN') {
        setUser({
          id: authUser.id,
          name: authUser.email ? authUser.email.split('@')[0] : 'Admin',
          email: authUser.email,
          role: 'ADMIN',
          isActive: userData.is_active ?? true
        });
        return;
      }
    } catch (err) {
      console.error('Error loading Supabase user profile:', err);
    }
  };

  const login = async (email: string, role: UserRole, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      // EMPLOYEE LOGIN: Always authenticate with Supabase Auth (signInWithPassword)
      if (role === 'EMPLOYEE') {
        if (!password) {
          throw new Error('Please enter your account password.');
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });

        if (authError || !authData.user) {
          throw new Error(authError?.message || 'Invalid email or password. Please check your credentials.');
        }

        const authUser = authData.user;

        // Fetch employee profile from `employees` table by user_id or email
        let { data: empData } = await supabase
          .from('employees')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (!empData) {
          // Fallback match by email if user_id link is pending
          const { data: empByEmail } = await supabase
            .from('employees')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();

          empData = empByEmail;
        }

        if (!empData) {
          throw new Error('No employee profile found for this account. Please contact HR.');
        }

        if (empData.status === 'INACTIVE') {
          throw new Error('Your employee account is inactive. Please contact HR.');
        }

        const mappedEmp: Employee = {
          id: empData.id,
          userId: empData.user_id || authUser.id,
          employeeId: empData.employee_id,
          name: empData.name,
          email: empData.email,
          phone: empData.phone || '',
          department: empData.department,
          position: empData.position,
          joiningDate: empData.joining_date,
          profileImage: empData.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          status: empData.status || 'INVITED',
          createdAt: empData.created_at
        };

        const loggedUser: User = {
          id: authUser.id,
          name: empData.name,
          email: authUser.email || empData.email,
          role: 'EMPLOYEE',
          isActive: true
        };

        setEmployee(mappedEmp);
        setUser(loggedUser);
        return;
      }

      // ADMIN LOGIN: Try Supabase Auth first, then fallback to users table / demo admin
      if (role === 'ADMIN') {
        if (password) {
          const { data: authData } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          });

          if (authData?.user) {
            const loggedAdmin: User = {
              id: authData.user.id,
              name: authData.user.email ? authData.user.email.split('@')[0] : 'Admin',
              email: authData.user.email || cleanEmail,
              role: 'ADMIN',
              isActive: true
            };
            setUser(loggedAdmin);
            return;
          }
        }

        // Fallback: Check existing `users` table for Admin
        const { data: dbUserData } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (dbUserData && dbUserData.role === 'ADMIN') {
          if (password && dbUserData.password_hash && dbUserData.password_hash !== password) {
            throw new Error('Incorrect password. Please enter your updated account password.');
          }

          const loggedAdmin: User = {
            id: dbUserData.id,
            name: dbUserData.email.split('@')[0],
            email: dbUserData.email,
            role: 'ADMIN',
            isActive: dbUserData.is_active ?? true
          };
          setUser(loggedAdmin);
          return;
        }
      }
    }

    // Default Demo & Fallback Auth when Supabase is not active
    if (role === 'ADMIN' || cleanEmail.includes('admin')) {
      setUser(DEFAULT_ADMIN);
    } else {
      setUser(DEFAULT_EMPLOYEE_USER);
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
    setEmployee(null);
    localStorage.removeItem('nexushr_current_user');
  };

  const switchRole = (newRole: UserRole) => {
    if (newRole === 'ADMIN') {
      setUser(DEFAULT_ADMIN);
    } else {
      setUser(DEFAULT_EMPLOYEE_USER);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        role: user ? user.role : 'EMPLOYEE',
        isLoggedIn: !!user,
        login,
        logout,
        switchRole
      }}
    >
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
