import { BaseAgent } from "@/agents/base-agent";
import type { AgentContext, AgentResult, DiscoveryCandidate } from "@/types/agent";
import { getDiscoverySource } from "@/lib/instagram/discovery-source";
import { getCategories } from "@/lib/database/settings";
import { DEFAULT_CATEGORIES } from "@/lib/constants";

interface DiscoveryInput {
  category?: string;
  city?: string;
  categories?: string[];
  limit?: number;
}

export class DiscoveryAgent extends BaseAgent {
  name = "Discovery Agent";

  protected async run(context: AgentContext): Promise<AgentResult> {
    const input = (context.input ?? {}) as DiscoveryInput;
    const categories =
      input.categories ??
      (await getCategories()).concat(DEFAULT_CATEGORIES as unknown as string[]);

    const source = getDiscoverySource();
    const candidates = await source.discover({
      category: input.category,
      city: input.city,
      categories: categories.length ? categories : undefined,
      limit: input.limit ?? 10,
    });

    if (candidates.length === 0) {
      return this.ok([], ["Nenhum perfil encontrado para os critérios fornecidos."]);
    }

    this.log(
      "INFO",
      `Perfis encontrados: ${candidates.length}`,
      undefined,
      candidates.map((c) => c.instagramUsername)
    );

    return this.ok(candidates as DiscoveryCandidate[]);
  }
}