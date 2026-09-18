export interface JobFilters {
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface EnqueueOptions {
  leadId?: string;
  payload?: unknown;
  priority?: number;
  createdBy?: string;
}