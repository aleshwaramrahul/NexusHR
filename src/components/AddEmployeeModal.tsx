import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { UserPlus, X, AlertCircle, Loader2, CheckCircle2, Mail, MailWarning } from 'lucide-react';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [position, setPosition] = useState('Software Engineer');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdResult, setCreatedResult] = useState<{ emailSent: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const handleCloseAll = () => {
    setCreatedResult(null);
    setName('');
    setEmail('');
    setPhone('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await storageService.saveEmployee({
        name,
        email,
        phone,
        department,
        position,
        joiningDate,
        status: 'INVITED'
      });
      
      localStorage.setItem('nexushr_last_invited_email', email.trim());
      
      setCreatedResult({
        emailSent: res.emailSent,
        message: res.message
      });
      onSuccess();
    } catch (err: any) {
      console.error('Failed to add employee:', err);
      setErrorMsg(err.message || 'Failed to insert employee into Supabase database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
        
        <button
          onClick={handleCloseAll}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {createdResult ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Employee Invited Successfully</h3>
            
            <p className="text-xs text-slate-600">
              An invitation account for <span className="font-semibold text-slate-900">{name}</span> ({email}) has been generated.
            </p>

            {createdResult.emailSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-left text-xs text-emerald-800 space-y-1.5">
                <div className="flex items-center space-x-2 font-semibold">
                  <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Invitation Email Sent!</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  An email invitation has been sent directly to <strong>{email}</strong>. The employee will click the setup link to set up their own account password.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 space-y-2">
                <div className="flex items-center space-x-2 font-semibold text-amber-800">
                  <MailWarning className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Invitation Email Delivery Notice</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {createdResult.message || 'Supabase default SMTP rate limit reached or custom SMTP is not configured in Supabase Dashboard.'}
                </p>
                <div className="pt-2 border-t border-amber-200/60 text-[11px] text-slate-700">
                  💡 The employee can set up their password by navigating to <strong>Set Password</strong> on the login page using their email (<strong>{email}</strong>).
                </div>
              </div>
            )}

            <button
              onClick={handleCloseAll}
              className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add & Invite New Employee</h3>
                <p className="text-xs text-slate-500">Sends an email invitation so the employee sets their own password</p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="john.doe@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Management">Management</option>
                    <option value="Human Resources">Human Resources</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Position / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Frontend Dev"
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={joiningDate}
                    onChange={e => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center space-x-2 text-[11px] text-indigo-900">
                <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>An invitation email with password setup link will be automatically sent to the employee.</span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseAll}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Invitation...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Email Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
};

