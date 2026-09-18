import type { CommercialSignal } from "@/types/lead";

export interface AgentContext {
  leadId?: string;
  input?: unknown;
  metadata?: Record<string, unknown>;
}

export interface AgentResult {
  success: boolean;
  data?: unknown;
  errors?: string[];
  warnings?: string[];
}

export interface Agent {
  name: string;
  execute(context: AgentContext): Promise<AgentResult>;
}

export interface AIProvider {
  name: string;
  generateText(input: string, system?: string): Promise<string>;
  classify(input: string): Promise<unknown>;
}

export interface DiscoveryCandidate {
  instagramUsername: string;
  businessName?: string;
  category?: string;
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  followers?: number;
  posts?: number;
  websiteUrl?: string;
  externalLinks?: string[];
  whatsapp?: string;
  contactEmail?: string;
  dataSource?: string;
  sourceUrl?: string;
}

export interface CommercialAnalysis {
  commercialScore: number;
  signals: CommercialSignal[];
}

export interface QualificationResult {
  leadStatus: string;
  leadPriority: string;
  commercialScore: number;
  websiteStatus: string;
  salesOpportunity: string;
  leadScore: number;
  reasons: string[];
}

export interface OutreachMessage {
  subject?: string;
  body: string;
  variables: Record<string, string>;
}