import { BaseAgent } from "@/agents/base-agent";
import type { AgentContext, AgentResult, OutreachMessage } from "@/types/agent";
import { prisma } from "@/lib/database/prisma";
import { getAIProvider } from "@/lib/ai/provider";

interface OutreachInput {
  leadId?: string;
  businessName?: string;
  category?: string;
  city?: string;
  bio?: string;
  websiteStatus?: string;
  websiteUrl?: string;
  commercialSignals?: string[];
}

export class OutreachAgent extends BaseAgent {
  name = "Outreach Agent";

  protected async run(context: AgentContext): Promise<AgentResult> {
    const lead = context.leadId
      ? await prisma.lead.findUnique({ where: { id: context.leadId } })
      : null;
    const input = (context.input ?? {}) as OutreachInput;

    const leadId = context.leadId ?? input.leadId;
    if (!leadId) {
      return { success: false, errors: ["leadId é obrigatório"] };
    }

    if (lead?.optedOut) {
      this.log("WARN", "Lead marcado como opt-out. Mensagem não gerada.", leadId);
      return {
        success: false,
        errors: ["Lead em opt-out: novos contatos bloqueados."],
      };
    }

    const businessName = input.businessName ?? lead?.businessName ?? "o negócio";
    const category = input.category ?? lead?.category ?? "";
    const city = input.city ?? lead?.city ?? "";
    const bio = input.bio ?? lead?.bio ?? "";
    const websiteStatus = input.websiteStatus ?? lead?.websiteStatus ?? "UNKNOWN";
    const signals = input.commercialSignals ?? tryParse(lead?.commercialSignals);

    const provider = getAIProvider();
    const prompt = `[TASK:OUTREACH]
Gere uma mensagem de primeiro contato personalizada e profissional (em português) para apresentar serviços de criação de landing pages. Não afirme que o negócio não possui site caso a informação não tenha sido verificada. Use mais de um parágrafo se fizer sentido.

${JSON.stringify(
  {
    business_name: businessName,
    category,
    city,
    bio,
    website_status: websiteStatus,
    website_url: lead?.websiteUrl ?? input.websiteUrl ?? null,
    commercial_signals: signals,
  },
  null,
  2
)}`;

    const body = await provider.generateText(prompt);

    const message: OutreachMessage = {
      body,
      variables: { businessName, category, city, instagramUsername: lead?.instagramUsername ?? "" },
    };

    this.log("INFO", `Mensagem gerada para ${businessName}`, leadId);
    return this.ok(message);
  }
}

function tryParse(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}