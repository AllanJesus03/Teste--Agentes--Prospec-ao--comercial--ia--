"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, X } from "lucide-react";
import {
  setCampaignStatusAction,
  removeLeadFromCampaign,
} from "@/lib/actions/campaigns";
import { CAMPAIGN_STATUS, CAMPAIGN_STATUS_LABELS } from "@/lib/constants";

export function CampaignStatusMenu({ campaignId, current }: { campaignId: string; current: string }) {
  const router = useRouter();
  const [active, setActive] = useState(current);

  const setStatus = async (status: string) => {
    setActive(status);
    const fd = new FormData();
    fd.set("id", campaignId);
    fd.set("status", status);
    const result = await setCampaignStatusAction(fd);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Status atualizado");
      router.refresh();
    }
  };

  return (
    <div className="flex items-center gap-1">
      {Object.entries(CAMPAIGN_STATUS).map(([, value]) => {
        const isActive = active === value;
        return (
          <Button
            key={value}
            size="sm"
            variant={isActive ? "default" : "outline"}
            onClick={() => setStatus(value)}
          >
            {CAMPAIGN_STATUS_LABELS[value]}
          </Button>
        );
      })}
    </div>
  );
}

export function RemoveLeadButton({ campaignId, leadId }: { campaignId: string; leadId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const run = async () => {
    setPending(true);
    const fd = new FormData();
    fd.set("campaignId", campaignId);
    fd.set("leadId", leadId);
    const result = await removeLeadFromCampaign(fd);
    setPending(false);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Lead removido da campanha");
      router.refresh();
    }
  };

  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={run} disabled={pending}>
      <X className="h-4 w-4" />
      <span className="sr-only">Remover</span>
    </Button>
  );
}

export function RefreshButton() {
  const router = useRouter();
  return (
    <Button variant="outline" size="icon" onClick={() => router.refresh()}>
      <RefreshCw className="h-4 w-4" />
    </Button>
  );
}