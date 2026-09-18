import type { AIProvider } from "@/types/agent";
import { config } from "@/lib/config";

export function createOpenAICompatProvider(): AIProvider {
  const apiKey = config.ai.apiKey;
  const baseUrl = (config.ai.baseUrl || "https://api.openai.com/v1").replace(
    /\/$/,
    ""
  );
  const model = config.ai.model;

  async function chat(
    messages: Array<{ role: string; content: string }>
  ): Promise<string> {
    if (!apiKey) {
      throw new Error(
        "AI_API_KEY não configurada. Defina AI_PROVIDER=openai e AI_API_KEY no .env."
      );
    }

    const url = `${baseUrl}/chat/completions`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          messages,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`IA API HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = json.choices?.[0]?.message?.content;
      if (!content) throw new Error("Resposta vazia do provedor de IA");
      return content;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    name: "openai-compat",

    async generateText(input: string, system?: string): Promise<string> {
      const messages = [
        {
          role: "system",
          content:
            system ??
            "Você é um analista comercial. Responda com JSON válido em português.",
        },
        { role: "user", content: input },
      ];
      return chat(messages);
    },

    async classify(input: string): Promise<unknown> {
      const raw = await chat([
        {
          role: "system",
          content:
            "Você classifica perfis comerciais. Responda apenas com JSON válido: {commercial: boolean, website_status: string, priority: string}.",
        },
        { role: "user", content: input },
      ]);
      try {
        return JSON.parse(raw);
      } catch {
        return { raw };
      }
    },
  };
}