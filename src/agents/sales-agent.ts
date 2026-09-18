import { BaseAgent } from "@/agents/base-agent";
import type { AgentContext, AgentResult } from "@/types/agent";
import { prisma } from "@/lib/database/prisma";
import { getAIProvider } from "@/lib/ai/provider";
import type { AiAnalysis } from "@/types/lead";

export class SalesAgent extends BaseAgent {
  name = "Sales Agent";

  protected async run(context: AgentContext): Promise<AgentResult> {
    if (!context.leadId) {
      return { success: false, errors: ["leadId é obrigatório"] };
    }

    const lead = await prisma.lead.findUnique({ where: { id: context.leadId } });
    if (!lead) {
      return { success: false, errors: ["Lead não encontrado"] };
    }

    const provider = getAIProvider();
    const prompt = `[TASK:ANALYSIS]
Analise o negócio abaixo e responda com JSON contendo: what_they_sell, why_lead, problem_solved, landing_page_suggestion, suggested_structure (array), commercial_argument.

${JSON.stringify(
  {
    businessName: lead.businessName,
    instagramUsername: lead.instagramUsername,
    category: lead.category,
    city: lead.city,
    state: lead.state,
    bio: lead.bio,
    websiteStatus: lead.websiteStatus,
    websiteUrl: lead.websiteUrl,
    commercialSignals: tryParse(lead.commercialSignals),
    followers: lead.followers,
  },
  null,
  2
)}`;

    let analysis: AiAnalysis;
    const raw = await provider.generateText(prompt);
    try {
      analysis = JSON.parse(raw) as AiAnalysis;
    } catch {
      analysis = {
        what_they_sell: "Negócio com atividade comercial identificada.",
        why_lead: "Potencial para presença digital mais estruturada.",
        problem_solved:
          "Centralizar informações e direcionar clientes para o canal de contato.",
        landing_page_suggestion:
          "Landing page profissional para apresentar o negócio.",
        suggested_structure: ["Oferta", "Depoimentos", "WhatsApp"],
        commercial_argument:
          "Presença digital profissional gera mais conversões.",
      };
    }

    await prisma.lead.update({
      where: { id: context.leadId },
      data: {
        aiAnalysis: JSON.stringify(analysis),
        lastCheckedAt: new Date(),
      },
    });

    this.log("INFO", "Análise de IA concluída", context.leadId);
    return this.ok(analysis);
  }
}

function tryParse(raw: string | null): unknown {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}