import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { LeaveRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { CalendarOff, PlusCircle, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';

interface LeavesPageProps {
  onOpenLeaveModal: () => void;
  onSelectLeaveForApproval: (leave: LeaveRequest) => void;
}

export const LeavesPage: React.FC<LeavesPageProps> = ({
  onOpenLeaveModal,
  onSelectLeaveForApproval
}) => {
  const { role, employee } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [statusTab, setStatusTab] = useState('ALL');

  const empId = employee?.id || 'e2222222-2222-2222-2222-222222222222';

  useEffect(() => {
    loadLeaves();
  }, [role, empId]);

  const loadLeaves = async () => {
    try {
      let fetched: LeaveRequest[] = [];
      if (role === 'EMPLOYEE') {
        fetched = await storageService.fetchEmployeeLeavesRealtime(empId);
      } else {
        fetched = await storageService.fetchLeavesRealtime();
      }
      setLeaves(fetched);
    } catch (err) {
      console.error('Error loading leaves:', err);
    }
  };

  const filteredLeaves = leaves.filter(l => 
    statusTab === 'ALL' || l.status === statusTab
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Leave Requests & Time Off ({leaves.length})</h2>
          <p className="text-xs text-slate-500">Manage vacation, sick leave, casual time off and approval workflows</p>
        </div>

        <button
          onClick={onOpenLeaveModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Apply For Leave</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft flex items-center space-x-2 text-xs">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
          <button
            key={st}
            onClick={() => setStatusTab(st)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              statusTab === st
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Leaves List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        {filteredLeaves.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <CalendarOff className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No leave requests found for this filter.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                {role === 'ADMIN' && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.map(leave => (
                <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{leave.employeeName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {leave.leaveType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {leave.fromDate} to {leave.toDate}
                  </td>
                  <td className="py-3 px-4 font-bold text-indigo-600">{leave.numberOfDays} days</td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{leave.reason}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      leave.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      leave.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {leave.status}
                    </span>
                  </td>

                  {role === 'ADMIN' && (
                    <td className="py-3 px-4 text-right">
                      {leave.status === 'PENDING' ? (
                        <button
                          onClick={() => onSelectLeaveForApproval(leave)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md text-[11px]"
                        >
                          Review
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Reviewed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};
