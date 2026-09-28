import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Building2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  LogIn
} from 'lucide-react';

interface SetPasswordProps {
  initialEmail?: string;
  onSuccess?: () => void;
  onNavigateLogin?: () => void;
}

export const SetPassword: React.FC<SetPasswordProps> = ({
  initialEmail = '',
  onSuccess,
  onNavigateLogin
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // 1. Check URL search param (?email=...)
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
      return;
    }

    // 2. Check URL hash (e.g. Supabase recovery or invite token hash)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashEmail = hashParams.get('email');
      if (hashEmail) {
        setEmail(hashEmail);
        return;
      }
    }

    // 3. Check Supabase auth session user
    if (isSupabaseConfigured()) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) {
          setEmail(data.user.email);
        }
      });
    }

    // 4. Fallback: check localStorage for last invited employee email
    const lastEmail = localStorage.getItem('nexushr_last_invited_email');
    if (lastEmail) {
      setEmail(prev => prev || lastEmail);
    }
  }, []);

  const handleNavigateLogin = () => {
    const targetEmail = email.trim() || localStorage.getItem('nexushr_last_invited_email') || '';
    if (targetEmail) {
      localStorage.setItem('nexushr_prefill_login_email', targetEmail);
    }
    if (onNavigateLogin) {
      onNavigateLogin();
    } else {
      window.location.href = '/';
    }
  };

  const isMinLength = newPassword.length >= 6;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isMinLength) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (!isMatch) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    setLoading(true);

    try {
      let resolvedEmail = email.trim();

      if (isSupabaseConfigured()) {
        let authUpdated = false;
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          const { data: updateData, error: authErr } = await supabase.auth.updateUser({
            password: newPassword
          });
          if (!authErr) {
            authUpdated = true;
            if (!resolvedEmail && updateData?.user?.email) {
              resolvedEmail = updateData.user.email;
            }
          }
        }

        if (!resolvedEmail) {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user?.email) {
            resolvedEmail = userData.user.email;
          }
        }

        if (!resolvedEmail) {
          const storedLastEmail = localStorage.getItem('nexushr_last_invited_email');
          if (storedLastEmail) resolvedEmail = storedLastEmail;
        }

        if (resolvedEmail) {
          // Always sync with `users` table password_hash in Supabase
          const { error: dbErr } = await supabase
            .from('users')
            .update({ password_hash: newPassword })
            .eq('email', resolvedEmail);

          if (dbErr && !authUpdated) {
            throw new Error(dbErr.message || 'Failed to update password.');
          }
        } else if (!authUpdated) {
          throw new Error('Could not identify account. Please open the setup link from your invitation email.');
        }
      } else {
        // Fallback local storage update
        const storedUsers = localStorage.getItem('nexushr_users');
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          const index = resolvedEmail 
            ? users.findIndex((u: any) => u.email === resolvedEmail)
            : users.findIndex((u: any) => u.role === 'EMPLOYEE');
          if (index !== -1) {
            users[index].password_hash = newPassword;
            localStorage.setItem('nexushr_users', JSON.stringify(users));
            if (!resolvedEmail) resolvedEmail = users[index].email;
          }
        }
      }

      if (resolvedEmail) {
        setEmail(resolvedEmail);
        localStorage.setItem('nexushr_prefill_login_email', resolvedEmail);
      }

      setSuccessMsg('Your password has been successfully updated! You can now sign in with your new credentials.');
      setNewPassword('');
      setConfirmPassword('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Failed to set password:', err);
      setErrorMsg(err.message || 'Failed to update password. Please try again.');
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
            WorkforceOS • Account Password Setup
          </p>
        </div>

        {/* Set Password Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 relative overflow-hidden">

          <div className="mb-6 flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Set Account Password</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Create a secure password for your NexusHR account
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium space-y-2">
                <div className="flex items-center space-x-2 font-bold text-emerald-900 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Password Updated Successfully!</span>
                </div>
                <p className="text-emerald-700 leading-relaxed">{successMsg}</p>
              </div>

              <button
                type="button"
                onClick={handleNavigateLogin}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {!successMsg && (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">

              <div>
                <label className="block font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Checklist */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-[11px]">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${isMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                  <span className={isMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                    At least 6 characters
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${isMatch ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                  <span className={isMatch ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                    Passwords match
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isMinLength || !isMatch}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Updating Password...</span>
                ) : (
                  <>
                    <span>Set New Password</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {!successMsg && (
            <div className="mt-4 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={handleNavigateLogin}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
              >
                ← Return to Sign In Page
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 mt-6">
          NexusHR WorkforceOS • Secured with Supabase PostgreSQL
        </p>

      </div>
    </div>
  );
};

export default SetPassword;
