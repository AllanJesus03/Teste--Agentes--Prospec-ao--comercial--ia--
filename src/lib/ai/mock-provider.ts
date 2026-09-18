import type { AIProvider } from "@/types/agent";

const TASK_PATTERN = /\[TASK:([A-Z_]+)\]/;

function extractPayload(input: string): Record<string, unknown> {
  const jsonMatch = input.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};
  try {
    return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function detectTask(input: string): string {
  const m = input.match(TASK_PATTERN);
  return m ? m[1] : "ANALYSIS";
}

function pickService(category?: string, bio?: string): string {
  const text = `${category ?? ""} ${bio ?? ""}`;
  if (/cabel|beleza|estetic/.test(text)) return "serviços de beleza e estética";
  if (/nutric|emagrec|diet/.test(text)) return "acompanhamento nutricional";
  if (/academ|personal|treino|fitness/.test(text)) return "treinos e acompanhamento fitness";
  if (/oficina|mecan/.test(text)) return "serviços mecânicos e reparos";
  if (/confeit|doces|bolo/.test(text)) return "doces, bolos e confeitaria";
  if (/restaur|pizza|food|gastron/.test(text)) return "comida e gastronomia";
  if (/pet|veterin/.test(text)) return "produtos e serviços para pets";
  if (/clinic/.test(text)) return "serviços de saúde e clínicos";
  if (/advog/.test(text)) return "serviços jurídicos";
  if (/imobili|corter/.test(text)) return "serviços imobiliários";
  if (/moda|roupa|calçado|calcado|boutique/.test(text)) return "moda e vestuário";
  if (/pix|estetic/.test(text)) return "procedimentos estéticos";
  const cat = category?.trim();
  if (cat) return cat.toLowerCase();
  return "produtos e serviços";
}

export function createMockAIProvider(): AIProvider {
  return {
    name: "mock",

    async generateText(input: string, system?: string): Promise<string> {
      const task = detectTask(input);
      const data = extractPayload(input);

      if (task === "ANALYSIS") {
        const category = String(data.category ?? "");
        const bio = String(data.bio ?? "");
        const websiteStatus = String(data.websiteStatus ?? "UNKNOWN");
        const city = String(data.city ?? "");
        const businessName = String(data.businessName ?? data.instagramUsername ?? "");
        const service = pickService(category, bio);

        const reason =
          websiteStatus === "NO_EXTERNAL_LINK" ||
          websiteStatus === "HAS_WHATSAPP_ONLY" ||
          websiteStatus === "HAS_LINK_HUB"
            ? "não possui um site própriuo identificado nos dados públicos disponíveis"
            : "pode se beneficiar de uma presença digital mais profissional";

        const analysis = {
          what_they_sell: `O negócio trabalha com ${service}.`,
          why_lead:
            `Negócio comercial identificado em ${city || "sua região"}. Além disso, ${reason}.`,
          problem_solved: [
            `Centralizar as informações sobre ${service} em um só lugar.`,
            "Apresentar os diferenciais do negócio de forma profissional.",
            "Direcionar visitantes para atendimento e fechamento.",
          ].join(" "),
          landing_page_suggestion:
            `Landing page profissional para ${businessName || "o negócio"} apresentar ${service}, depoimentos e facilitar o contato pelo WhatsApp.`,
          suggested_structure: [
            "Cabeçalho com proposta de valor",
            `Seção de ${service}`,
            "Depoimentos",
            "FAQ",
            "Botão de WhatsApp",
          ],
          commercial_argument:
            `Uma página própria mostra profissionalismo, organiza as ofertas de ${service} e transforma o Instagram em uma fonte ainda mais forte de clientes.`,
        };

        if (system) {
          return JSON.stringify(analysis);
        }
        return JSON.stringify(analysis, null, 2);
      }

      if (task === "OUTREACH") {
        const businessName = String(data.businessName ?? data.instagramUsername ?? "seu negócio");
        const category = String(data.category ?? "");
        const service = String(data.service ?? pickService(category, String(data.bio ?? "")));
        return [
          `Oi! Vi o perfil da ${businessName} e percebi que vocês trabalham com ${service}.`,
          ``,
          `Notei que o Instagram é um dos principais canais para apresentar o trabalho de vocês.`,
          ``,
          `Trabalho com criação de landing pages e pensei que uma página própria poderia ajudar a apresentar os serviços e direcionar clientes direto para o WhatsApp de vocês.`,
          ``,
          `Se quiser, posso te mostrar um exemplo de como poderia ficar para a ${businessName}.`,
        ].join("\n");
      }

      return `Resposta gerada para a tarefa ${task}.`;
    },

    async classify(input: string): Promise<unknown> {
      const data = extractPayload(input);
      const websiteStatus = String(data.websiteStatus ?? "UNKNOWN");
      const hasCommercial = detectCommercialFromPayload(data);
      return {
        commercial: hasCommercial,
        website_status: websiteStatus,
        priority: hasCommercial ? "HIGH" : "LOW",
      };
    },
  };
}

function detectCommercialFromPayload(data: Record<string, unknown>): boolean {
  const text = `${data.bio ?? ""} ${data.category ?? ""}`.toLowerCase();
  return /venda|serviços|servicos|preço|orcamento|whatsapp|agende|delivery|encomenda|sobre encomenda/i.test(
    text
  );
}