import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Clock, 
  CalendarOff, 
  BarChart3, 
  Database,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSupabaseModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSupabaseModal
}) => {
  const { role } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'EMPLOYEE']
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: Users,
      roles: ['ADMIN', 'EMPLOYEE']
    },
    {
      id: 'tasks',
      label: 'Tasks & Projects',
      icon: CheckSquare,
      roles: ['ADMIN', 'EMPLOYEE']
    },
    {
      id: 'attendance',
      label: 'Attendance Log',
      icon: Clock,
      roles: ['ADMIN', 'EMPLOYEE']
    },
    {
      id: 'leaves',
      label: 'Leave Requests',
      icon: CalendarOff,
      roles: ['ADMIN', 'EMPLOYEE']
    },
    {
      id: 'reports',
      label: 'Analytics Reports',
      icon: BarChart3,
      roles: ['ADMIN']
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0 hidden md:flex">
      <div className="space-y-6">
        
        {/* Role Badge Indicator */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Workspace</p>
            <p className="text-xs font-semibold text-slate-800 capitalize">
              {role.toLowerCase()} Portal
            </p>
          </div>
          <span className={`w-2.5 h-2.5 rounded-full ${role === 'ADMIN' ? 'bg-indigo-600' : 'bg-emerald-500'}`}></span>
        </div>

        {/* Navigation Section */}
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Navigation
          </p>
          <nav className="space-y-1">
            {navItems
              .filter(item => item.roles.includes(role))
              .map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-4 border-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                );
              })}
          </nav>
        </div>

      </div>

    </aside>
  );
};
