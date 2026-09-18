import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowRight } from "lucide-react";
import type { Campaign, CampaignLead, Lead } from "@prisma/client";

type CampaignWithLeads = Campaign & {
  leads: Array<CampaignLead & { lead: Pick<Lead, "id" | "instagramUsername" | "businessName"> }>;
};

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PAUSED: "bg-amber-100 text-amber-700 border-amber-200",
  COMPLETED: "bg-blue-100 text-blue-700 border-blue-200",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  COMPLETED: "Concluída",
};

export function CampaignCard({ campaign }: { campaign: CampaignWithLeads }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/campaigns/${campaign.id}`}
            className="font-medium hover:underline"
          >
            {campaign.name}
          </Link>
          <Badge variant="outline" className={STATUS_CLASSES[campaign.status] ?? ""}>
            {STATUS_LABELS[campaign.status] ?? campaign.status}
          </Badge>
        </div>
        {campaign.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {campaign.description}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-4 w-4" /> {campaign.leads.length} lead(s)
        </span>
        <Link
          href={`/campaigns/${campaign.id}`}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Gerenciar <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}