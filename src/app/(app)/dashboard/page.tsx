import Link from "next/link";
import { getDashboardMetrics, getTopOpportunities } from "@/lib/database/stats";
import { MetricCard } from "@/components/shared/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCompact, formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Flame, Globe2, ExternalLink, Target, Users } from "lucide-react";
import { LeadsPerDayChart } from "@/components/dashboard/leads-per-day-chart";

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  const opportunities = await getTopOpportunities(8);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral da prospecção comercial
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total de leads" value={metrics.totalLeads} icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Sem site identificado" value={metrics.noWebsite} icon={<Globe2 className="h-4 w-4" />} />
        <MetricCard label="Sem landing page" value={metrics.noLandingPage} icon={<Target className="h-4 w-4" />} />
        <MetricCard label="Qualificados" value={metrics.qualified} icon={<Flame className="h-4 w-4" />} />
        <MetricCard label="Com site" value={metrics.hasWebsite} />
        <MetricCard label="Contatos pendentes" value={metrics.contactsPending} />
        <MetricCard label="Contatos enviados" value={metrics.contactsSent} />
        <MetricCard label="Respostas" value={metrics.replies} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Oportunidades de prospecção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {opportunities.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma oportunidade encontrada. Rode o Discovery no Leads para encontrar perfis comerciais.
              </p>
            ) : null}
            {opportunities.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {(lead.businessName ?? lead.instagramUsername)
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {lead.businessName ?? lead.instagramUsername}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{lead.instagramUsername} · {lead.city ?? "—"} ·{" "}
                    {formatCompact(lead.followers)} seguidores
                  </p>
                </div>
                <div className="hidden sm:block">
                  <StatusBadge value={lead.websiteStatus} kind="websiteStatus" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Score {lead.leadScore}
                  </span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads criados (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsPerDayChart />
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 font-medium">
              <Flame className="h-4 w-4 text-primary" /> Oportunidades de prospecção
            </p>
            <p className="text-sm text-muted-foreground">
              Negócios com atividade comercial sem site identificado. {metrics.opportunities} leads nesta lista.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/leads?opportunities=1">Ver leads</Link>
            </Button>
            <Button asChild>
              <Link href="/leads?open=discovery">Rodar Discovery</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Últimos leads analisados atualizam o painel automaticamente. Estado coletado em{" "}
        {formatDate(new Date())} · modo demonstrativo com dados simulados não é garantia de compra.
      </p>
    </div>
  );
}