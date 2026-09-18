import { describe, it, expect } from "vitest";
import { WebsiteAnalyzer } from "@/lib/website/analyzer";
import { WEBSITE_STATUS } from "@/lib/constants";

const analyzer = new WebsiteAnalyzer();

describe("WebsiteAnalyzer.classify", () => {
  it("bio sem link => NO_EXTERNAL_LINK", async () => {
    const r = await analyzer.classify({ bio: "Perfil pessoal", externalLinks: [], websiteUrl: null });
    expect(r.status).toBe(WEBSITE_STATUS.NO_EXTERNAL_LINK);
    expect(r.urls).toEqual([]);
  });

  it("mescla websiteUrl + externalLinks + bio", async () => {
    const r = await analyzer.classify({
      bio: "Site: minhasite.com.br",
      externalLinks: ["https://wa.me/5511999990000"],
      websiteUrl: "https://minhasite.com.br",
    });
    expect(r.urls).toEqual(
      expect.arrayContaining([
        "https://minhasite.com.br",
        "https://wa.me/5511999990000",
      ])
    );
    expect(r.status).toBe(WEBSITE_STATUS.HAS_WEBSITE);
  });

  it("somente WhatsApp => HAS_WHATSAPP_ONLY", async () => {
    const r = await analyzer.classify({
      bio: "",
      externalLinks: ["https://wa.me/5511999990000"],
      websiteUrl: null,
    });
    expect(r.status).toBe(WEBSITE_STATUS.HAS_WHATSAPP_ONLY);
  });

  it("somente link hub => HAS_LINK_HUB", async () => {
    const r = await analyzer.classify({
      bio: "",
      externalLinks: ["https://linktr.ee/loja"],
      websiteUrl: null,
    });
    expect(r.status).toBe(WEBSITE_STATUS.HAS_LINK_HUB);
  });
});