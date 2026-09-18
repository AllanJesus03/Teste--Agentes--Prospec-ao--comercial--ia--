export const WEBSITE_STATUS = {
  HAS_WEBSITE: "HAS_WEBSITE",
  HAS_LANDING_PAGE: "HAS_LANDING_PAGE",
  HAS_ECOMMERCE: "HAS_ECOMMERCE",
  HAS_LINK_HUB: "HAS_LINK_HUB",
  HAS_WHATSAPP_ONLY: "HAS_WHATSAPP_ONLY",
  HAS_SOCIAL_ONLY: "HAS_SOCIAL_ONLY",
  NO_EXTERNAL_LINK: "NO_EXTERNAL_LINK",
  UNKNOWN: "UNKNOWN",
} as const;

export type WebsiteStatus = (typeof WEBSITE_STATUS)[keyof typeof WEBSITE_STATUS];

export const LANDING_PAGE_STATUS = {
  HAS_LANDING_PAGE: "HAS_LANDING_PAGE",
  NO_LANDING_PAGE: "NO_LANDING_PAGE",
  NO_EXTERNAL_LINK: "NO_EXTERNAL_LINK",
  UNKNOWN: "UNKNOWN",
} as const;

export type LandingPageStatus =
  (typeof LANDING_PAGE_STATUS)[keyof typeof LANDING_PAGE_STATUS];

export const LANDING_PAGE_STATUS_LABELS: Record<string, string> = {
  HAS_LANDING_PAGE: "Com landing page",
  NO_LANDING_PAGE: "Sem landing page",
  NO_EXTERNAL_LINK: "Sem link externo",
  UNKNOWN: "Desconhecido",
};

export const LEAD_STATUS = {
  NEW: "NEW",
  QUALIFIED: "QUALIFIED",
  CONTACT_PENDING: "CONTACT_PENDING",
  CONTACTED: "CONTACTED",
  REPLIED: "REPLIED",
  MEETING: "MEETING",
  PROPOSAL: "PROPOSAL",
  CUSTOMER: "CUSTOMER",
  NOT_INTERESTED: "NOT_INTERESTED",
  OPTED_OUT: "OPTED_OUT",
} as const;

export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];

export const LEAD_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;

export type LeadPriority = (typeof LEAD_PRIORITY)[keyof typeof LEAD_PRIORITY];

export const SALES_OPPORTUNITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;

export type SalesOpportunity =
  (typeof SALES_OPPORTUNITY)[keyof typeof SALES_OPPORTUNITY];

export const MESSAGE_STATUS = {
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  APPROVED: "APPROVED",
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  REPLIED: "REPLIED",
  FAILED: "FAILED",
  OPTED_OUT: "OPTED_OUT",
} as const;

export type MessageStatus = (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];

export const MESSAGE_CHANNEL = {
  INSTAGRAM_DM: "INSTAGRAM_DM",
  WHATSAPP: "WHATSAPP",
  EMAIL: "EMAIL",
} as const;

export type MessageChannel = (typeof MESSAGE_CHANNEL)[keyof typeof MESSAGE_CHANNEL];

export const JOB_TYPE = {
  DISCOVERY: "DISCOVERY",
  ANALYSIS: "ANALYSIS",
  WEBSITE: "WEBSITE",
  AI: "AI",
  OUTREACH: "OUTREACH",
  REANALYZE: "REANALYZE",
} as const;

export type JobType = (typeof JOB_TYPE)[keyof typeof JOB_TYPE];

export const JOB_STATUS = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

export const CAMPAIGN_STATUS = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
} as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];

export const CAMPAIGN_LEAD_STATUS = {
  PENDING: "PENDING",
  MESSAGE_DRAFTED: "MESSAGE_DRAFTED",
  APPROVED: "APPROVED",
  SENT: "SENT",
  REPLIED: "REPLIED",
  OPTED_OUT: "OPTED_OUT",
} as const;

export const LOG_LEVEL = {
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
} as const;

export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

export const TEMPLATE_CATEGORY = {
  FIRST_CONTACT: "first_contact",
  FOLLOW_UP: "follow_up",
  LANDING_OFFER: "landing_offer",
  SITE_OFFER: "site_offer",
  CATALOG_OFFER: "catalog_offer",
  BOOKING_OFFER: "booking_offer",
} as const;

export type TemplateCategory =
  (typeof TEMPLATE_CATEGORY)[keyof typeof TEMPLATE_CATEGORY];

export const TEMPLATE_VARIABLES = [
  "business_name",
  "category",
  "city",
  "service",
  "instagram_username",
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

export const DEFAULT_CATEGORIES = [
  "Nutricionista",
  "Loja de roupas",
  "Loja de calçados",
  "Salão de beleza",
  "Barbearia",
  "Clínica",
  "Estética",
  "Academia",
  "Personal trainer",
  "Mecânica",
  "Auto center",
  "Oficina",
  "Restaurante",
  "Pizzaria",
  "Confeitaria",
  "Padaria",
  "Pet shop",
  "Veterinário",
  "Fotógrafo",
  "Arquiteto",
  "Designer",
  "Dentista",
  "Psicólogo",
  "Advogado",
  "Imobiliária",
  "Corretor",
  "Loja de móveis",
  "Loja de decoração",
  "Loja de eletrônicos",
  "Assistência técnica",
  "Prestador de serviços",
  "Profissional autônomo",
  "Pequena empresa",
  "E-commerce local",
  "Outros negócios",
] as const;

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "Novo",
  QUALIFIED: "Qualificado",
  CONTACT_PENDING: "Contato pendente",
  CONTACTED: "Contatado",
  REPLIED: "Respondeu",
  MEETING: "Reunião",
  PROPOSAL: "Proposta",
  CUSTOMER: "Cliente",
  NOT_INTERESTED: "Sem interesse",
  OPTED_OUT: "Opt-out",
};

export const MESSAGE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  PENDING_REVIEW: "Aguardando revisão",
  APPROVED: "Aprovado",
  SENT: "Enviada",
  DELIVERED: "Entregue",
  REPLIED: "Respondida",
  FAILED: "Falhou",
  OPTED_OUT: "Opt-out",
};

export const LEAD_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};

export const WEBSITE_STATUS_LABELS: Record<string, string> = {
  HAS_WEBSITE: "Tem site",
  HAS_LANDING_PAGE: "Tem landing page",
  HAS_ECOMMERCE: "Tem e-commerce",
  HAS_LINK_HUB: "Link hub",
  HAS_WHATSAPP_ONLY: "Só WhatsApp",
  HAS_SOCIAL_ONLY: "Só redes sociais",
  NO_EXTERNAL_LINK: "Sem link externo",
  UNKNOWN: "Desconhecido",
};

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  COMPLETED: "Concluída",
};

export const SALES_OPPORTUNITY_LABELS: Record<string, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
};

export const JOB_TYPE_LABELS: Record<string, string> = {
  DISCOVERY: "Discovery",
  ANALYSIS: "Análise comercial",
  WEBSITE: "Análise de site",
  AI: "IA",
  OUTREACH: "Outreach",
  REANALYZE: "Reanálise",
};

export const TEMPLATE_CATEGORY_LABELS: Record<string, string> = {
  first_contact: "Primeiro contato",
  follow_up: "Follow-up",
  landing_offer: "Oferta de landing page",
  site_offer: "Oferta de site",
  catalog_offer: "Oferta de catálogo",
  booking_offer: "Oferta de agendamento",
};