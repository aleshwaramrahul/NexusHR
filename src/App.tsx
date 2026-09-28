import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';
import { SupabaseModal } from './components/SupabaseModal';
import { AddEmployeeModal } from './components/AddEmployeeModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { TaskCommentsDrawer } from './components/TaskCommentsDrawer';
import { LeaveApplicationModal } from './components/LeaveApplicationModal';
import { ApproveLeaveModal } from './components/ApproveLeaveModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { SetPassword } from './pages/SetPassword';

import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { EmployeesPage } from './pages/EmployeesPage';
import { TasksPage } from './pages/TasksPage';
import { AttendancePage } from './pages/AttendancePage';
import { LeavesPage } from './pages/LeavesPage';
import { ReportsPage } from './pages/ReportsPage';
import { Task, LeaveRequest } from './types';

const MainLayout: React.FC = () => {
  const { role, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('nexushr_active_tab') || 'dashboard';
  });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem('nexushr_active_tab', tab);
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState<Task | null>(null);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedLeaveForApproval, setSelectedLeaveForApproval] = useState<LeaveRequest | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // STEP 1: Show full-page Login Page if user is not authenticated
  if (!isLoggedIn) {
    return <LoginPage />;
  }

  // STEP 2: Render Main Portal & Dashboard after Login
  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col font-sans">

      {/* Header Navbar */}
      <Navbar
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      {/* Main Body */}
      <div className="flex flex-1 max-w-7xl w-full mx-auto">

        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
        />

        {/* Dynamic Page View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            role === 'ADMIN' ? (
              <AdminDashboard
                key={`admin_dash_${refreshKey}`}
                onOpenAddEmployee={() => setIsAddEmployeeOpen(true)}
                onOpenCreateTask={() => setIsCreateTaskOpen(true)}
                onNavigateTab={handleTabChange}
              />
            ) : (
              <EmployeeDashboard
                key={`emp_dash_${refreshKey}`}
                onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
                onSelectTaskForComments={task => setSelectedTaskForComments(task)}
              />
            )
          )}

          {activeTab === 'employees' && (
            <EmployeesPage
              key={`employees_${refreshKey}`}
              onOpenAddEmployee={() => setIsAddEmployeeOpen(true)}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksPage
              key={`tasks_${refreshKey}`}
              onOpenCreateTask={() => setIsCreateTaskOpen(true)}
              onSelectTaskForComments={task => setSelectedTaskForComments(task)}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendancePage key={`attendance_${refreshKey}`} />
          )}

          {activeTab === 'leaves' && (
            <LeavesPage
              key={`leaves_${refreshKey}`}
              onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
              onSelectLeaveForApproval={leave => setSelectedLeaveForApproval(leave)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPage key={`reports_${refreshKey}`} />
          )}
        </main>

      </div>

      {/* Modals & Drawers */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <SupabaseModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
      />

      <AddEmployeeModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onSuccess={() => {
          handleTabChange('employees');
          triggerRefresh();
        }}
      />

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onSuccess={() => {
          handleTabChange('tasks');
          triggerRefresh();
        }}
      />

      <TaskCommentsDrawer
        task={selectedTaskForComments}
        onClose={() => setSelectedTaskForComments(null)}
      />

      <LeaveApplicationModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onSuccess={() => {
          handleTabChange('leaves');
          triggerRefresh();
        }}
      />

      <ApproveLeaveModal
        leave={selectedLeaveForApproval}
        onClose={() => setSelectedLeaveForApproval(null)}
        onSuccess={() => {
          handleTabChange('leaves');
          triggerRefresh();
        }}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

    </div>
  );
};

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigateLogin = () => {
    window.history.pushState({}, '', '/');
    setPathname('/');
  };

  const isSetPasswordPage = pathname === '/set-password';

  return (
    <AuthProvider>
      {isSetPasswordPage ? (
        <SetPassword onNavigateLogin={handleNavigateLogin} />
      ) : (
        <MainLayout />
      )}
    </AuthProvider>
  );
}

export default App;
