import { prisma } from "@/lib/database/prisma";
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog";
import { CampaignCard } from "@/components/campaigns/campaign-card";

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      leads: {
        include: { lead: { select: { id: true, instagramUsername: true, businessName: true } } },
      },
    },
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Campanhas</h1>
          <p className="text-sm text-muted-foreground">
            {campaigns.length} campanha(s) de prospecção
          </p>
        </div>
        <CreateCampaignDialog />
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          Nenhuma campanha criada ainda.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Campanhas agrupam leads para envio em lote. O envio sempre passa por
        revisão na Central de Mensagens e respeita opt-outs.
      </p>
    </div>
  );
}