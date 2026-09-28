import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldCheck, UserCheck, X, KeyRound, Mail, Sparkles } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');

  if (!isOpen) return null;

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'ADMIN') {
      setEmail('admin@example.com');
      setPassword('admin123');
    } else {
      setEmail('employee@example.com');
      setPassword('employee123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, selectedRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Sign In to NexusHR</h3>
          <p className="text-xs text-slate-500 mt-1">
            Access your Employee Management Portal
          </p>
        </div>

        {/* 1-Click Quick Demo Login Shortcuts */}
        <div className="mb-5 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
          <div className="flex items-center space-x-1 text-indigo-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>1-Click Quick Demo Credentials</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectRole('ADMIN')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                selectedRole === 'ADMIN'
                  ? 'bg-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                  : 'bg-white/50 border-slate-200 hover:bg-white'
              }`}
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>ADMIN</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">admin@example.com</p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRole('EMPLOYEE')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                selectedRole === 'EMPLOYEE'
                  ? 'bg-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                  : 'bg-white/50 border-slate-200 hover:bg-white'
              }`}
            >
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>EMPLOYEE</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">employee@example.com</p>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
          >
            Authenticate & Access Portal
          </button>
        </form>

      </div>
    </div>
  );
};
