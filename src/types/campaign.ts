export interface CampaignFilters {
  query?: string;
  status?: string;
}

export interface CampaignSummary {
  id: string;
  name: string;
  description: string | null;
  status: string;
  totalLeads: number;
  leadsQualified: number;
  messagesReady: number;
  messagesPending: number;
  messagesSent: number;
  replies: number;
  createdAt: Date;
  updatedAt: Date;
}