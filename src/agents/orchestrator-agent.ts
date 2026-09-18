import { BaseAgent } from "@/agents/base-agent";
import type { Agent, AgentContext, AgentResult, DiscoveryCandidate } from "@/types/agent";
import { DiscoveryAgent } from "@/agents/discovery-agent";
import { CommercialAgent } from "@/agents/commercial-agent";
import { WebsiteAgent } from "@/agents/website-agent";
import { QualificationAgent } from "@/agents/qualification-agent";
import { SalesAgent } from "@/agents/sales-agent";
import { OutreachAgent } from "@/agents/outreach-agent";
import { upsertLead } from "@/lib/database/leads";
import { logEntry } from "@/lib/database/log";
import { prisma } from "@/lib/database/prisma";

export interface OrquestratorInput {
  action?: string;
  candidates?: DiscoveryCandidate[];
  discover?: {
    category?: string;
    city?: string;
    limit?: number;
  };
  leadIds?: string[];
}

const MAX_ATTEMPTS = 3;

export class OrchestratorAgent extends BaseAgent {
  name = "Orchestrator Agent";

  protected async run(context: AgentContext): Promise<AgentResult> {
    const input = (context.input ?? {}) as OrquestratorInput;
    const action = input.action ?? "discover";

    switch (action) {
      case "discover":
        return this.discoverPipeline(input);
      case "analyze":
        return this.analyzeLeads(input.leadIds ?? []);
      case "retry":
        return this.retryDeadJobs();
      default:
        return { success: false, errors: [`Ação desconhecida: ${action}`] };
    }
  }

  private async discoverPipeline(input: OrquestratorInput): Promise<AgentResult> {
    const discovery = new DiscoveryAgent();
    const discoveryResult = await discovery.execute({
      input: input.discover ?? {},
    });

    if (!discoveryResult.success) {
      return discoveryResult;
    }

    const candidates = (discoveryResult.data ?? []) as DiscoveryCandidate[];
    const results: unknown[] = [];

    for (const candidate of candidates) {
      try {
        const leadResult = await this.processCandidate(candidate);
        results.push(leadResult);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await logEntry("Orchestrator Agent", `Falha ao processar @${candidate.instagramUsername}: ${message}`, {
          level: "ERROR",
        });
        results.push({ username: candidate.instagramUsername, success: false, error: message });
      }
    }

    const created = results.filter(
      (r) => (r as { created?: boolean }).created
    ).length;

    this.log(
      "INFO",
      `Pipeline de discovery concluído: ${candidates.length} perfis, ${created} novos leads`,
      undefined,
      { total: candidates.length, created }
    );

    return this.ok({ results, total: candidates.length, created });
  }

  private async processCandidate(candidate: DiscoveryCandidate) {
    try {
      const { lead, created } = await upsertLead({
        instagramUsername: candidate.instagramUsername,
        instagramUrl: candidate.sourceUrl,
        businessName: candidate.businessName,
        category: candidate.category,
        bio: candidate.bio,
        city: candidate.city,
        state: candidate.state,
        country: candidate.country,
        followers: candidate.followers,
        posts: candidate.posts,
        websiteUrl: candidate.websiteUrl,
        externalLinks: candidate.externalLinks
          ? JSON.stringify(candidate.externalLinks)
          : undefined,
        whatsapp: candidate.whatsapp,
        contactEmail: candidate.contactEmail,
        dataSource: candidate.dataSource,
        sourceUrl: candidate.sourceUrl,
      });

      await logEntry(
        created ? "Duplicate Detection Agent" : "Database",
        created
          ? `Novo lead salvo: @${lead.instagramUsername}`
          : `Lead existente atualizado: @${lead.instagramUsername}`,
        { leadId: lead.id }
      );

      await this.analyzeLead(lead.id);

      return { username: lead.instagramUsername, id: lead.id, created };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { username: candidate.instagramUsername, created: false, error: message };
    }
  }

  async analyzeLead(leadId: string): Promise<AgentResult> {
    const commercial = new CommercialAgent();
    const website = new WebsiteAgent();
    const qualification = new QualificationAgent();
    const sales = new SalesAgent();

    const commercialResult = await commercial.execute({ leadId });
    if (!commercialResult.success) return commercialResult;

    const websiteResult = await website.execute({ leadId });
    if (!websiteResult.success) return websiteResult;

    const qualificationResult = await qualification.execute({ leadId });
    if (!qualificationResult.success) return qualificationResult;

    return sales.execute({ leadId });
  }

  private async analyzeLeads(leadIds: string[]): Promise<AgentResult> {
    const results: unknown[] = [];
    for (const leadId of leadIds) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        results.push({ leadId, success: false, error: "Lead não encontrado" });
        continue;
      }
      if (lead.optedOut) {
        results.push({ leadId, success: false, error: "Opt-out" });
        continue;
      }
      const result = await this.analyzeLead(leadId);
      results.push({ leadId, success: result.success });
    }
    this.log("INFO", `Reanálise de ${leadIds.length} leads`, undefined, {
      ok: results.filter((r) => (r as { success?: boolean }).success).length,
      fail: results.filter((r) => !(r as { success?: boolean }).success).length,
    });
    return this.ok(results);
  }

  private async retryDeadJobs() {
    const jobs = await prisma.job.findMany({
      where: { status: { in: ["FAILED"] }, attempts: { lt: MAX_ATTEMPTS } },
      take: 50,
    });

    for (const job of jobs) {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "PENDING", error: null },
      });
    }

    await logEntry("Orchestrator Agent", `${jobs.length} jobs retentados`, {
      level: "INFO",
    });

    return this.ok({ retried: jobs.length });
  }
}

export const agents: Agent[] = [
  new DiscoveryAgent(),
  new CommercialAgent(),
  new WebsiteAgent(),
  new QualificationAgent(),
  new SalesAgent(),
  new OutreachAgent(),
];