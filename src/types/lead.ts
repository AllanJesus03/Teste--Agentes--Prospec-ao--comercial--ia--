import type { Lead } from "@prisma/client";
import type { WebsiteStatus } from "@/lib/constants";

export interface CommercialSignal {
  signal: string;
  found: boolean;
}

export interface WebsiteAnalysisResult {
  url: string;
  reachable: boolean;
  has_https: boolean;
  has_contact: boolean;
  has_whatsapp: boolean;
  has_form: boolean;
  mobile_friendly: boolean;
  is_landing_page: boolean;
  is_ecommerce: boolean;
  quality_score: number;
  title?: string;
  error?: string;
}

export interface WebsiteClassification {
  status: WebsiteStatus;
  urls: string[];
  notes?: string;
}

export interface AiAnalysis {
  what_they_sell: string;
  why_lead: string;
  problem_solved: string;
  landing_page_suggestion: string;
  suggested_structure: string[];
  commercial_argument: string;
}

export interface LeadWithRelations extends Lead {
  contacts?: Array<{
    id: string;
    channel: string;
    message: string;
    status: string;
    sentAt: Date | null;
    responseAt: Date | null;
    notes: string | null;
    createdAt: Date;
  }>;
}

export interface LeadFilters {
  query?: string;
  category?: string;
  websiteStatus?: string;
  landingPageStatus?: string;
  priority?: string;
  city?: string;
  state?: string;
  minFollowers?: number;
  maxFollowers?: number;
  minScore?: number;
  maxScore?: number;
  leadStatus?: string;
  opportunities?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}