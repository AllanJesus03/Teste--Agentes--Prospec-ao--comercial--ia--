import { prisma } from "@/lib/database/prisma";
import { MessagesTable } from "@/components/messages/messages-table";
import { Card, CardContent } from "@/components/ui/card";
import { MESSAGE_STATUS } from "@/lib/constants";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 20;

export default async function MessagesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const statusFilter =
    sp.status && sp.status !== "ALL" ? sp.status : undefined;

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const [contacts, total, counts] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        lead: {
          select: {
            id: true,
            instagramUsername: true,
            businessName: true,
            city: true,
            state: true,
          },
        },
      },
    }),
    prisma.contact.count({ where }),
    prisma.contact.groupBy({ by: ["status"], _count: true }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const c of counts) statusCounts[c.status] = c._count;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">Central de Mensagens</h1>
        <p className="text-sm text-muted-foreground">
          Revise, aprove e envie mensagens para leads. Envio exige revisão humana.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[{ key: "ALL", label: `Todas (${total})` }, ...Object.entries(MESSAGE_STATUS).map(
          ([, value]) => ({ key: value, label: `${labelFor(value)} (${statusCounts[value] ?? 0})` })
        )].filter((c) => {
          if (c.key === "ALL") return true;
          return (statusCounts[c.key] ?? 0) > 0;
        }).map((tab) => {
          const active = (statusFilter ?? "ALL") === tab.key;
          return (
            <a
              key={tab.key}
              href={`/messages?status=${tab.key}${tab.key !== sp.status && tab.key === "ALL" ? "" : ""}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
              data-active={active}
            >
              {tab.label}
            </a>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0 pt-0">
          <MessagesTable contacts={contacts} />
        </CardContent>
      </Card>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 ? (
              <a href={`/messages?${new URLSearchParams({ status: statusFilter ?? "ALL", page: String(page - 1) })}`} className="rounded border px-3 py-1 hover:bg-accent">
                Anterior
              </a>
            ) : null}
            {page < totalPages ? (
              <a href={`/messages?${new URLSearchParams({ status: statusFilter ?? "ALL", page: String(page + 1) })}`} className="rounded border px-3 py-1 hover:bg-accent">
                Próxima
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function labelFor(status: string): string {
  switch (status) {
    case MESSAGE_STATUS.DRAFT:
      return "Rascunho";
    case MESSAGE_STATUS.PENDING_REVIEW:
      return "Revisão";
    case MESSAGE_STATUS.APPROVED:
      return "Aprovadas";
    case MESSAGE_STATUS.SENT:
      return "Enviadas";
    case MESSAGE_STATUS.DELIVERED:
      return "Entregues";
    case MESSAGE_STATUS.REPLIED:
      return "Respondidas";
    case MESSAGE_STATUS.FAILED:
      return "Falhas";
    case MESSAGE_STATUS.OPTED_OUT:
      return "Opt-out";
    default:
      return status;
  }
}