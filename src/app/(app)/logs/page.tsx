import { prisma } from "@/lib/database/prisma";
import { formatDateTime } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeJsonParse } from "@/lib/utils/format";

interface PageProps {
  searchParams: Promise<{ level?: string; page?: string }>;
}

const PAGE_SIZE = 100;
const LEVEL_CLASSES: Record<string, string> = {
  INFO: "bg-slate-100 text-slate-700",
  WARN: "bg-amber-100 text-amber-700",
  ERROR: "bg-red-100 text-red-700",
};

const LEVEL_ORDER = ["ALL", "INFO", "WARN", "ERROR"];

export default async function LogsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const level = sp.level && sp.level !== "ALL" ? sp.level : undefined;
  const page = Math.max(1, Number(sp.page ?? 1));

  const where = level ? { level } : {};
  const [logs, total, groups] = await Promise.all([
    prisma.logEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.logEntry.count({ where }),
    prisma.logEntry.groupBy({ by: ["level"], _count: true }),
  ]);

  const counts: Record<string, number> = { ALL: total };
  for (const g of groups) counts[g.level] = g._count;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">Logs do sistema</h1>
        <p className="text-sm text-muted-foreground">
          Rastreabilidade completa das ações dos agentes e do sistema
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {LEVEL_ORDER.map((lv) => (
          <a
            key={lv}
            href={`/logs?${new URLSearchParams({ level: lv, page: "1" })}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              (level ?? "ALL") === lv
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {lv} ({counts[lv] ?? 0})
          </a>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 pt-0">
          <div className="max-h-[70vh] divide-y overflow-y-auto">
            {logs.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Sem registros com este filtro.
              </p>
            ) : null}
            {logs.map((log) => (
              <LogRow
                key={log.id}
                agent={log.agent}
                level={log.level}
                message={log.message}
                leadId={log.leadId}
                metadata={log.metadata}
                createdAt={log.createdAt}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {page} de {totalPages} · {total} registro(s)
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <a href={`/logs?${new URLSearchParams({ level: level ?? "ALL", page: String(page - 1) })}`} className="rounded border px-3 py-1 hover:bg-accent">
              Anterior
            </a>
          ) : null}
          {page < totalPages ? (
            <a href={`/logs?${new URLSearchParams({ level: level ?? "ALL", page: String(page + 1) })}`} className="rounded border px-3 py-1 hover:bg-accent">
              Próxima
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LogRow({
  agent,
  level,
  message,
  leadId,
  metadata,
  createdAt,
}: {
  agent: string;
  level: string;
  message: string;
  leadId: string | null;
  metadata: string | null;
  createdAt: Date;
}) {
  const meta = safeJsonParse<unknown>(metadata, null);
  return (
    <div className="grid gap-1 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={LEVEL_CLASSES[level] ?? ""}>
          {level}
        </Badge>
        <span className="text-xs font-medium">{agent}</span>
        <span className="text-xs text-muted-foreground">
          {formatDateTime(createdAt)}
        </span>
        {leadId ? (
          <a
            href={`/leads/${leadId}`}
            className="text-xs text-primary underline-offset-2 hover:underline"
          >
            lead
          </a>
        ) : null}
      </div>
      <p className="text-sm text-foreground">{message}</p>
      {meta ? (
        <pre className="overflow-x-auto rounded bg-muted/40 p-2 text-[11px] text-muted-foreground">
          {JSON.stringify(meta, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}