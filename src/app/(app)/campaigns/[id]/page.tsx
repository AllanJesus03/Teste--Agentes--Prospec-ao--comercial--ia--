import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/database/prisma";
import { AddLeadsDialog } from "@/components/campaigns/add-leads-dialog";
import { DraftMessagesButton } from "@/components/campaigns/draft-messages-button";
import { CampaignStatusMenu, RemoveLeadButton } from "@/components/campaigns/campaign-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users } from "lucide-react";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      leads: {
        orderBy: { createdAt: "asc" },
        include: {
          lead: {
            select: {
              id: true,
              instagramUsername: true,
              businessName: true,
              category: true,
              city: true,
              state: true,
              leadScore: true,
              leadStatus: true,
              optedOut: true,
            },
          },
        },
      },
    },
  });
  if (!campaign) notFound();

  const availableLeads = await prisma.lead.findMany({
    where: {
      optedOut: false,
      NOT: { campaignLeads: { some: { campaignId: id } } },
    },
    orderBy: { leadScore: "desc" },
    take: 60,
    select: {
      id: true,
      instagramUsername: true,
      businessName: true,
      category: true,
      leadScore: true,
      city: true,
      state: true,
    },
  });

  return (
    <div className="grid gap-6">
      <div>
        <Link
          href="/campaigns"
          className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Campanhas
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{campaign.name}</h1>
            <p className="text-sm text-muted-foreground">
              {campaign.description ?? "Sem descrição"} ·{" "}
              {campaign.leads.length} lead(s)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CampaignStatusMenu campaignId={campaign.id} current={campaign.status} />
            <DraftMessagesButton campaignId={campaign.id} />
            <AddLeadsDialog campaignId={campaign.id} leads={availableLeads} />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> Leads da campanha
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-0">
          <div className="divide-y">
            {campaign.leads.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nenhum lead nesta campanha. Use &quot;Adicionar leads&quot; para começar.
              </p>
            ) : null}
            {campaign.leads.map((cl) => (
              <div
                key={cl.id}
                className={`flex items-center gap-3 p-3 ${cl.lead.optedOut ? "opacity-60" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/leads/${cl.lead.id}`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {cl.lead.businessName ?? `@${cl.lead.instagramUsername}`}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    @{cl.lead.instagramUsername} ·{" "}
                    {cl.lead.category ?? "—"} ·{" "}
                    {cl.lead.city ?? "—"}
                    {cl.lead.state ? `/${cl.lead.state}` : ""} ·{" "}
                    {cl.lead.leadScore} pts
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    cl.status === "PENDING"
                      ? "bg-slate-100 text-slate-600"
                      : cl.status === "MESSAGE_DRAFTED"
                        ? "bg-amber-100 text-amber-700"
                        : cl.status === "SENT"
                          ? "bg-blue-100 text-blue-700"
                          : cl.status === "REPLIED"
                            ? "bg-emerald-100 text-emerald-700"
                            : ""
                  }
                >
                  {cl.status
                    .split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </Badge>
                <StatusBadge value={cl.lead.leadStatus} />
                {cl.lead.optedOut ? <Badge variant="destructive">Opt-out</Badge> : null}
                <RemoveLeadButton campaignId={campaign.id} leadId={cl.lead.id} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}