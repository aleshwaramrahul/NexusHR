export type UserRole = 'ADMIN' | 'EMPLOYEE';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'INVITED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
export type LeaveType = 'CASUAL' | 'SICK' | 'EARNED' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
}

export interface Employee {
  id: string;
  userId: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  joiningDate: string;
  profileImage?: string;
  password?: string;
  status: EmployeeStatus;
  createdAt: string;
  emailSent?: boolean;
}

export interface SaveEmployeeResult {
  employee: Employee;
  emailSent: boolean;
  message?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  employeeId: string;
  employeeName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  commentsCount?: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  department?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  workingHours: number;
  status: AttendanceStatus;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName?: string;
  department?: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  reason: string;
  attachment?: string;
  status: LeaveStatus;
  rejectionReason?: string;
  approvedBy?: string;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  employeeId: string;
  authorName: string;
  comment: string;
  createdAt: string;
}

export interface AdminDashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  pendingLeaves: number;
  attendance: {
    present: number;
    absent: number;
    leave: number;
  };
}

export interface EmployeeDashboardStats {
  assignedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  leaveBalance: number;
  todayAttendance: AttendanceRecord | null;
}
