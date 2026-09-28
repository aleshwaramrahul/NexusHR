import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { AttendanceRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { Clock, LogIn, LogOut, Calendar, Filter, CheckCircle2, AlertCircle } from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { role, employee } = useAuth();
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [todayAtt, setTodayAtt] = useState<AttendanceRecord | null>(null);

  const empId = employee?.id || 'e2222222-2222-2222-2222-222222222222';

  useEffect(() => {
    loadAttendance();
  }, [role, empId]);

  const loadAttendance = async () => {
    try {
      let fetched: AttendanceRecord[] = [];
      if (role === 'EMPLOYEE') {
        fetched = await storageService.fetchEmployeeAttendanceRealtime(empId);
      } else {
        fetched = await storageService.fetchAttendanceRealtime();
      }
      setLogs(fetched);
      const today = fetched.find(a => a.date === new Date().toISOString().split('T')[0]);
      setTodayAtt(today || null);
    } catch (err) {
      console.error('Error loading attendance logs:', err);
    }
  };

  const handleCheckIn = async () => {
    const record = await storageService.checkIn(empId);
    setTodayAtt(record);
    await loadAttendance();
  };

  const handleCheckOut = async () => {
    const record = await storageService.checkOut(empId);
    if (record) {
      setTodayAtt(record);
      await loadAttendance();
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchesDept = departmentFilter === 'ALL' || l.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Attendance Log & Shift Clock</h2>
          <p className="text-xs text-slate-500">Track check-in/check-out timestamps and working hours</p>
        </div>

        {/* Quick Clock-In Widget */}
        <div className="flex items-center space-x-3">
          {!todayAtt?.checkIn ? (
            <button
              onClick={handleCheckIn}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Check In Now</span>
            </button>
          ) : !todayAtt.checkOut ? (
            <button
              onClick={handleCheckOut}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Check Out Now</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Shift Completed Today</span>
            </span>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2 text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span className="font-semibold">Log Filters:</span>
        </div>

        <div className="flex items-center space-x-3">
          {role === 'ADMIN' && (
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
            </select>
          )}

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="PRESENT">PRESENT</option>
            <option value="LATE">LATE</option>
            <option value="LEAVE">LEAVE</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No attendance records logged for the selected criteria.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Working Hours</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{log.date}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{log.employeeName || 'Staff'}</td>
                  <td className="py-3 px-4 text-slate-500">{log.department || 'General'}</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">{log.checkIn || '--'}</td>
                  <td className="py-3 px-4 text-rose-600 font-semibold">{log.checkOut || '--'}</td>
                  <td className="py-3 px-4 text-indigo-700 font-bold">
                    {log.workingHours ? `${log.workingHours} hrs` : '--'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      log.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                      log.status === 'LATE' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};
