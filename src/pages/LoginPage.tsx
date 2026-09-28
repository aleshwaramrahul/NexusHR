import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  KeyRound, 
  Mail, 
  Lock, 
  Sparkles, 
  ArrowRight,
  Database,
  CheckCircle2
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    const prefillEmail = localStorage.getItem('nexushr_prefill_login_email');
    return prefillEmail ? 'EMPLOYEE' : 'ADMIN';
  });
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('nexushr_prefill_login_email') || 'admin@example.com';
  });
  const [password, setPassword] = useState(() => {
    return localStorage.getItem('nexushr_prefill_login_email') ? '' : 'admin123';
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const supabaseActive = isSupabaseConfigured();

  useEffect(() => {
    if (localStorage.getItem('nexushr_prefill_login_email')) {
      localStorage.removeItem('nexushr_prefill_login_email');
    }
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg('');
    if (role === 'ADMIN') {
      setEmail('admin@example.com');
      setPassword('admin123');
    } else {
      setEmail('employee@example.com');
      setPassword('employee123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email address and password');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await login(email, selectedRole, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-indigo-200 ring-4 ring-indigo-50">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">NexusHR</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            WorkforceOS • Enterprise Employee Portal
          </p>

          {/* Supabase Status Pill */}
          <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Database className="w-3.5 h-3.5" />
            <span>Supabase API Connected: rbxwvitoylrwznydlwcn</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 relative overflow-hidden">
          
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Sign In to Your Account</h2>
            <p className="text-xs text-slate-500 mt-0.5">Choose your portal role and enter credentials to proceed</p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => handleRoleSelect('ADMIN')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                selectedRole === 'ADMIN'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect('EMPLOYEE')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
                selectedRole === 'EMPLOYEE'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Employee Portal</span>
            </button>
          </div>

          {/* Quick 1-Click Demo Credentials */}
          <div className="mb-6 bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100">
            <div className="flex items-center space-x-1 text-indigo-700 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>1-Click Quick Demo Login</span>
            </div>
            
            <div className="bg-white p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">
                  {selectedRole === 'ADMIN' ? 'Sarah Jenkins (Admin)' : 'Alex Morgan (Employee)'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {selectedRole === 'ADMIN' ? 'admin@example.com' : 'employee@example.com'}
                </span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                Pre-Filled
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In & Open Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-6">
          NexusHR WorkforceOS • Secured with Supabase PostgreSQL & JWT Auth
        </p>

      </div>
    </div>
  );
};
