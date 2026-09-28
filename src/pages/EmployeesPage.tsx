import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { Employee } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  MoreVertical, 
  Power, 
  Trash2, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';

interface EmployeesPageProps {
  onOpenAddEmployee: () => void;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({ onOpenAddEmployee }) => {
  const { role } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    const list = await storageService.fetchEmployeesRealtime();
    setEmployees(list);
  };

  const handleToggleStatus = async (id: string) => {
    await storageService.toggleEmployeeStatus(id);
    await loadEmployees();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const targetId = deleteTarget.id;
    try {
      setEmployees(prev => prev.filter(e => e.id !== targetId && e.userId !== targetId));
      await storageService.deleteEmployee(targetId);
      await loadEmployees();
    } catch (err: any) {
      console.error('Failed to delete employee:', err);
      await loadEmployees();
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Filtering
  const filtered = employees.filter(e => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.position.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(search.toLowerCase());

    const matchesDept = departmentFilter === 'ALL' || e.department === departmentFilter;
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-soft">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Employee Directory ({employees.length})</h2>
          <p className="text-xs text-slate-500">Manage workforce profiles, department assignments and active statuses</p>
        </div>

        {role === 'ADMIN' && (
          <button
            onClick={onOpenAddEmployee}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, ID or position..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filter:</span>
          </div>

          <select
            value={departmentFilter}
            onChange={e => {
              setDepartmentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="Management">Management</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

      </div>

      {/* Grid of Employees */}
      {paginated.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No employees match your search query or selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginated.map(emp => (
            <div
              key={emp.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded uppercase">
                    {emp.employeeId}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    emp.status === 'ACTIVE' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {emp.status}
                  </span>
                </div>

                <div className="text-center mb-4">
                  <img
                    src={emp.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                    alt={emp.name}
                    className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-indigo-500/20 mb-2 shadow-sm"
                  />
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{emp.name}</h3>
                  <p className="text-xs text-indigo-600 font-medium">{emp.position}</p>
                </div>

                <div className="space-y-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <div className="flex items-center space-x-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.department}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{emp.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {role === 'ADMIN' && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleToggleStatus(emp.id)}
                    className="text-slate-600 hover:text-indigo-600 font-medium flex items-center space-x-1"
                    title="Toggle Active/Inactive"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</span>
                  </button>

                  <button
                    onClick={() => setDeleteTarget(emp)}
                    className="text-rose-500 hover:text-rose-700 p-1 rounded"
                    title="Delete Employee"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft flex items-center justify-between text-xs text-slate-500">
        <span>Showing Page {currentPage} of {totalPages} ({filtered.length} total staff)</span>
        <div className="flex items-center space-x-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        employeeName={deleteTarget?.name || ''}
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

    </div>
  );
};
