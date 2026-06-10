import { api } from '../api';

export interface HrStats {
  total_employees: number;
  active: number;
  on_leave: number;
  new_this_month: number;
  payroll_this_month: number;
}

export interface Employee {
  id: string;
  name: string;
  nik: string;
  position: string;
  department: string;
  status: 'active' | 'inactive' | 'on_leave';
  join_date: string;
  email: string;
  phone?: string;
  salary?: number;
}

export interface Payroll {
  id: string;
  employee: string;
  period: string;
  gross_salary: number;
  deductions: number;
  net_salary: number;
  status: 'draft' | 'approved' | 'paid';
  paid_date?: string;
}

export interface Attendance {
  id: string;
  employee: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: 'present' | 'absent' | 'late' | 'leave';
}

export const hrService = {
  getStats: () =>
    api.get<HrStats>('/hr/stats').then((r) => r.data),

  getEmployees: (params?: { page?: number; limit?: number; search?: string; department?: string }) =>
    api.get<{ data: Employee[]; total: number }>('/hr/employees', { params }).then((r) => r.data),

  createEmployee: (dto: Partial<Employee>) =>
    api.post<Employee>('/hr/employees', dto).then((r) => r.data),

  getPayrolls: (params?: { period?: string; status?: string }) =>
    api.get<{ data: Payroll[]; total: number }>('/hr/payrolls', { params }).then((r) => r.data),

  getAttendances: (params?: { date?: string; employee_id?: string }) =>
    api.get<{ data: Attendance[]; total: number }>('/hr/attendances', { params }).then((r) => r.data),
};
