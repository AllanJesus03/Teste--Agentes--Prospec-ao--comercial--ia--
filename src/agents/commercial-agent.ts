import { BaseAgent } from "@/agents/base-agent";
import type { AgentContext, AgentResult } from "@/types/agent";
import {
  detectCommercialSignals,
  isLikelyNonCommercial,
} from "@/lib/validation/commercial";
import { prisma } from "@/lib/database/prisma";

interface CommercialInput {
  bio?: string;
  category?: string;
}

export class CommercialAgent extends BaseAgent {
  name = "Commercial Agent";

  protected async run(context: AgentContext): Promise<AgentResult> {
    const lead = context.leadId
      ? await prisma.lead.findUnique({ where: { id: context.leadId } })
      : null;

    const input = (context.input ?? {}) as CommercialInput;
    const bio = input.bio ?? lead?.bio ?? "";
    const category = input.category ?? lead?.category ?? "";

    const { signals, score } = detectCommercialSignals(bio);

    if (isLikelyNonCommercial(bio)) {
      const message = "Perfil sem indícios comerciais claros.";
      this.log("INFO", message, context.leadId);
      return this.ok(
        {
          commercialScore: Math.min(score, 10),
          signals,
          isCommercial: false,
        },
        [message]
      );
    }

    const isCommercial = score >= 25 || category.length > 0;
    const result = {
      commercialScore: isCommercial ? Math.max(score, 30) : score,
      signals,
      isCommercial,
    };

    if (context.leadId) {
      await prisma.lead.update({
        where: { id: context.leadId },
        data: {
          commercialScore: result.commercialScore,
          commercialSignals: JSON.stringify(
            signals.filter((s) => s.found)
          ),
        },
      });
    }

    this.log(
      result.isCommercial ? "INFO" : "WARN",
      result.isCommercial
        ? `Perfil classificado como comercial (score ${result.commercialScore})`
        : `Perfil com poucos indícios comerciais (score ${result.commercialScore})`,
      context.leadId
    );

    return this.ok(result);
  }
}