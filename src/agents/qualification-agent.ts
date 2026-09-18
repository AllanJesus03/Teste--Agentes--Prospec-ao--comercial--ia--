import { BaseAgent } from "@/agents/base-agent";
import type { AgentContext, AgentResult, QualificationResult } from "@/types/agent";
import { prisma } from "@/lib/database/prisma";
import {
  LEAD_PRIORITY,
  LEAD_STATUS,
  SALES_OPPORTUNITY,
  WEBSITE_STATUS,
} from "@/lib/constants";

export class QualificationAgent extends BaseAgent {
  name = "Qualification Agent";

  protected async run(context: AgentContext): Promise<AgentResult> {
    if (!context.leadId) {
      return { success: false, errors: ["leadId é obrigatório"] };
    }

    const lead = await prisma.lead.findUnique({ where: { id: context.leadId } });
    if (!lead) {
      return { success: false, errors: ["Lead não encontrado"] };
    }

    const commercial = lead.commercialScore ?? 0;
    const websiteStatus = lead.websiteStatus ?? WEBSITE_STATUS.UNKNOWN;
    const noSite =
      websiteStatus === WEBSITE_STATUS.NO_EXTERNAL_LINK ||
      websiteStatus === WEBSITE_STATUS.HAS_WHATSAPP_ONLY ||
      websiteStatus === WEBSITE_STATUS.HAS_LINK_HUB ||
      websiteStatus === WEBSITE_STATUS.HAS_SOCIAL_ONLY;

    const reasons: string[] = [];
    if (commercial >= 30) reasons.push("Negócio comercial ativo identificado");
    if (lead.bio) reasons.push("Biografia com informações comerciais");
    if (noSite) reasons.push("Não possui site identificado nos dados públicos");
    if (!noSite && lead.websiteNotReachable)
      reasons.push("Site identificado não alcançável (requer verificação)");
    if (lead.whatsapp) reasons.push("Possui WhatsApp disponível para contato");
    if (
      (lead.followers ?? 0) >= 1000 &&
      (lead.followers ?? 0) < 100000
    )
      reasons.push("Presença digital relevante com engajamento potencial");

    const salesOpportunity = noSite && commercial >= 50
      ? SALES_OPPORTUNITY.HIGH
      : noSite && commercial >= 25
        ? SALES_OPPORTUNITY.MEDIUM
        : commercial < 25
          ? SALES_OPPORTUNITY.LOW
          : SALES_OPPORTUNITY.MEDIUM;

    const leadScore = Math.min(
      100,
      0 +
        commercial * 0.4 +
        (noSite ? 25 : 0) +
        ((lead.followers ?? 0) >= 1000 ? 10 : 0) +
        (lead.whatsapp ? 10 : 0) +
        ((lead.followers ?? 0) >= 5000 ? 10 : 0) +
        (lead.contactEmail ? 5 : 0)
    );

    const priority =
      salesOpportunity === SALES_OPPORTUNITY.HIGH
        ? LEAD_PRIORITY.HIGH
        : salesOpportunity === SALES_OPPORTUNITY.MEDIUM
          ? LEAD_PRIORITY.MEDIUM
          : LEAD_PRIORITY.LOW;

    const leadStatus =
      lead.leadStatus === LEAD_STATUS.OPTED_OUT ||
      lead.leadStatus === LEAD_STATUS.NOT_INTERESTED ||
      ["CONTACTED", "REPLIED", "MEETING", "PROPOSAL", "CUSTOMER"].includes(
        lead.leadStatus
      )
        ? lead.leadStatus
        : salesOpportunity === SALES_OPPORTUNITY.LOW
          ? LEAD_STATUS.NEW
          : LEAD_STATUS.QUALIFIED;

    const result: QualificationResult = {
      leadStatus,
      leadPriority: priority,
      commercialScore: commercial,
      websiteStatus,
      salesOpportunity,
      leadScore,
      reasons,
    };

    await prisma.lead.update({
      where: { id: context.leadId },
      data: {
        leadStatus,
        leadPriority: priority,
        salesOpportunity,
        leadScore,
        qualificationReasons: JSON.stringify(reasons),
      },
    });

    this.log(
      "INFO",
      `Lead qualificado: oportunidade ${salesOpportunity} | score ${leadScore}`,
      context.leadId,
      reasons
    );

    return this.ok(result);
  }
}