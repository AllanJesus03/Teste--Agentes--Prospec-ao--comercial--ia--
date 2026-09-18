"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { draftCampaignMessagesAction } from "@/lib/actions/campaigns";

export function DraftMessagesButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const run = async () => {
    setPending(true);
    const fd = new FormData();
    fd.set("campaignId", campaignId);
    const result = await draftCampaignMessagesAction(fd);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      `${result.drafted} rascunho(s) gerados${result.reused ? `, ${result.reused} reutilizados` : ""}`
    );
    router.refresh();
  };

  return (
    <Button size="sm" onClick={run} disabled={pending}>
      <FileText className={`mr-1 h-4 w-4 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Gerando rascunhos…" : "Gerar rascunhos"}
    </Button>
  );
}