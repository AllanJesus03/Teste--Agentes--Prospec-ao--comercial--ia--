import { WEBSITE_STATUS } from "@/lib/constants";
import {
  classifyUrls,
  extractUrls,
  hasOwnDomain,
  isProbablyLandingPage,
  normalizeUrl,
} from "@/lib/validation/links";
import type { WebsiteAnalysisResult, WebsiteClassification } from "@/types/lead";
import { isMockMode } from "@/lib/config";

const TIMEOUT_MS = 8000;
const SEGMENT_HINTS = ["estou", "clientes", "página inicial", "em breve", "123"];

export class WebsiteAnalyzer {
  async classify(input: {
    bio?: string | null;
    externalLinks?: string[] | null;
    websiteUrl?: string | null;
  }): Promise<WebsiteClassification> {
    const bioLinks = extractUrls(input.bio);
    const declaredLinks = (input.externalLinks ?? []).filter(Boolean);
    const websiteUrl = input.websiteUrl ? [input.websiteUrl] : [];
    const urls = Array.from(new Set([...websiteUrl, ...declaredLinks, ...bioLinks]));

    if (urls.length === 0) {
      return {
        status: WEBSITE_STATUS.NO_EXTERNAL_LINK,
        urls: [],
        notes: "Nenhum link externo identificado nos dados públicos disponíveis.",
      };
    }

    const status = classifyUrls(urls, input.bio ?? "");
    return { status, urls };
  }

  async analyzeUrl(url: string): Promise<WebsiteAnalysisResult> {
    const normalized = normalizeUrl(url);
    const base: WebsiteAnalysisResult = {
      url: normalized ?? url,
      reachable: false,
      has_https: (normalized ?? "").startsWith("https://"),
      has_contact: false,
      has_whatsapp: false,
      has_form: false,
      mobile_friendly: false,
      is_landing_page: false,
      is_ecommerce: false,
      quality_score: 0,
    };

    if (!normalized) return { ...base, error: "URL inválida" };

    if (isMockMode()) {
      return this.mockAnalyze(normalized);
    }

    try {
      const html = await fetchHtml(normalized);
      return this.analyzeHtml(normalized, html);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha na análise";
      return {
        ...base,
        reachable: false,
        quality_score: 0,
        error: `WEBSITE_NOT_REACHABLE: ${message}`,
      };
    }
  }

  private mockAnalyze(url: string): WebsiteAnalysisResult {
    const lower = url.toLowerCase();
    const isEcommerce =
      /(loja|shop|store|ecommerce|comprar|catalogo|mercadolivre|shopee)/i.test(
        lower
      );
    const isLanding = isProbablyLandingPage(url) && /(landing|lp|promo|oferta|pagina)/i.test(lower);
    const hasWhatsApp = /(wa\.me|whatsapp|zap)/i.test(lower);
    const hasOwn = hasOwnDomain(url);
    const reachable = hasOwn;

    const score = reachable
      ? Math.max(
          0,
          Math.min(
            100,
            (hasOwn ? 60 : 0) +
              (hasWhatsApp ? 15 : 0) +
              (hasOwn ? 12 : 0) +
              (isLanding ? 8 : 0) -
              (SEGMENT_HINTS.some((s) => lower.includes(s)) ? 20 : 0)
          )
        )
      : 0;

    return {
      url,
      reachable,
      has_https: url.startsWith("https://"),
      has_contact: true,
      has_whatsapp: hasWhatsApp,
      has_form: isLanding,
      mobile_friendly: true,
      is_landing_page: isLanding,
      is_ecommerce: isEcommerce,
      quality_score: score,
      title: reachable ? url.split("/")[2] ?? url : undefined,
    };
  }

  private analyzeHtml(url: string, html: string): WebsiteAnalysisResult {
    const hasOwn = hasOwnDomain(url) || url.startsWith("http");
    const lower = url.toLowerCase();
    const text = stripHtml(html).toLowerCase();
    const hasWhatsApp = /wa\.me|whatsapp|api\.whatsapp/.test(html.toLowerCase());
    const hasForm = /<form[\s>]/i.test(html);
    const hasContact = /(contato|whatsapp|telefone|e-mail|email|fale conosco|atendimento)/i.test(
      text
    );
    const mobileFriendly =
      /<meta[^>]+name=["']viewport["']/i.test(html) || !/\/useragent/.test(html);
    const isEcommerce = /(carrinho|checkout|adicionar ao carrinho|add to cart|produtos?)/i.test(
      text
    );
    const isLanding = /landing|lp-|oferta|promo/.test(lower) || (!hasForm && !isEcommerce);

    const title =
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? undefined;

    const qualityScore = Math.max(
      0,
      Math.min(
        100,
        45 +
          (hasOwn ? 15 : 0) +
          (mobileFriendly ? 10 : 0) +
          (hasContact ? 10 : 0) +
          (isLanding || isEcommerce ? 10 : 0)
      )
    );

    return {
      url,
      reachable: true,
      has_https: url.startsWith("https://"),
      has_contact: hasContact,
      has_whatsapp: hasWhatsApp,
      has_form: hasForm,
      mobile_friendly: mobileFriendly,
      is_landing_page: isLanding,
      is_ecommerce: isEcommerce,
      quality_score: qualityScore,
      title,
    };
  }
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      throw new Error(`Conteúdo não-HTML (${contentType.split(";")[0]})`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}