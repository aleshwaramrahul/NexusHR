import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { EmployeeDashboardStats, Task, AttendanceRecord } from '../types';
import { 
  CheckSquare, 
  Clock, 
  CalendarOff, 
  CheckCircle2, 
  PlayCircle, 
  LogOut, 
  LogIn, 
  UserCheck, 
  Sparkles,
  MessageSquare
} from 'lucide-react';

interface EmployeeDashboardProps {
  onOpenLeaveModal: () => void;
  onSelectTaskForComments: (task: Task) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  onOpenLeaveModal,
  onSelectTaskForComments
}) => {
  const { user, employee } = useAuth();
  const [stats, setStats] = useState<EmployeeDashboardStats | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [todayAtt, setTodayAtt] = useState<AttendanceRecord | null>(null);

  const empId = employee?.id || 'e2222222-2222-2222-2222-222222222222';

  useEffect(() => {
    loadData();
  }, [empId]);

  const loadData = async () => {
    try {
      const s = await storageService.fetchEmployeeStatsRealtime(empId);
      setStats(s);
      setTodayAtt(s.todayAttendance);
      const tasks = await storageService.fetchTasksByEmployeeRealtime(empId);
      setMyTasks(tasks);
    } catch (err) {
      console.error('Error loading employee dashboard data:', err);
    }
  };

  const handleCheckIn = async () => {
    const record = await storageService.checkIn(empId);
    setTodayAtt(record);
    await loadData();
  };

  const handleCheckOut = async () => {
    const record = await storageService.checkOut(empId);
    if (record) {
      setTodayAtt(record);
      await loadData();
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    await storageService.updateTaskStatus(taskId, newStatus);
    await loadData();
  };

  if (!stats) return null;

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <UserCheck className="w-4 h-4" />
            <span>Employee Portal • {employee?.department || 'Engineering'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome Back, {employee?.name || user?.name}!</h1>
          <p className="text-xs text-indigo-200">
            {employee?.position || 'Staff Member'} • EMP ID: {employee?.employeeId || 'EMP-002'}
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={onOpenLeaveModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
          >
            <CalendarOff className="w-4 h-4" />
            <span>Apply Leave</span>
          </button>
        </div>
      </div>

      {/* Attendance & Leave Quick Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Action Widget */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today's Attendance & Time Tracker</h3>
                <p className="text-xs text-slate-500">Record check-in / check-out timestamps for automated log</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                todayAtt?.checkOut 
                  ? 'bg-slate-100 text-slate-700'
                  : todayAtt?.checkIn 
                  ? 'bg-emerald-100 text-emerald-800 animate-pulse' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {todayAtt?.checkOut 
                  ? 'Completed Shift' 
                  : todayAtt?.checkIn 
                  ? 'Active Shift' 
                  : 'Not Checked In'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Check-In Time</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {todayAtt?.checkIn || '-- : --'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Check-Out Time</span>
                <span className="text-sm font-bold text-slate-900 mt-1 block">
                  {todayAtt?.checkOut || '-- : --'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Recorded Hours</span>
                <span className="text-sm font-bold text-indigo-600 mt-1 block">
                  {todayAtt?.workingHours ? `${todayAtt.workingHours} hrs` : '0 hrs'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-2">
            {!todayAtt?.checkIn ? (
              <button
                onClick={handleCheckIn}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Clock In Now</span>
              </button>
            ) : !todayAtt.checkOut ? (
              <button
                onClick={handleCheckOut}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center space-x-2 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Clock Out Now</span>
              </button>
            ) : (
              <div className="w-full py-2.5 bg-slate-100 text-slate-600 text-center font-semibold text-xs rounded-xl">
                ✓ Shift completed for today!
              </div>
            )}
          </div>
        </div>

        {/* Leave Balance Widget */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Time Off Balance</h3>
            <p className="text-xs text-slate-500 mb-4">Remaining available leave quota for 2026</p>

            <div className="text-center py-4 bg-indigo-50/70 border border-indigo-100 rounded-xl mb-3">
              <span className="text-3xl font-extrabold text-indigo-700">{stats.leaveBalance}</span>
              <span className="block text-xs text-indigo-900 font-semibold mt-1">Days Remaining</span>
              <span className="text-[10px] text-slate-500">Out of 18 annual days</span>
            </div>
          </div>

          <button
            onClick={onOpenLeaveModal}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-1"
          >
            <CalendarOff className="w-3.5 h-3.5" />
            <span>Apply For Leave</span>
          </button>
        </div>

      </div>

      {/* Assigned Tasks Workflow */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">My Assigned Tasks ({myTasks.length})</h3>
            <p className="text-xs text-slate-500">Update status as you make progress on deliverables</p>
          </div>
        </div>

        {myTasks.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No tasks assigned to you right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTasks.map(t => (
              <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' :
                      t.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-800'
                    }`}>
                      {t.priority}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{t.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600">{t.description}</p>
                  <p className="text-[11px] text-slate-400">Due: {t.dueDate} • Start: {t.startDate}</p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onSelectTaskForComments(t)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Comments ({t.commentsCount || 0})</span>
                  </button>

                  {/* Workflow transition button */}
                  {t.status === 'PENDING' && (
                    <button
                      onClick={() => handleStatusChange(t.id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-sm"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Start Task</span>
                    </button>
                  )}

                  {t.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleStatusChange(t.id, 'COMPLETED')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Complete</span>
                    </button>
                  )}

                  {t.status === 'COMPLETED' && (
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                      ✓ Completed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
