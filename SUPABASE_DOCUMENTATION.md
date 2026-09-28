# NexusHR — Supabase Architecture & Integration Guide

This document provides a comprehensive overview of how **Supabase** is utilized within the **NexusHR / WorkforceOS** application, including database schema, authentication, Edge Functions, SMTP email dispatch, and security policies.

---

## 1. Executive Summary

Supabase serves as the entire **Backend-as-a-Service (BaaS)** for NexusHR. It replaces traditional standalone server backends (like Node.js/Express or Django) with a unified, high-performance cloud stack powered by:
- **Cloud PostgreSQL Database**: Persistent, relational data storage.
- **Supabase Auth (GoTrue)**: User identity, JWT sessions, role management, and password recovery.
- **Supabase SMTP & Transactional Emails**: Automated invitation and password setup emails.
- **Edge Functions (Deno)**: Secure server-side business logic (e.g., employee onboarding).
- **Row-Level Security (RLS)**: Fine-grained, database-level security policies.

---

## 2. Architecture & Data Flow Diagram

```
+-------------------------------------------------------------------------+
|                        Frontend (React + Vite)                          |
|  - Admin Dashboard         - Employee Portal          - Set Password    |
|  - Attendance Tracking    - Task Management          - Leave Requests  |
+-------------------------------------------------------------------------+
                    |                                   |
         (Supabase JS Client SDK)            (Edge Function Invocation)
                    |                                   |
                    v                                   v
+---------------------------------------+   +-----------------------------+
|             Supabase Auth             |   |    Supabase Edge Function   |
| - JWT Session Management              |   |    `invite-employee`        |
| - Password Reset & Recovery           |   | - Admin token verification  |
| - Supabase SMTP Email Triggers        |   | - Sequential EMP-ID gen     |
+---------------------------------------+   | - Admin API user creation   |
                    |                       +-----------------------------+
                    |                                   |
                    +-----------------+-----------------+
                                      |
                                      v
+-------------------------------------------------------------------------+
|                       Supabase PostgreSQL Database                      |
|                                                                         |
|  +--------------------+  +----------------------+  +-----------------+  |
|  |    public.users    |  |   public.employees   |  |  public.tasks   |  |
|  +--------------------+  +----------------------+  +-----------------+  |
|            |                        |                       |           |
|            +-----------+------------+                       |           |
|                        |                                    |           |
|                        v                                    v           |
|           +-------------------------+            +--------------------+ |
|           |    public.attendance    |            |public.task_comments| |
|           +-------------------------+            +--------------------+ |
|                        |                                                |
|                        v                                                |
|           +-------------------------+                                   |
|           |      public.leaves      |                                   |
|           +-------------------------+                                   |
+-------------------------------------------------------------------------+
```

---

## 3. Core Database Schema (`public` schema)

All data is modeled relationally in PostgreSQL with foreign keys, constraints, and performance indexes:

| Table | Description | Key Relationships |
|---|---|---|
| `users` | Core credentials, authentication status, and roles (`ADMIN`, `EMPLOYEE`). | Referenced by `employees.user_id` |
| `employees` | Staff master directory: name, code (`EMP-001`), department, position, phone, joining date, avatar. | Linked to `users.id` |
| `tasks` | Team tasks, due dates, priority levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and status (`PENDING`, `IN_PROGRESS`, `COMPLETED`). | Foreign Key to `employees.id` |
| `attendance` | Daily check-in/out records, calculated working hours, status (`PRESENT`, `ABSENT`, `LATE`, `LEAVE`). | Unique per `(employee_id, date)` |
| `leaves` | Leave requests, date ranges, reasons, approvals, and audit trail. | Foreign Key to `employees.id` & `users.id` |
| `task_comments` | Discussion and feedback comments on tasks. | Foreign Key to `tasks.id` & `employees.id` |

---

## 4. Supabase Features Used in This Project

### 4.1. Authentication & Password Lifecycle
- **Dual Portal Access**: Users are authenticated as either `ADMIN` or `EMPLOYEE`.
- **Invitation Flow**: When an admin invites an employee, Supabase Auth creates an invited user record and triggers an onboarding email.
- **Password Setup (`/set-password`)**: Employees set up their personal password using a secured recovery/invite token without requiring pre-shared temporary passwords.
- **Session Continuity**: Supabase JWT tokens are persisted in browser storage to maintain session across refreshes.

### 4.2. Edge Functions (`supabase/functions/invite-employee`)
- Runs on Supabase Deno runtime.
- Executes privileged tasks using `SUPABASE_SERVICE_ROLE_KEY`.
- Verifies admin caller identity before allowing employee creation.
- Computes sequential employee identifiers (`EMP-001`, `EMP-002`, etc.).
- Calls `supabase.auth.admin.inviteUserByEmail()` or fallback user creation with SMTP dispatch.

### 4.3. High-Performance Indexing & Querying
The database includes performance indexes:
- `idx_employees_department`
- `idx_tasks_employee`
- `idx_attendance_employee_date`
- `idx_leaves_employee`

### 4.4. Offline Resilience & Mock Fallback
The frontend includes fallback handling (`src/services/storageService.ts`):
- If the Supabase API is reachable, all read/write operations execute against PostgreSQL in real time.
- If Supabase environment variables are missing or connection fails, the frontend operates gracefully using `localStorage` data without throwing breaking runtime exceptions.

---

## 5. Configuration & Environment Variables

The project connects to Supabase via environment variables configured in `.env`:

```env
# Supabase Project URL (found in Project Settings > API)
VITE_SUPABASE_URL=https://<project-ref>.supabase.co

# Supabase Public Anon Key (safe for frontend use)
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Initializing the Database:
To set up or restore the database schema, run the SQL script located in:
`supabase_schema.sql` directly inside the **Supabase SQL Editor** (`https://supabase.com/dashboard/project/_/sql`).

---

## 6. Summary of Benefits

1. **Zero Infrastructure Maintenance**: No need to manage VPS servers, database upgrades, or SSL certificates.
2. **Instant Scalability**: PostgreSQL handles queries with ACID compliance and high concurrency.
3. **Out-of-the-Box Security**: Encrypted passwords, JWT tokens, and PostgreSQL Row-Level Security.
4. **Built-in Transactional Emails**: Eliminates the need for 3rd-party email delivery services (SendGrid/Mailgun) for basic user onboarding.
