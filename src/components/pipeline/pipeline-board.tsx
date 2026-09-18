"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { setLeadStatusAction } from "@/lib/actions/pipeline";
import { LEAD_STATUS } from "@/lib/constants";
import { formatCompact } from "@/lib/utils/format";
import type { Lead } from "@prisma/client";

export function PipelineColumn({
  title,
  color,
  leads,
}: {
  title: string;
  color: string;
  leads: Lead[];
}) {
  return (
    <div className="flex min-h-[300px] w-full flex-col rounded-lg border bg-muted/20">
      <div className="flex items-center justify-between rounded-t-lg border-b bg-muted/40 px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          {title}
        </span>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs tabular-nums">
          {leads.length}
        </span>
      </div>
      <div className="grid gap-2 p-2">
        {leads.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Vazio
          </p>
        ) : null}
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [moving, setMoving] = useState(false);

  const move = async (status: string) => {
    setMoving(true);
    const fd = new FormData();
    fd.set("id", lead.id);
    fd.set("status", status);
    const result = await setLeadStatusAction(fd);
    setMoving(false);
    if (result?.error) toast.error(result.error);
    else router.refresh();
  };

  const next = nextStatus(lead.leadStatus);

  return (
    <div className="rounded-md border bg-background p-3">
      <Link
        href={`/leads/${lead.id}`}
        className="block font-medium text-sm hover:underline"
      >
        {lead.businessName ?? `@${lead.instagramUsername}`}
      </Link>
      <p className="truncate text-xs text-muted-foreground">
        @{lead.instagramUsername} · {formatCompact(lead.followers)} seg
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tabular-nums">
          {lead.leadScore} pts
        </span>
        {next && !moving && lead.leadStatus !== LEAD_STATUS.CUSTOMER ? (
          <button
            onClick={() => move(next)}
            className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent"
            title={`Mover para ${next}`}
          >
            Mover →
          </button>
        ) : null}
      </div>
    </div>
  );
}

function nextStatus(current: string): string | null {
  const order: string[] = [
    LEAD_STATUS.NEW,
    LEAD_STATUS.QUALIFIED,
    LEAD_STATUS.CONTACT_PENDING,
    LEAD_STATUS.CONTACTED,
    LEAD_STATUS.REPLIED,
    LEAD_STATUS.MEETING,
    LEAD_STATUS.PROPOSAL,
    LEAD_STATUS.CUSTOMER,
  ];
  const idx = order.indexOf(current);
  if (idx === -1 || idx === order.length - 1) return null;
  return order[idx + 1];
}