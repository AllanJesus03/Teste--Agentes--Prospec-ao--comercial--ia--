import type { AIProvider } from "@/types/agent";
import { getAiProvider } from "@/lib/config";
import { createMockAIProvider } from "@/lib/ai/mock-provider";
import { createOpenAICompatProvider } from "@/lib/ai/openai-provider";

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const type = getAiProvider();
  cached =
    type === "openai" ? createOpenAICompatProvider() : createMockAIProvider();
  return cached;
}

export function resetAIProvider() {
  cached = null;
}

export { createMockAIProvider } from "@/lib/ai/mock-provider";
export { createOpenAICompatProvider } from "@/lib/ai/openai-provider";