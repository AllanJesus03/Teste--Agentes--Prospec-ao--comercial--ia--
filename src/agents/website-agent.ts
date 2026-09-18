import { BaseAgent } from "@/agents/base-agent";
import type { AgentContext, AgentResult } from "@/types/agent";
import { prisma } from "@/lib/database/prisma";
import { WebsiteAnalyzer } from "@/lib/website/analyzer";
import { WEBSITE_STATUS, LANDING_PAGE_STATUS } from "@/lib/constants";

export class WebsiteAgent extends BaseAgent {
  name = "Website Agent";

  protected async run(context: AgentContext): Promise<AgentResult> {
    if (!context.leadId) {
      return { success: false, errors: ["leadId é obrigatório"] };
    }

    const lead = await prisma.lead.findUnique({ where: { id: context.leadId } });
    if (!lead) {
      return { success: false, errors: ["Lead não encontrado"] };
    }

    const analyzer = new WebsiteAnalyzer();
    const classification = await analyzer.classify({
      bio: lead.bio,
      externalLinks: parseJsonArray(lead.externalLinks),
      websiteUrl: lead.websiteUrl,
    });

    const analysisUrl = classification.urls[0] ?? lead.websiteUrl;
    let websiteAnalysis = null;

    if (
      analysisUrl &&
      classification.status !== WEBSITE_STATUS.NO_EXTERNAL_LINK &&
      classification.urls.length > 0
    ) {
      websiteAnalysis = await analyzer.analyzeUrl(analysisUrl);
      this.log(
        websiteAnalysis.reachable ? "INFO" : "WARN",
        websiteAnalysis.reachable
          ? `Site acessível: ${analysisUrl}`
          : `Site não alcançável: ${analysisUrl} (${websiteAnalysis.error ?? ""})`,
        context.leadId
      );
    }

    const websiteStatus = classification.status;
    const hasLandingPage =
      websiteStatus === WEBSITE_STATUS.HAS_LANDING_PAGE ||
      (websiteAnalysis?.is_landing_page ?? false);

    const landingPageStatus = hasLandingPage
      ? LANDING_PAGE_STATUS.HAS_LANDING_PAGE
      : websiteStatus === WEBSITE_STATUS.NO_EXTERNAL_LINK
        ? LANDING_PAGE_STATUS.NO_EXTERNAL_LINK
        : websiteStatus === WEBSITE_STATUS.UNKNOWN
          ? LANDING_PAGE_STATUS.UNKNOWN
          : LANDING_PAGE_STATUS.NO_LANDING_PAGE;

    await prisma.lead.update({
      where: { id: context.leadId },
      data: {
        websiteUrl: lead.websiteUrl ?? classification.urls[0] ?? null,
        externalLinks: classification.urls.length
          ? JSON.stringify(classification.urls)
          : lead.externalLinks,
        websiteStatus,
        landingPageStatus,
        websiteQualityScore: websiteAnalysis?.quality_score ?? null,
        websiteAnalysis: websiteAnalysis
          ? JSON.stringify(websiteAnalysis)
          : null,
        websiteNotReachable:
          websiteAnalysis != null && !websiteAnalysis.reachable,
        analysisFailed: websiteAnalysis?.error
          ? websiteAnalysis.error.startsWith("ANALYSIS_FAILED")
          : false,
        lastCheckedAt: new Date(),
      },
    });

    this.log(
      "INFO",
      `Status do site: ${websiteStatus}`,
      context.leadId,
      classification
    );

    const warnings: string[] = [];
    if (websiteAnalysis && !websiteAnalysis.reachable) {
      warnings.push(
        "Site não alcançável. Não é possível afirmar que o negócio não possui site — apenas que o site identificado não respondeu."
      );
    }
    return this.ok({ ...classification, websiteAnalysis, landingPageStatus }, warnings);
  }
}

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}