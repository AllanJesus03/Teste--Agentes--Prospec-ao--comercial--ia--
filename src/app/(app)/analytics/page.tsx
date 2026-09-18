import { getAnalyticsMetrics } from "@/lib/database/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/shared/metric-card";
import { LeadsPerDayChart } from "@/components/dashboard/leads-per-day-chart";
import { BarchartVertical, BarchartHorizontal } from "@/components/analytics/bar-charts";
import {
  LEAD_STATUS_LABELS,
  WEBSITE_STATUS_LABELS,
} from "@/lib/constants";
import { formatCompact, formatDate } from "@/lib/utils/format";
import { BarChart3, MessageCircle, Users, Target, TrendingUp, Ban } from "lucide-react";

const STATUS_LABELS: Record<string, string> = LEAD_STATUS_LABELS;
const WEBSITE_LABELS: Record<string, string> = WEBSITE_STATUS_LABELS;

export default async function AnalyticsPage() {
  const m = await getAnalyticsMetrics();

  const leadsByStatus = m.leadsByStatus
    .filter((d) => (d.count ?? 0) > 0)
    .map((d) => ({ label: STATUS_LABELS[d.status] ?? d.status, count: d.count }))
    .slice(0, 10);

  const leadsByCategory = m.leadsByCategory
    .map((d) => ({ label: d.category ?? "Sem categoria", count: d.count }));

  const leadsByWebsite = m.leadsByWebsiteStatus
    .map((d) => ({ label: WEBSITE_LABELS[d.status] ?? d.status, count: d.count }));

  const leadsPerDay = m.leadsPerDay;

  const funnelData = [
    { label: "Descobertos", count: m.leadsFound },
    { label: "Comerciais", count: m.commercialLeads },
    { label: "Sem site", count: m.leadsWithoutWebsite },
    { label: "Qualificados", count: m.qualifiedLeads },
    { label: "Mensagens enviadas", count: m.messagesSent },
    { label: "Respostas", count: m.replies },
  ];

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Métricas consolidadas dos últimos 30 dias de operação
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total leads" value={m.leadsFound} icon={<Users className="h-4 w-4" />} />
        <MetricCard label="Comerciais (score ≥25)" value={m.commercialLeads} icon={<BarChart3 className="h-4 w-4" />} />
        <MetricCard label="Qualificados" value={m.qualifiedLeads} icon={<Target className="h-4 w-4" />} />
        <MetricCard label="Sem landing page" value={m.leadsWithoutLandingPage} icon={<TrendingUp className="h-4 w-4" />} />
        <MetricCard label="Mensagens preparadas" value={m.messagesPrepared} icon={<MessageCircle className="h-4 w-4" />} />
        <MetricCard label="Respostas" value={m.replies} icon={<MessageCircle className="h-4 w-4" />} />
        <MetricCard label="Reuniões" value={m.meetings} />
        <MetricCard label="Clientes" value={m.customers} />
        <MetricCard label="Propostas" value={m.proposals} />
        <MetricCard label="Opt-outs" value={m.optedOut} icon={<Ban className="h-4 w-4" />} />
        <MetricCard
          label="Taxa de resposta"
          value={`${m.replyRate}%`}
          hint={m.messagesSent > 0 ? `${m.replies} / ${m.messagesSent}` : "—"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads criados (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsPerDayChart data={leadsPerDay} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funil de conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {funnelData.map((step) => {
                const pct = m.leadsFound > 0 ? Math.round((step.count / m.leadsFound) * 100) : 0;
                return (
                  <div key={step.label} className="flex items-center gap-3">
                    <span className="w-40 text-sm text-muted-foreground">
                      {step.label}
                    </span>
                    <div className="flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-sm tabular-nums">
                      {formatCompact(step.count)}{" "}
                      <span className="text-xs text-muted-foreground">({pct}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por status</CardTitle>
          </CardHeader>
          <CardContent>
            <BarchartVertical data={leadsByStatus} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por website</CardTitle>
          </CardHeader>
          <CardContent>
            <BarchartVertical data={leadsByWebsite} color="#f59e0b" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <BarchartHorizontal data={leadsByCategory} color="#ec4899" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads por cidade</CardTitle>
          </CardHeader>
          <CardContent>
            <BarchartHorizontal
              data={m.leadsByCity.map((d) => ({ label: d.city, count: d.count }))}
              color="#06b6d4"
            />
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Métricas recalculadas a cada consulta. O funil pode incluir leads qualificados
        que já avançaram nos estágios. Dados consolidados em {formatDate(new Date())}.
      </p>
    </div>
  );
}