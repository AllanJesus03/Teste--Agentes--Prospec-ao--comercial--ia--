import Link from "next/link";
import { prisma } from "@/lib/database/prisma";
import { PipelineColumn } from "@/components/pipeline/pipeline-board";
import {
  LEAD_STATUS,
  LEAD_STATUS_LABELS,
} from "@/lib/constants";

const COLUMN_COLORS: Record<string, string> = {
  [LEAD_STATUS.NEW]: "#94a3b8",
  [LEAD_STATUS.QUALIFIED]: "#10b981",
  [LEAD_STATUS.CONTACT_PENDING]: "#f59e0b",
  [LEAD_STATUS.CONTACTED]: "#3b82f6",
  [LEAD_STATUS.REPLIED]: "#8b5cf6",
  [LEAD_STATUS.MEETING]: "#06b6d4",
  [LEAD_STATUS.PROPOSAL]: "#6366f1",
  [LEAD_STATUS.CUSTOMER]: "#22c55e",
  [LEAD_STATUS.NOT_INTERESTED]: "#64748b",
  [LEAD_STATUS.OPTED_OUT]: "#ef4444",
};

const COLUMN_ORDER = [
  LEAD_STATUS.NEW,
  LEAD_STATUS.QUALIFIED,
  LEAD_STATUS.CONTACT_PENDING,
  LEAD_STATUS.CONTACTED,
  LEAD_STATUS.REPLIED,
  LEAD_STATUS.MEETING,
  LEAD_STATUS.PROPOSAL,
  LEAD_STATUS.CUSTOMER,
  LEAD_STATUS.NOT_INTERESTED,
  LEAD_STATUS.OPTED_OUT,
];

export default async function PipelinePage() {
  const leads = await prisma.lead.findMany({
    orderBy: [{ leadScore: "desc" }, { updatedAt: "desc" }],
    take: 80,
  });

  const byStatus = new Map<string, typeof leads>();
  for (const lead of leads) {
    const list = byStatus.get(lead.leadStatus) ?? [];
    list.push(lead);
    byStatus.set(lead.leadStatus, list);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Pipeline de vendas</h1>
          <p className="text-sm text-muted-foreground">
            Arraste mentalmente; use &quot;Mover →&quot; para avançar o lead.
          </p>
        </div>
        <Link
          href="/leads"
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver todos os leads →
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {COLUMN_ORDER.map((status) => (
          <PipelineColumn
            key={status}
            title={(LEAD_STATUS_LABELS[status] ?? status).toUpperCase()}
            color={COLUMN_COLORS[status] ?? "#94a3b8"}
            leads={byStatus.get(status) ?? []}
          />
        ))}
      </div>
    </div>
  );
}