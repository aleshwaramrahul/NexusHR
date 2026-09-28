import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { LeaveRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ApproveLeaveModalProps {
  leave: LeaveRequest | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApproveLeaveModal: React.FC<ApproveLeaveModalProps> = ({
  leave,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!leave) return null;

  const handleApprove = async () => {
    const adminName = user?.name || 'HR Admin';
    setSubmitting(true);
    try {
      await storageService.approveLeave(leave.id, adminName);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Approve leave error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    setSubmitting(true);
    try {
      await storageService.rejectLeave(leave.id, rejectionReason.trim());
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Reject leave error:', err);
    } finally {
      setSubmitting(false);
    }
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

        <h3 className="text-lg font-bold text-slate-900 mb-1">Review Leave Request</h3>
        <p className="text-xs text-slate-500 mb-4">Employee: <strong>{leave.employeeName}</strong></p>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-slate-500">Leave Type:</span>
            <span className="font-semibold text-slate-800">{leave.leaveType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Duration:</span>
            <span className="font-semibold text-slate-800">{leave.fromDate} to {leave.toDate} ({leave.numberOfDays} days)</span>
          </div>
          <div className="pt-2 border-t border-slate-200">
            <span className="text-slate-500 block mb-1">Reason:</span>
            <p className="text-slate-800 italic bg-white p-2 rounded border border-slate-100">{leave.reason}</p>
          </div>
        </div>

        {isRejecting ? (
          <form onSubmit={handleReject} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                required
                placeholder="State the reason for rejecting this leave request..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsRejecting(false)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-600 text-white font-semibold rounded-lg shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        ) : (
          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => setIsRejecting(true)}
              className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Request</span>
            </button>
            <button
              onClick={handleApprove}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve Leave</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
