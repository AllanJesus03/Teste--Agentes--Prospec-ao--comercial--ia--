import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadWithRelations } from "@/lib/database/leads";
import type { WebsiteAnalysisResult, AiAnalysis, CommercialSignal } from "@/types/lead";
import { StatusBadge } from "@/components/shared/status-badge";
import { LeadActions } from "@/components/leads/lead-actions";
import { ContactCard } from "@/components/leads/contact-card";
import { safeJsonParse, formatCompact, formatDateTime } from "@/lib/utils/format";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Link2,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Target,
  Sparkles,
  MessageCircle,
  Users,
  Image as ImageIcon,
} from "lucide-react";
import { MESSAGE_CHANNEL, WEBSITE_STATUS } from "@/lib/constants";

const CHANNEL_LABELS: Record<string, string> = {
  [MESSAGE_CHANNEL.INSTAGRAM_DM]: "Mensagem direta (Instagram)",
  [MESSAGE_CHANNEL.WHATSAPP]: "WhatsApp",
  [MESSAGE_CHANNEL.EMAIL]: "E-mail",
  message: "Mensagem",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLeadWithRelations(id);
  if (!lead) notFound();

  const website = safeJsonParse<WebsiteAnalysisResult | null>(
    lead.websiteAnalysis,
    null
  );
  const commercial = safeJsonParse<CommercialSignal[]>(lead.commercialSignals, []);
  const qualification = safeJsonParse<string[]>(lead.qualificationReasons, []);
  const ai = safeJsonParse<AiAnalysis | null>(lead.aiAnalysis, null);
  const externalLinks = safeJsonParse<string[]>(lead.externalLinks, []);

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {lead.businessName ?? lead.instagramUsername}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <a
              href={lead.instagramUrl ?? `https://instagram.com/${lead.instagramUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              @{lead.instagramUsername}
            </a>
            {lead.category ? <Badge variant="secondary">{lead.category}</Badge> : null}
            {lead.city ? (
              <span>
                {lead.city}
                {lead.state ? `/${lead.state}` : ""}
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge value={lead.leadStatus} />
            <StatusBadge value={lead.leadPriority} kind="leadPriority" />
            <StatusBadge value={lead.salesOpportunity} kind="salesOpportunity" />
          </div>
        </div>
        <LeadActions
          lead={{ id: lead.id, instagramUsername: lead.instagramUsername, optedOut: lead.optedOut }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatMini icon={<Users className="h-4 w-4" />} label="Seguidores" value={formatCompact(lead.followers)} />
        <StatMini icon={<ImageIcon className="h-4 w-4" />} label="Posts" value={formatCompact(lead.posts)} />
        <StatMini icon={<Target className="h-4 w-4" />} label="Score" value={String(lead.leadScore)} />
        <StatMini icon={<FlaskConical className="h-4 w-4" />} label="Comercial" value={String(lead.commercialScore)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid content-start gap-4">
          {/* Website */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-4 w-4" /> Website / Presença online
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={lead.websiteStatus} kind="websiteStatus" />
                {lead.websiteNotReachable && lead.websiteStatus === WEBSITE_STATUS.NO_EXTERNAL_LINK ? (
                  <Badge variant="destructive">Site não alcançável</Badge>
                ) : null}
                {lead.analysisFailed ? (
                  <Badge variant="destructive">Análise falhou</Badge>
                ) : null}
                {lead.landingPageStatus && lead.landingPageStatus !== WEBSITE_STATUS.UNKNOWN ? (
                  <StatusBadge value={lead.landingPageStatus} kind="landingPageStatus" />
                ) : null}
              </div>

              {lead.websiteUrl ? (
                <a
                  href={lead.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary underline underline-offset-2"
                >
                  <Link2 className="h-4 w-4" /> {lead.websiteUrl}
                </a>
              ) : null}

              {externalLinks.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {externalLinks.map((link) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              ) : null}

              {typeof lead.websiteQualityScore === "number" ? (
                <ScoreBar
                  label="Qualidade do site"
                  score={lead.websiteQualityScore}
                />
              ) : null}

              {website ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <FeatureRow label="Respondendo" ok={website.reachable} />
                  <FeatureRow label="Landing page" ok={website.is_landing_page} />
                  <FeatureRow label="E-commerce" ok={website.is_ecommerce} />
                  <FeatureRow label="Contato" ok={website.has_contact} />
                  <FeatureRow label="WhatsApp" ok={website.has_whatsapp} />
                  <FeatureRow label="Formulário" ok={website.has_form} />
                  <FeatureRow label="Mobile" ok={website.mobile_friendly} />
                  <FeatureRow label="HTTPS" ok={website.has_https} />
                </div>
              ) : null}

              {website?.title ? (
                <p className="text-sm text-muted-foreground">{website.title}</p>
              ) : null}
            </CardContent>
          </Card>

          {/* Commercial signals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FlaskConical className="h-4 w-4" /> Sinais comerciais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {commercial.length ? (
                <ul className="grid gap-1.5">
                  {commercial.map(({ signal, found }) =>
                    found ? (
                      <li key={signal} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {signal}
                      </li>
                    ) : null
                  )}
                  {commercial.every((s) => !s.found) ? (
                    <li className="flex items-start gap-2 text-sm">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      Nenhum sinal comercial claro identificado na bio.
                    </li>
                  ) : null}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sinais comerciais ainda não analisados.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-4">
          {/* AI analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4" /> Análise de inteligência artificial
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {ai ? (
                <div className="grid gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      O que vendem
                    </p>
                    <p className="text-sm">{ai.what_they_sell}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Por que é lead
                    </p>
                    <p className="text-sm">{ai.why_lead}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Problema resolvido
                    </p>
                    <p className="text-sm">{ai.problem_solved}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Sugestão de landing page
                    </p>
                    <p className="text-sm">{ai.landing_page_suggestion}</p>
                  </div>
                  {ai.suggested_structure?.length ? (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Estrutura sugerida
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {ai.suggested_structure.map((s) => (
                          <Badge key={s} variant="secondary">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Argumento comercial
                    </p>
                    <p className="text-sm">{ai.commercial_argument}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Análise por IA ainda não realizada ou indisponível.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Qualification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" /> Qualificação
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <ScoreBar label="Score da oportunidade" score={lead.leadScore} />
              {qualification.length ? (
                <ul className="grid gap-1.5">
                  {qualification.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {reason}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sem critérios de qualificação registrados.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Contact history */}
          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <h2 className="text-sm font-semibold">Histórico de contato</h2>
            </div>
            {lead.contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum contato registrado. Use &quot;Gerar mensagem&quot; para criar um
                rascunho.
              </p>
            ) : null}
            {lead.contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                channelLabel={CHANNEL_LABELS[contact.channel] ?? contact.channel}
              />
            ))}
          </div>

          {/* Meta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Informações do cadastro
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
              <MetaItem label="Fonte" value={lead.dataSource ?? "—"} />
              <MetaItem label="Coletado" value={formatDateTime(lead.collectedAt)} />
              <MetaItem label="Última verificação" value={formatDateTime(lead.lastCheckedAt)} />
              <MetaItem label="Criado" value={formatDateTime(lead.createdAt)} />
              <div className="col-span-2">
                <MetaItem label="Notas" value={lead.notes ?? "—"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <XCircle className="h-3.5 w-3.5" />
        Dados coletados por meios públicos e sujeitos às regras das plataformas.{" "}
        <Link href="/logs" className="text-primary underline-offset-2 hover:underline">
          Ver logs de análise
        </Link>
        .
      </div>
    </div>
  );
}

function StatMini({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <span className="text-muted-foreground">{icon}</span>
        <div>
          <p className="text-sm font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FeatureRow({ label, ok }: { label: string; ok?: boolean }) {
  if (ok === undefined) return null;
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5 text-xs">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-slate-400" />
      )}
      <span>{label}</span>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}