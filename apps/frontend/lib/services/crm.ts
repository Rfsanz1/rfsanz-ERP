import { api } from '../api';

export interface CrmStats {
  total_leads: number;
  qualified: number;
  won: number;
  lost: number;
  pipeline_value: number;
  win_rate: number;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  stage: 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  value: number;
  assigned_to?: string;
  created_at: string;
  expected_close?: string;
}

export interface Activity {
  id: string;
  lead_id: string;
  lead_name: string;
  type: 'call' | 'email' | 'meeting' | 'task';
  description: string;
  due_date: string;
  status: 'pending' | 'done' | 'overdue';
  assigned_to?: string;
}

export interface PipelineStage {
  stage: string;
  count: number;
  total_value: number;
  leads: Lead[];
}

export const crmService = {
  getStats: () =>
    api.get<CrmStats>('/crm/stats').then((r) => r.data),

  getLeads: (params?: { page?: number; limit?: number; stage?: string; search?: string }) =>
    api.get<{ data: Lead[]; total: number }>('/crm/leads', { params }).then((r) => r.data),

  convertLead: (id: string) =>
    api.post(`/crm/leads/${id}/convert`).then((r) => r.data),

  getPipeline: () =>
    api.get<PipelineStage[]>('/crm/pipeline').then((r) => r.data),

  getActivities: (params?: { due?: string; status?: string }) =>
    api.get<{ data: Activity[]; total: number }>('/crm/activities', { params }).then((r) => r.data),
};
