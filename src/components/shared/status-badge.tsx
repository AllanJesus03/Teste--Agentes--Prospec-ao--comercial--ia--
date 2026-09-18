import { Badge } from "@/components/ui/badge";
import {
  LEAD_STATUS_LABELS,
  LEAD_PRIORITY_LABELS,
  MESSAGE_STATUS_LABELS,
  WEBSITE_STATUS_LABELS,
  SALES_OPPORTUNITY_LABELS,
  LANDING_PAGE_STATUS_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const LEAD_STATUS_CLASSES: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-700 border-slate-200",
  QUALIFIED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CONTACT_PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  CONTACTED: "bg-blue-100 text-blue-700 border-blue-200",
  REPLIED: "bg-violet-100 text-violet-700 border-violet-200",
  MEETING: "bg-cyan-100 text-cyan-700 border-cyan-200",
  PROPOSAL: "bg-indigo-100 text-indigo-700 border-indigo-200",
  CUSTOMER: "bg-green-100 text-green-700 border-green-200",
  NOT_INTERESTED: "bg-muted text-muted-foreground",
  OPTED_OUT: "bg-red-100 text-red-700 border-red-200",
};

const PRIORITY_CLASSES: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  HIGH: "bg-red-100 text-red-700 border-red-200",
};

const WEBSITE_CLASSES: Record<string, string> = {
  HAS_WEBSITE: "bg-blue-100 text-blue-700 border-blue-200",
  HAS_LANDING_PAGE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  HAS_ECOMMERCE: "bg-green-100 text-green-700 border-green-200",
  HAS_LINK_HUB: "bg-cyan-100 text-cyan-700 border-cyan-200",
  HAS_WHATSAPP_ONLY: "bg-amber-100 text-amber-700 border-amber-200",
  HAS_SOCIAL_ONLY: "bg-slate-100 text-slate-600 border-slate-200",
  NO_EXTERNAL_LINK: "bg-violet-100 text-violet-700 border-violet-200",
  UNKNOWN: "bg-muted text-muted-foreground",
};

const MESSAGE_CLASSES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  PENDING_REVIEW: "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-100 text-blue-700 border-blue-200",
  SENT: "bg-violet-100 text-violet-700 border-violet-200",
  DELIVERED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REPLIED: "bg-green-100 text-green-700 border-green-200",
  FAILED: "bg-red-100 text-red-700 border-red-200",
  OPTED_OUT: "bg-red-100 text-red-700 border-red-200",
};

const LABEL_MAPS: Record<string, Record<string, string>> = {
  leadStatus: LEAD_STATUS_LABELS,
  leadPriority: LEAD_PRIORITY_LABELS,
  messageStatus: MESSAGE_STATUS_LABELS,
  websiteStatus: WEBSITE_STATUS_LABELS,
  landingPageStatus: LANDING_PAGE_STATUS_LABELS,
  salesOpportunity: SALES_OPPORTUNITY_LABELS,
};

const CLASS_MAPS: Record<string, Record<string, string>> = {
  leadStatus: LEAD_STATUS_CLASSES,
  leadPriority: PRIORITY_CLASSES,
  messageStatus: MESSAGE_CLASSES,
  websiteStatus: WEBSITE_CLASSES,
  landingPageStatus: WEBSITE_CLASSES,
  salesOpportunity: PRIORITY_CLASSES,
};

export function StatusBadge({
  value,
  kind = "leadStatus",
  className,
}: {
  value?: string | null;
  kind?: keyof typeof LABEL_MAPS;
  className?: string;
}) {
  if (!value) return <Badge variant="outline">—</Badge>;
  const labels = LABEL_MAPS[kind];
  const classes = CLASS_MAPS[kind] ?? {};
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap font-medium", classes[value], className)}
    >
      {labels[value] ?? value}
    </Badge>
  );
}