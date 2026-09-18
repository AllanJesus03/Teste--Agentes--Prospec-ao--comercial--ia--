import { describe, it, expect } from "vitest";
import {
  classifyUrls,
  extractUrls,
  isLinkHub,
  isSocialLink,
  isWhatsAppLink,
  normalizeUrl,
} from "@/lib/validation/links";
import { WEBSITE_STATUS } from "@/lib/constants";

describe("extractUrls", () => {
  it("extrai URLs de uma bio", () => {
    const urls = extractUrls(
      "Conheça meu site https://minhaempresa.com.br e fale no wa.me/5541999990001"
    );
    expect(urls).toContain("https://minhaempresa.com.br");
    expect(urls).toContain("https://wa.me/5541999990001");
  });

  it("normaliza link sem protocolo", () => {
    const urls = extractUrls("Site: minhaempresa.com.br");
    expect(urls).toContain("https://minhaempresa.com.br");
  });

  it("remove duplicados", () => {
    const urls = extractUrls(
      "minhaempresa.com.br e https://minhaempresa.com.br"
    );
    expect(urls.filter((u) => u.toLowerCase().includes("minhaempresa"))).toHaveLength(1);
  });

  it("retorna vazio para entrada nula/vazia", () => {
    expect(extractUrls(null)).toEqual([]);
    expect(extractUrls("")).toEqual([]);
  });
});

describe("isWhatsAppLink / isLinkHub / isSocialLink", () => {
  it("detecta WhatsApp", () => {
    expect(isWhatsAppLink("https://wa.me/5511999990000")).toBe(true);
    expect(isWhatsAppLink("https://api.whatsapp.com/send?phone=5511")).toBe(true);
    expect(isWhatsAppLink("https://minhaempresa.com.br")).toBe(false);
  });

  it("detecta link hubs", () => {
    expect(isLinkHub("https://linktr.ee/loja")).toBe(true);
    expect(isLinkHub("https://beacons.ai/perfil")).toBe(true);
    expect(isLinkHub("#")).toBe(false);
  });

  it("detecta redes sociais", () => {
    expect(isSocialLink("https://www.facebook.com/loja")).toBe(true);
    expect(isSocialLink("https://tiktok.com/@loja")).toBe(true);
    expect(isSocialLink("https://minhaempresa.com.br")).toBe(false);
  });
});

describe("classifyUrls", () => {
  it("sem links e sem WhatsApp na bio = NO_EXTERNAL_LINK", () => {
    expect(classifyUrls([], "Perfil pessoal de fotografia")).toBe(
      WEBSITE_STATUS.NO_EXTERNAL_LINK
    );
  });

  it("bio com chama no WhatsApp sem link = HAS_WHATSAPP_ONLY", () => {
    expect(
      classifyUrls([], "Pedidos pelo WhatsApp. Chama no zap!")
    ).toBe(WEBSITE_STATUS.HAS_WHATSAPP_ONLY);
  });

  it("somente link wa.me = HAS_WHATSAPP_ONLY", () => {
    expect(classifyUrls(["https://wa.me/5511999990000"], "")).toBe(
      WEBSITE_STATUS.HAS_WHATSAPP_ONLY
    );
  });

  it("somente link hub = HAS_LINK_HUB", () => {
    expect(classifyUrls(["https://linktr.ee/loja"], "")).toBe(
      WEBSITE_STATUS.HAS_LINK_HUB
    );
  });

  it("somente rede social = HAS_SOCIAL_ONLY", () => {
    expect(classifyUrls(["https://www.facebook.com/loja"], "")).toBe(
      WEBSITE_STATUS.HAS_SOCIAL_ONLY
    );
  });

  it("link de site real = HAS_WEBSITE", () => {
    expect(classifyUrls(["https://minhaempresa.com.br"], "")).toBe(
      WEBSITE_STATUS.HAS_WEBSITE
    );
  });

  it("link de loja/ecommerce = HAS_ECOMMERCE", () => {
    expect(classifyUrls(["https://minhaloja.com.br/loja"], "")).toBe(
      WEBSITE_STATUS.HAS_ECOMMERCE
    );
    expect(classifyUrls(["https://shop.minhaloja.com"], "")).toBe(
      WEBSITE_STATUS.HAS_ECOMMERCE
    );
  });

  it("link de landing = HAS_LANDING_PAGE", () => {
    expect(classifyUrls(["https://minhaempresa.com.br/lp-produto"], "")).toBe(
      WEBSITE_STATUS.HAS_LANDING_PAGE
    );
  });
});

describe("normalizeUrl", () => {
  it("adiciona https:// quando necessário", () => {
    expect(normalizeUrl("exemplo.com.br")).toBe("https://exemplo.com.br");
  });
  it("preserva protocolo", () => {
    expect(normalizeUrl("https://exemplo.com.br")).toBe("https://exemplo.com.br");
  });
  it("retorna null para vazio", () => {
    expect(normalizeUrl("   ")).toBeNull();
  });
});