-- ==============================================================================
-- NexusHR / WorkforceOS - Supabase PostgreSQL Database Schema
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('ADMIN', 'EMPLOYEE');
CREATE TYPE employee_status AS ENUM ('ACTIVE', 'INACTIVE', 'INVITED');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE task_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'LEAVE');
CREATE TYPE leave_type AS ENUM ('CASUAL', 'SICK', 'EARNED', 'OTHER');
CREATE TYPE leave_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'EMPLOYEE',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    department TEXT NOT NULL,
    position TEXT NOT NULL,
    joining_date DATE NOT NULL,
    profile_image TEXT,
    status employee_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    priority task_priority DEFAULT 'MEDIUM',
    status task_status DEFAULT 'PENDING',
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TEXT,
    check_out TEXT,
    working_hours NUMERIC(4,2) DEFAULT 0.00,
    status attendance_status DEFAULT 'PRESENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_employee_date UNIQUE (employee_id, date)
);

-- 6. LEAVES TABLE
CREATE TABLE IF NOT EXISTS public.leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    leave_type leave_type DEFAULT 'CASUAL',
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    number_of_days INT NOT NULL,
    reason TEXT NOT NULL,
    attachment TEXT,
    status leave_status DEFAULT 'PENDING',
    rejection_reason TEXT,
    approved_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TASK COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_tasks_employee ON public.tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leaves_employee ON public.leaves(employee_id);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for web application API access (or customize with Supabase Auth policies)
CREATE POLICY "Public full access to users" ON public.users FOR ALL USING (true);
CREATE POLICY "Public full access to employees" ON public.employees FOR ALL USING (true);
CREATE POLICY "Public full access to tasks" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Public full access to attendance" ON public.attendance FOR ALL USING (true);
CREATE POLICY "Public full access to leaves" ON public.leaves FOR ALL USING (true);
CREATE POLICY "Public full access to task_comments" ON public.task_comments FOR ALL USING (true);

-- 10. SEED DATA
-- Insert Admin User & Employee
INSERT INTO public.users (id, email, password_hash, role) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@example.com', '$2a$10$X7vQ4Jp9.7LwZ4...demo_hash', 'ADMIN'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'employee@example.com', '$2a$10$X7vQ4Jp9.7LwZ4...demo_hash', 'EMPLOYEE')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.employees (id, user_id, employee_id, name, email, phone, department, position, joining_date, status) VALUES
('e1111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'EMP-001', 'Sarah Jenkins (Admin)', 'admin@example.com', '+1 (555) 019-2834', 'Management', 'HR Director', '2023-01-15', 'ACTIVE'),
('e2222222-2222-2222-2222-222222222222', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'EMP-002', 'Alex Morgan', 'employee@example.com', '+1 (555) 234-5678', 'Engineering', 'Senior React Developer', '2023-06-01', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.tasks (id, title, description, employee_id, priority, status, start_date, due_date) VALUES
('t1111111-1111-1111-1111-111111111111', 'Create Responsive Login UI', 'Design and build responsive authentication screens matching NexusHR specs', 'e2222222-2222-2222-2222-222222222222', 'HIGH', 'COMPLETED', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '1 day'),
('t2222222-2222-2222-2222-222222222222', 'Supabase Database Integration', 'Connect frontend REST & Supabase tables for attendance tracking', 'e2222222-2222-2222-2222-222222222222', 'URGENT', 'IN_PROGRESS', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days')
ON CONFLICT DO NOTHING;
