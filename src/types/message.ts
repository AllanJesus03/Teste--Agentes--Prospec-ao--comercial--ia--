export interface MessageFilters {
  status?: string;
  channel?: string;
  leadId?: string;
  campaignId?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}

export interface FollowUpRule {
  days: number;
  templateCategory: string;
}

export interface FollowUpSettings {
  enabled: boolean;
  rules: FollowUpRule[];
}