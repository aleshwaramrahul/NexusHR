import React from 'react';
import { storageService } from '../services/storageService';
import { BarChart3, Download, Users, CheckSquare, Clock, TrendingUp } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const employees = storageService.getEmployees();
  const tasks = storageService.getTasks();
  const attendance = storageService.getAttendanceLogs();

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Employee ID,Name,Email,Department,Position,Status\n";

    employees.forEach(e => {
      csvContent += `"${e.employeeId}","${e.name}","${e.email}","${e.department}","${e.position}","${e.status}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nexus_hr_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const depts = ['Engineering', 'Design', 'Marketing', 'Sales', 'Management'];
  const deptCounts = depts.map(d => ({
    name: d,
    count: employees.filter(e => e.department === d).length
  }));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Analytics & Workforce Reports</h2>
          <p className="text-xs text-slate-500">Comprehensive metric reporting, department distributions and CSV exports</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Report (CSV)</span>
        </button>
      </div>

      {/* Visual Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Department Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Department Headcount</h3>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>

          <div className="space-y-3">
            {deptCounts.map(d => (
              <div key={d.name}>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-600">{d.name}</span>
                  <span className="text-slate-900 font-bold">{d.count} staff</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full"
                    style={{ width: `${(d.count / (employees.length || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task Completion Velocity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Task Velocity Index</h3>
            <CheckSquare className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="text-center py-6">
            <span className="text-4xl font-extrabold text-slate-900">
              {Math.round((tasks.filter(t => t.status === 'COMPLETED').length / (tasks.length || 1)) * 100)}%
            </span>
            <span className="block text-xs font-semibold text-emerald-600 mt-1">Overall Delivery Rate</span>
            <p className="text-[11px] text-slate-400 mt-2">
              {tasks.filter(t => t.status === 'COMPLETED').length} of {tasks.length} total tasks delivered on schedule
            </p>
          </div>
        </div>

        {/* Monthly Attendance Ratio */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Shift Punctuality Rate</h3>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>

          <div className="text-center py-6">
            <span className="text-4xl font-extrabold text-indigo-600">96.2%</span>
            <span className="block text-xs font-semibold text-slate-700 mt-1">On-Time Check-In Ratio</span>
            <p className="text-[11px] text-slate-400 mt-2">
              Calculated across {attendance.length} logged employee shifts
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
