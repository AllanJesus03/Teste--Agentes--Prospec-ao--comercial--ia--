export const config = {
  mockMode:
    (process.env.NEXT_PUBLIC_MOCK_MODE ?? process.env.MOCK_MODE) !== "false",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  authSecret: process.env.AUTH_SECRET ?? "",
  ai: {
    provider: process.env.AI_PROVIDER ?? "mock",
    apiKey: process.env.AI_API_KEY ?? "",
    baseUrl: process.env.AI_BASE_URL ?? "",
    model: process.env.AI_MODEL ?? "gpt-4o-mini",
  },
  instagram: {
    apiKey: process.env.INSTAGRAM_API_KEY ?? "",
  },
  whatsapp: {
    apiKey: process.env.WHATSAPP_API_KEY ?? "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  },
  databaseUrl: process.env.DATABASE_URL ?? "",
};

export function isMockMode(): boolean {
  return config.mockMode;
}

export function getAiProvider(): string {
  return config.ai.provider;
}