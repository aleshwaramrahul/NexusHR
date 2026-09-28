import React from 'react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { 
  Building2, 
  Bell, 
  Search, 
  UserCheck, 
  ShieldCheck, 
  LogOut, 
  Database,
  Layers,
  KeyRound
} from 'lucide-react';

interface NavbarProps {
  onOpenLogin: () => void;
  onOpenSupabaseModal: () => void;
  onOpenChangePassword: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin, onOpenSupabaseModal, onOpenChangePassword }) => {
  const { user, employee, role, switchRole, logout, isLoggedIn } = useAuth();
  const supabaseActive = isSupabaseConfigured();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">NexusHR</span>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                  WorkforceOS
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Employee Management Portal</p>
            </div>
          </div>

          {/* Quick Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search employees, tasks, departments..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Actions & User Menu */}
          <div className="flex items-center space-x-3">
            
            {/* Notifications */}
            <button className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white"></span>
            </button>

            {/* User Profile / Auth Toggle */}
            {isLoggedIn ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <img
                  src={
                    employee?.profileImage ||
                    (role === 'ADMIN'
                      ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
                      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')
                  }
                  alt={user?.name}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20"
                />
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 leading-tight capitalize">
                    {role.toLowerCase()} • {employee?.department || 'Staff'}
                  </p>
                </div>
                
                {/* Change Password Button */}
                <button
                  onClick={onOpenChangePassword}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Change Password"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-sm transition-all"
              >
                Sign In
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
