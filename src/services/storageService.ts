import {
  Employee,
  Task,
  AttendanceRecord,
  LeaveRequest,
  TaskComment,
  AdminDashboardStats,
  EmployeeDashboardStats,
  SaveEmployeeResult
} from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

class StorageService {
  private getItem<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(`nexushr_${key}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setItem<T>(key: string, value: T[]): void {
    try {
      localStorage.setItem(`nexushr_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }

  // EMPLOYEES
  getEmployees(): Employee[] {
    return this.getItem<Employee>('employees');
  }

  async fetchEmployeesRealtime(): Promise<Employee[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('employees').select('*');
        if (!error && data) {
          const mapped: Employee[] = data.map(e => ({
            id: e.id,
            userId: e.user_id || e.id,
            employeeId: e.employee_id,
            name: e.name,
            email: e.email,
            phone: e.phone || '',
            department: e.department,
            position: e.position,
            joiningDate: e.joining_date,
            profileImage: e.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            status: e.status || 'ACTIVE',
            createdAt: e.created_at
          }));
          this.setItem('employees', mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch employees error:', err);
      }
    }
    return this.getEmployees();
  }

  getEmployeeById(id: string): Employee | undefined {
    return this.getEmployees().find(e => e.id === id || e.userId === id);
  }

  async saveEmployee(employee: Partial<Employee>): Promise<SaveEmployeeResult> {
    const employees = this.getEmployees();
    
    // UPDATE EXISTING EMPLOYEE
    if (employee.id) {
      const index = employees.findIndex(e => e.id === employee.id);
      if (index !== -1) {
        employees[index] = { ...employees[index], ...employee } as Employee;
        this.setItem('employees', employees);

        if (isSupabaseConfigured()) {
          const { error } = await supabase.from('employees').update({
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
            department: employee.department,
            position: employee.position,
            joining_date: employee.joiningDate,
            status: employee.status
          }).eq('id', employee.id);

          if (error) {
            console.error('Supabase update employee error:', error);
            throw new Error(error.message);
          }
        }
        return { employee: employees[index], emailSent: false };
      }
    }

    // CREATE NEW EMPLOYEE VIA SUPABASE EDGE FUNCTION INVITATION (WITH DIRECT FALLBACK)
    if (isSupabaseConfigured()) {
      let data: any = null;
      let invokeError: any = null;

      let adminEmail = 'admin@example.com';
      try {
        const savedUser = localStorage.getItem('nexushr_current_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed?.email) adminEmail = parsed.email;
        }
      } catch {}

      try {
        const res = await supabase.functions.invoke('invite-employee', {
          body: {
            name: employee.name,
            email: employee.email,
            phone: employee.phone || '',
            department: employee.department,
            position: employee.position,
            joiningDate: employee.joiningDate,
            status: 'INVITED',
            adminEmail: adminEmail
          }
        });
        data = res.data;
        invokeError = res.error;
      } catch (err) {
        console.warn('Edge Function invoke thrown error:', err);
        invokeError = err;
      }

      if (!invokeError && data && data.success !== false) {
        const isEmailDelivered = Boolean(data.emailSent);
        const newEmp: Employee = {
          id: data.employee?.id || generateUUID(),
          userId: data.employee?.user_id || '',
          employeeId: data.employee?.employee_id || `EMP-${String(employees.length + 1).padStart(3, '0')}`,
          name: employee.name || '',
          email: employee.email || '',
          phone: employee.phone || '',
          department: employee.department || '',
          position: employee.position || '',
          joiningDate: employee.joiningDate || new Date().toISOString().split('T')[0],
          profileImage: employee.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          status: 'INVITED',
          createdAt: new Date().toISOString(),
          emailSent: isEmailDelivered
        };

        employees.push(newEmp);
        this.setItem('employees', employees);
        return {
          employee: newEmp,
          emailSent: isEmailDelivered,
          message: data.message
        };
      }

      console.warn('Edge Function invitation unavailable or returned error, falling back to direct database insertion:', invokeError || data?.message);

      // Fallback: Direct insert into `employees` and `users` tables in Supabase PostgreSQL
      const empUuid = generateUUID();
      const empCode = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
      const cleanEmail = (employee.email || '').trim().toLowerCase();

      // Check duplicate
      const { data: existing } = await supabase
        .from('employees')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existing) {
        throw new Error('An employee with this email already exists.');
      }

      const { data: dbEmp, error: dbInsertError } = await supabase
        .from('employees')
        .insert([{
          id: empUuid,
          employee_id: empCode,
          name: employee.name || '',
          email: cleanEmail,
          phone: employee.phone || '',
          department: employee.department || '',
          position: employee.position || '',
          joining_date: employee.joiningDate || new Date().toISOString().split('T')[0],
          status: 'INVITED'
        }])
        .select()
        .single();

      if (dbInsertError) {
        console.error('Supabase direct employee insert error:', dbInsertError);
        throw new Error(`Failed to save employee: ${dbInsertError.message}`);
      }

      // Also create matching user auth record in `users` table with empty password until set by employee
      await supabase
        .from('users')
        .upsert([{
          id: dbEmp.user_id || empUuid,
          email: cleanEmail,
          password_hash: '',
          role: 'EMPLOYEE',
          is_active: true
        }], { onConflict: 'email' });

      // Trigger invitation / password setup email via Supabase Auth SMTP
      let emailDelivered = false;
      let emailNotice = 'Employee created in database.';
      try {
        const siteUrl = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:5173';
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${siteUrl}/set-password`
        });
        if (!resetErr) {
          emailDelivered = true;
          emailNotice = 'Password setup email sent via Supabase SMTP.';
        }
      } catch (smtpErr) {
        console.warn('Fallback Supabase SMTP email notification failed:', smtpErr);
      }

      const newEmp: Employee = {
        id: dbEmp.id,
        userId: dbEmp.user_id || empUuid,
        employeeId: dbEmp.employee_id || empCode,
        name: dbEmp.name,
        email: dbEmp.email,
        phone: dbEmp.phone || '',
        department: dbEmp.department,
        position: dbEmp.position,
        joiningDate: dbEmp.joining_date,
        profileImage: dbEmp.profile_image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        status: 'INVITED',
        createdAt: dbEmp.created_at || new Date().toISOString(),
        emailSent: emailDelivered
      };

      employees.push(newEmp);
      this.setItem('employees', employees);
      return {
        employee: newEmp,
        emailSent: emailDelivered,
        message: emailNotice
      };
    }

    // FALLBACK FOR DEVELOPMENT WHEN SUPABASE IS NOT CONFIGURED
    const empUuid = generateUUID();
    const userUuid = generateUUID();
    const empCode = `EMP-${String(employees.length + 1).padStart(3, '0')}`;

    const newEmp: Employee = {
      id: empUuid,
      userId: userUuid,
      employeeId: empCode,
      name: employee.name || 'New Employee',
      email: employee.email || `emp_${Date.now()}@example.com`,
      phone: employee.phone || '',
      department: employee.department || 'General',
      position: employee.position || 'Staff',
      joiningDate: employee.joiningDate || new Date().toISOString().split('T')[0],
      profileImage: employee.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      status: 'INVITED',
      createdAt: new Date().toISOString(),
      emailSent: false
    };

    employees.push(newEmp);
    this.setItem('employees', employees);
    return {
      employee: newEmp,
      emailSent: false,
      message: 'Employee saved to local storage.'
    };
  }

  async toggleEmployeeStatus(id: string): Promise<Employee | undefined> {
    const employees = this.getEmployees();
    const emp = employees.find(e => e.id === id);
    if (emp) {
      emp.status = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      this.setItem('employees', employees);

      if (isSupabaseConfigured()) {
        await supabase.from('employees').update({ status: emp.status }).eq('id', id);
      }
    }
    return emp;
  }

  async deleteEmployee(id: string): Promise<void> {
    const allEmps = this.getEmployees();
    const target = allEmps.find(e => e.id === id || e.userId === id);
    const employees = allEmps.filter(e => e.id !== id && e.userId !== id);
    this.setItem('employees', employees);

    if (isSupabaseConfigured() && target) {
      try {
        // Delete dependent records first to satisfy foreign key constraints
        await supabase.from('tasks').delete().eq('employee_id', target.id);
        await supabase.from('attendance').delete().eq('employee_id', target.id);
        await supabase.from('leaves').delete().eq('employee_id', target.id);
        await supabase.from('task_comments').delete().eq('employee_id', target.id);

        // Delete from employees table
        const { error: empErr } = await supabase
          .from('employees')
          .delete()
          .eq('id', target.id);

        if (empErr && target.email) {
          await supabase.from('employees').delete().eq('email', target.email);
        }

        // Delete from users table
        if (target.userId) {
          await supabase.from('users').delete().eq('id', target.userId);
        }
        if (target.email) {
          await supabase.from('users').delete().eq('email', target.email);
        }
      } catch (err) {
        console.error('Supabase deletion error:', err);
      }
    }
  }

  // TASKS & PROJECTS
  getTasks(): Task[] {
    return this.getItem<Task>('tasks');
  }

  async fetchTasksRealtime(): Promise<Task[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('tasks').select('*');
        if (!error && data) {
          const employees = await this.fetchEmployeesRealtime();
          const mapped: Task[] = data.map(t => {
            const emp = employees.find(e => e.id === t.employee_id);
            return {
              id: t.id,
              title: t.title,
              description: t.description || '',
              employeeId: t.employee_id || '',
              employeeName: emp ? emp.name : 'Unassigned',
              priority: t.priority || 'MEDIUM',
              status: t.status || 'PENDING',
              startDate: t.start_date,
              dueDate: t.due_date,
              commentsCount: 0
            };
          });
          this.setItem('tasks', mapped);
          return mapped;
        } else if (error) {
          console.error('Supabase fetch tasks error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase fetch tasks error:', err);
      }
    }
    return this.getTasks();
  }

  getTasksByEmployee(employeeId: string): Task[] {
    return this.getTasks().filter(t => t.employeeId === employeeId);
  }

  async fetchTasksByEmployeeRealtime(employeeId: string): Promise<Task[]> {
    const allTasks = await this.fetchTasksRealtime();
    return allTasks.filter(t => t.employeeId === employeeId);
  }

  async saveTask(task: Partial<Task>): Promise<Task> {
    const tasks = this.getTasks();
    const employees = await this.fetchEmployeesRealtime();
    const emp = employees.find(e => e.id === task.employeeId);

    if (task.id) {
      const index = tasks.findIndex(t => t.id === task.id);
      if (index !== -1) {
        tasks[index] = { 
          ...tasks[index], 
          ...task,
          employeeName: emp ? emp.name : tasks[index].employeeName
        } as Task;
        this.setItem('tasks', tasks);

        if (isSupabaseConfigured()) {
          const { error } = await supabase.from('tasks').update({
            title: task.title,
            description: task.description,
            employee_id: task.employeeId || null,
            priority: task.priority,
            status: task.status,
            start_date: task.startDate,
            due_date: task.dueDate
          }).eq('id', task.id);

          if (error) {
            console.error('Supabase update task error:', error);
            throw new Error(error.message);
          }
        }
        return tasks[index];
      }
    }

    const taskUuid = generateUUID();
    const validEmpId = emp ? emp.id : (employees[0] ? employees[0].id : null);
    const newTask: Task = {
      id: taskUuid,
      title: task.title || 'Untitled Task',
      description: task.description || '',
      employeeId: validEmpId || '',
      employeeName: emp ? emp.name : 'Unassigned',
      priority: task.priority || 'MEDIUM',
      status: 'PENDING',
      startDate: task.startDate || new Date().toISOString().split('T')[0],
      dueDate: task.dueDate || new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      commentsCount: 0
    };

    if (isSupabaseConfigured()) {
      const { data: dbData, error } = await supabase.from('tasks').insert([{
        id: taskUuid,
        title: newTask.title,
        description: newTask.description,
        employee_id: validEmpId,
        priority: newTask.priority,
        status: newTask.status,
        start_date: newTask.startDate,
        due_date: newTask.dueDate
      }]).select();

      if (error) {
        console.error('Supabase task insert error:', error);
        throw new Error(`Supabase task error: ${error.message}`);
      }

      if (dbData && dbData[0]) {
        newTask.id = dbData[0].id;
      }
    }

    tasks.push(newTask);
    this.setItem('tasks', tasks);
    return newTask;
  }

  async updateTaskStatus(taskId: string, status: Task['status']): Promise<Task | undefined> {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      this.setItem('tasks', tasks);

      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
        if (error) {
          console.error('Supabase update task status error:', error.message);
        }
      }
    }
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = this.getTasks().filter(t => t.id !== id);
    this.setItem('tasks', tasks);

    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete task error:', error.message);
      }
    }
  }

  // COMMENTS
  getTaskComments(taskId: string): TaskComment[] {
    const comments = this.getItem<TaskComment>('task_comments');
    return comments.filter(c => c.taskId === taskId);
  }

  async fetchTaskCommentsRealtime(taskId: string): Promise<TaskComment[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('task_comments').select('*').eq('task_id', taskId);
        if (!error && data) {
          const mapped: TaskComment[] = data.map(c => ({
            id: c.id,
            taskId: c.task_id,
            employeeId: c.employee_id || '',
            authorName: c.author_name,
            comment: c.comment,
            createdAt: c.created_at
          }));
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch comments error:', err);
      }
    }
    return this.getTaskComments(taskId);
  }

  async addTaskComment(taskId: string, employeeId: string, authorName: string, commentText: string): Promise<TaskComment> {
    const comments = this.getItem<TaskComment>('task_comments');
    const commentUuid = generateUUID();

    const newComment: TaskComment = {
      id: commentUuid,
      taskId,
      employeeId,
      authorName,
      comment: commentText,
      createdAt: new Date().toISOString()
    };

    comments.push(newComment);
    this.setItem('task_comments', comments);

    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.commentsCount = (task.commentsCount || 0) + 1;
      this.setItem('tasks', tasks);
    }

    if (isSupabaseConfigured()) {
      const validEmpId = employeeId && employeeId.length > 10 ? employeeId : null;
      await supabase.from('task_comments').insert([{
        id: commentUuid,
        task_id: taskId,
        employee_id: validEmpId,
        author_name: authorName,
        comment: commentText
      }]);
    }

    return newComment;
  }

  // ATTENDANCE
  getAttendanceLogs(): AttendanceRecord[] {
    return this.getItem<AttendanceRecord>('attendance');
  }

  async fetchAttendanceRealtime(): Promise<AttendanceRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('attendance').select('*');
        if (!error && data) {
          const employees = await this.fetchEmployeesRealtime();
          const mapped: AttendanceRecord[] = data.map(a => {
            const emp = employees.find(e => e.id === a.employee_id);
            return {
              id: a.id,
              employeeId: a.employee_id,
              employeeName: emp ? emp.name : 'Employee',
              department: emp ? emp.department : 'General',
              date: a.date,
              checkIn: a.check_in || '',
              checkOut: a.check_out || '',
              workingHours: Number(a.working_hours) || 0,
              status: a.status || 'PRESENT'
            };
          });
          this.setItem('attendance', mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch attendance error:', err);
      }
    }
    return this.getAttendanceLogs();
  }

  getEmployeeAttendance(employeeId: string): AttendanceRecord[] {
    return this.getAttendanceLogs().filter(a => a.employeeId === employeeId);
  }

  async fetchEmployeeAttendanceRealtime(employeeId: string): Promise<AttendanceRecord[]> {
    const logs = await this.fetchAttendanceRealtime();
    return logs.filter(a => a.employeeId === employeeId);
  }

  getTodayAttendance(employeeId: string): AttendanceRecord | undefined {
    const today = new Date().toISOString().split('T')[0];
    return this.getAttendanceLogs().find(a => a.employeeId === employeeId && a.date === today);
  }

  async checkIn(employeeId: string): Promise<AttendanceRecord> {
    const logs = this.getAttendanceLogs();
    const employees = await this.fetchEmployeesRealtime();
    const emp = employees.find(e => e.id === employeeId);
    const today = new Date().toISOString().split('T')[0];

    const existing = logs.find(a => a.employeeId === employeeId && a.date === today);
    if (existing) {
      return existing;
    }

    const now = new Date();
    const hours = now.getHours();
    const isLate = hours >= 10;
    const attUuid = generateUUID();

    const newRecord: AttendanceRecord = {
      id: attUuid,
      employeeId,
      employeeName: emp?.name || 'Employee',
      department: emp?.department || 'General',
      date: today,
      checkIn: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: isLate ? 'LATE' : 'PRESENT',
      workingHours: 0
    };

    logs.unshift(newRecord);
    this.setItem('attendance', logs);

    if (isSupabaseConfigured()) {
      await supabase.from('attendance').insert([{
        id: attUuid,
        employee_id: employeeId,
        date: today,
        check_in: newRecord.checkIn,
        status: newRecord.status,
        working_hours: 0
      }]);
    }

    return newRecord;
  }

  async checkOut(employeeId: string): Promise<AttendanceRecord | undefined> {
    const logs = this.getAttendanceLogs();
    const today = new Date().toISOString().split('T')[0];
    const record = logs.find(a => a.employeeId === employeeId && a.date === today);

    if (record && !record.checkOut) {
      const now = new Date();
      record.checkOut = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      record.workingHours = 8.5;
      this.setItem('attendance', logs);

      if (isSupabaseConfigured()) {
        await supabase.from('attendance').update({
          check_out: record.checkOut,
          working_hours: 8.5
        }).eq('id', record.id);
      }
    }
    return record;
  }

  // LEAVES
  getLeaveRequests(): LeaveRequest[] {
    return this.getItem<LeaveRequest>('leaves');
  }

  async fetchLeavesRealtime(): Promise<LeaveRequest[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('leaves').select('*');
        if (!error && data) {
          const employees = await this.fetchEmployeesRealtime();
          const mapped: LeaveRequest[] = data.map(l => {
            const emp = employees.find(e => e.id === l.employee_id);
            return {
              id: l.id,
              employeeId: l.employee_id,
              employeeName: emp ? emp.name : 'Employee',
              department: emp ? emp.department : 'General',
              leaveType: l.leave_type,
              fromDate: l.from_date,
              toDate: l.to_date,
              numberOfDays: l.number_of_days,
              reason: l.reason || '',
              status: l.status || 'PENDING',
              rejectionReason: l.rejection_reason,
              createdAt: l.created_at ? l.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
            };
          });
          this.setItem('leaves', mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase fetch leaves error:', err);
      }
    }
    return this.getLeaveRequests();
  }

  getEmployeeLeaves(employeeId: string): LeaveRequest[] {
    return this.getLeaveRequests().filter(l => l.employeeId === employeeId);
  }

  async fetchEmployeeLeavesRealtime(employeeId: string): Promise<LeaveRequest[]> {
    const leaves = await this.fetchLeavesRealtime();
    return leaves.filter(l => l.employeeId === employeeId);
  }

  async applyLeave(request: Partial<LeaveRequest>): Promise<LeaveRequest> {
    const leaves = this.getLeaveRequests();
    const employees = await this.fetchEmployeesRealtime();
    const emp = employees.find(e => e.id === request.employeeId);

    const from = new Date(request.fromDate || new Date());
    const to = new Date(request.toDate || new Date());
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const leaveUuid = generateUUID();

    const newLeave: LeaveRequest = {
      id: leaveUuid,
      employeeId: request.employeeId || '',
      employeeName: emp?.name || 'Employee',
      department: emp?.department || 'General',
      leaveType: request.leaveType || 'CASUAL',
      fromDate: request.fromDate || new Date().toISOString().split('T')[0],
      toDate: request.toDate || new Date().toISOString().split('T')[0],
      numberOfDays: diffDays,
      reason: request.reason || '',
      status: 'PENDING',
      createdAt: new Date().toISOString().split('T')[0]
    };

    leaves.unshift(newLeave);
    this.setItem('leaves', leaves);

    if (isSupabaseConfigured() && newLeave.employeeId) {
      await supabase.from('leaves').insert([{
        id: leaveUuid,
        employee_id: newLeave.employeeId,
        leave_type: newLeave.leaveType,
        from_date: newLeave.fromDate,
        to_date: newLeave.toDate,
        number_of_days: newLeave.numberOfDays,
        reason: newLeave.reason,
        status: 'PENDING'
      }]);
    }

    return newLeave;
  }

  async approveLeave(leaveId: string, adminName: string): Promise<LeaveRequest | undefined> {
    const leaves = this.getLeaveRequests();
    const leave = leaves.find(l => l.id === leaveId);
    if (leave) {
      leave.status = 'APPROVED';
      leave.approvedBy = adminName;
      this.setItem('leaves', leaves);

      if (isSupabaseConfigured()) {
        await supabase.from('leaves').update({ status: 'APPROVED' }).eq('id', leaveId);
      }
    }
    return leave;
  }

  async rejectLeave(leaveId: string, rejectionReason: string): Promise<LeaveRequest | undefined> {
    const leaves = this.getLeaveRequests();
    const leave = leaves.find(l => l.id === leaveId);
    if (leave) {
      leave.status = 'REJECTED';
      leave.rejectionReason = rejectionReason;
      this.setItem('leaves', leaves);

      if (isSupabaseConfigured()) {
        await supabase.from('leaves').update({
          status: 'REJECTED',
          rejection_reason: rejectionReason
        }).eq('id', leaveId);
      }
    }
    return leave;
  }

  // DASHBOARD STATS
  async fetchAdminStatsRealtime(): Promise<AdminDashboardStats> {
    const employees = await this.fetchEmployeesRealtime();
    const tasks = await this.fetchTasksRealtime();
    const leaves = await this.fetchLeavesRealtime();
    const attendance = await this.fetchAttendanceRealtime();
    const today = new Date().toISOString().split('T')[0];
    const todayAtt = attendance.filter(a => a.date === today);

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'ACTIVE').length,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'PENDING').length,
      inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
      pendingLeaves: leaves.filter(l => l.status === 'PENDING').length,
      attendance: {
        present: todayAtt.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length,
        absent: Math.max(0, employees.length - todayAtt.length),
        leave: leaves.filter(l => l.status === 'APPROVED' && l.fromDate <= today && l.toDate >= today).length
      }
    };
  }

  async fetchEmployeeStatsRealtime(employeeId: string): Promise<EmployeeDashboardStats> {
    const tasks = await this.fetchTasksByEmployeeRealtime(employeeId);
    const logs = await this.fetchEmployeeAttendanceRealtime(employeeId);
    const today = new Date().toISOString().split('T')[0];
    const todayAtt = logs.find(a => a.date === today) || null;
    const leaves = await this.fetchEmployeeLeavesRealtime(employeeId);

    const approvedDays = leaves
      .filter(l => l.status === 'APPROVED')
      .reduce((sum, l) => sum + l.numberOfDays, 0);

    return {
      assignedTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'PENDING').length,
      inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
      leaveBalance: Math.max(0, 18 - approvedDays),
      todayAttendance: todayAtt
    };
  }

  getAdminStats(): AdminDashboardStats {
    const employees = this.getEmployees();
    const tasks = this.getTasks();
    const leaves = this.getLeaveRequests();
    const attendance = this.getAttendanceLogs();
    const today = new Date().toISOString().split('T')[0];
    const todayAtt = attendance.filter(a => a.date === today);

    return {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e => e.status === 'ACTIVE').length,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'PENDING').length,
      inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
      pendingLeaves: leaves.filter(l => l.status === 'PENDING').length,
      attendance: {
        present: todayAtt.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length,
        absent: Math.max(0, employees.length - todayAtt.length),
        leave: leaves.filter(l => l.status === 'APPROVED' && l.fromDate <= today && l.toDate >= today).length
      }
    };
  }

  getEmployeeStats(employeeId: string): EmployeeDashboardStats {
    const tasks = this.getTasksByEmployee(employeeId);
    const todayAtt = this.getTodayAttendance(employeeId);
    const leaves = this.getEmployeeLeaves(employeeId);

    const approvedDays = leaves
      .filter(l => l.status === 'APPROVED')
      .reduce((sum, l) => sum + l.numberOfDays, 0);

    return {
      assignedTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'PENDING').length,
      inProgressTasks: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completedTasks: tasks.filter(t => t.status === 'COMPLETED').length,
      leaveBalance: Math.max(0, 18 - approvedDays),
      todayAttendance: todayAtt || null
    };
  }
}

export const storageService = new StorageService();
