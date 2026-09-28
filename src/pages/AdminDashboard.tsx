import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { AdminDashboardStats, Task, LeaveRequest } from '../types';
import { 
  Users, 
  CheckSquare, 
  Clock, 
  CalendarOff, 
  TrendingUp, 
  UserPlus, 
  PlusCircle, 
  ArrowUpRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

interface AdminDashboardProps {
  onOpenAddEmployee: () => void;
  onOpenCreateTask: () => void;
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenAddEmployee,
  onOpenCreateTask,
  onNavigateTab
}) => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const s = await storageService.fetchAdminStatsRealtime();
      setStats(s);
      const tasks = await storageService.fetchTasksRealtime();
      setRecentTasks(tasks.slice(0, 5));
      const leaves = await storageService.fetchLeavesRealtime();
      setPendingLeaves(leaves.filter(l => l.status === 'PENDING').slice(0, 3));
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    }
  };

  if (!stats) return null;

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
          <Building className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 space-y-1">
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">WorkforceOS Executive Overview</h1>
          <p className="text-xs text-indigo-200 max-w-xl">
            Real-time operations monitor for employee directory, task completion velocity, attendance logs, and time-off requests.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3 relative z-10">
          <button
            onClick={onOpenAddEmployee}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
          <button
            onClick={onOpenCreateTask}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Employees */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Staff</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalEmployees}</h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>{stats.activeEmployees} Active Members</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Tasks</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.totalTasks}</h3>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">
              <span>{stats.completedTasks} Completed • {stats.inProgressTasks} In Progress</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Attendance Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Today's Attendance</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.attendance.present}</h3>
            <p className="text-[11px] text-amber-600 font-medium mt-1">
              <span>{stats.attendance.absent} Absent / Not Checked In</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Leaves</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.pendingLeaves}</h3>
            <p className="text-[11px] text-rose-600 font-medium mt-1">
              <span>Requires HR Approval</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
            <CalendarOff className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Task Progress Bar Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Task Completion Breakdown</h3>
              <p className="text-xs text-slate-500">Distribution of company tasks across workflows</p>
            </div>
            <button
              onClick={() => onNavigateTab('tasks')}
              className="text-xs text-indigo-600 font-semibold flex items-center hover:underline"
            >
              <span>View All Tasks</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Completed Tasks</span>
                <span className="text-emerald-700 font-bold">{stats.completedTasks} ({Math.round((stats.completedTasks / (stats.totalTasks || 1)) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(stats.completedTasks / (stats.totalTasks || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">In Progress Tasks</span>
                <span className="text-indigo-700 font-bold">{stats.inProgressTasks} ({Math.round((stats.inProgressTasks / (stats.totalTasks || 1)) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(stats.inProgressTasks / (stats.totalTasks || 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-600">Pending Tasks</span>
                <span className="text-amber-700 font-bold">{stats.pendingTasks} ({Math.round((stats.pendingTasks / (stats.totalTasks || 1)) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(stats.pendingTasks / (stats.totalTasks || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid Pill */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs font-bold text-slate-900">{stats.totalTasks}</span>
              <span className="block text-[10px] text-slate-500">Total Tasks</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs font-bold text-emerald-600">88.5%</span>
              <span className="block text-[10px] text-slate-500">On-Time Velocity</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-xs font-bold text-indigo-600">4.2 / 5</span>
              <span className="block text-[10px] text-slate-500">Avg Output Index</span>
            </div>
          </div>
        </div>

        {/* Pending Time Off Action Cards */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Pending Leave Approvals</h3>
              <button
                onClick={() => onNavigateTab('leaves')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Manage
              </button>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p>All leave requests reviewed!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeaves.map(leave => (
                  <div key={leave.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{leave.employeeName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-amber-100 text-amber-800">
                        {leave.leaveType}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1">
                      {leave.fromDate} to {leave.toDate} ({leave.numberOfDays} days)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('leaves')}
            className="w-full mt-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-all flex items-center justify-center space-x-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open Leave Manager</span>
          </button>
        </div>

      </div>

      {/* Recent Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Assigned Tasks</h3>
            <p className="text-xs text-slate-500">Latest active assignments across engineering, design & marketing</p>
          </div>
          <button
            onClick={() => onNavigateTab('tasks')}
            className="text-xs text-indigo-600 font-semibold hover:underline"
          >
            View All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Task Title</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTasks.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{t.title}</td>
                  <td className="py-3 px-4 text-slate-600">{t.employeeName || 'Staff'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' :
                      t.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                      t.status === 'IN_PROGRESS' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{t.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
