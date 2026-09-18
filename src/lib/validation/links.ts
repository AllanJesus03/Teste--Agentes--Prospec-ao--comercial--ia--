import { WEBSITE_STATUS, type WebsiteStatus } from "@/lib/constants";

const URL_PATTERN = /(?:https?:\/\/)?(?:www\.)?([^\s/]+(?:\.[^\s/]+)+)(?:\/[^\s]*)?/gi;

const INSTAGRAM_HOSTS = [
  "instagram.com",
  "www.instagram.com",
  "ig.me",
  "instagr.am",
];

const SOCIAL_HOSTS = [
  "facebook.com",
  "fb.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "youtube.com",
  "pinterest.com",
  "behance.net",
  "dribbble.com",
  "medium.com",
];

const LINK_HUB_HOSTS = [
  "linktr.ee",
  "beacons.ai",
  "linkbio.co",
  "bio.link",
  "contactin.bio",
  "link.contactin.bio",
  "manylink.co",
];

const WHATSAPP_LINK_PATTERN =
  /(?:wa\.me|whatsapp\.com|api\.whatsapp\.com|wa.link)/i;

const ECOMMERCE_HINTS = [
  "loja",
  "shop",
  "store",
  "comprar",
  "vendas",
  "ecommerce",
  "catalogo",
  "/produtos",
  "/shop",
  "/store",
  "mercadolivre",
  "shopee",
  "kangu",
  "embelleze",
];

const LANDING_HINTS = [
  "landing",
  "pagina",
  "lp-",
  "/lp",
  "ofertas",
  "promocao",
  "promo",
  "black",
];

export function extractUrls(input: string | null | undefined): string[] {
  if (!input) return [];
  const matches: string[] = [];
  const raw = input.replace(/[()]/g, " ");
  let m: RegExpExecArray | null;
  const re = new RegExp(URL_PATTERN.source, "gi");
  while ((m = re.exec(raw)) !== null) {
    const full = m[0].trim();
    const host = m[1]?.toLowerCase() ?? "";
    if (full.length > 255) continue;
    if (WHATSAPP_LINK_PATTERN.test(host)) {
      matches.push(/^https?:\/\//i.test(full) ? full : "https://" + full);
      continue;
    }
    if (!host.includes(".")) continue;
    const url = /^https?:\/\//i.test(full) ? full : "https://" + full;
    matches.push(url);
  }
  return dedupe(matches);
}

export function dedupe<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function isInstagram(host: string): boolean {
  return INSTAGRAM_HOSTS.includes(host.toLowerCase().replace(/^www\./, ""));
}

export function isSocialLink(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return (
      SOCIAL_HOSTS.includes(host) ||
      host.endsWith(".facebook.com") ||
      host.endsWith(".tiktok.com") ||
      host.endsWith(".youtube.com")
    );
  } catch {
    return false;
  }
}

export function isWhatsAppLink(url: string): boolean {
  return WHATSAPP_LINK_PATTERN.test(url);
}

export function isLinkHub(url: string): boolean {
  try {
    const host = new URL(url).hostname
      .replace(/^www\./, "")
      .replace(/^link\./, "")
      .toLowerCase();
    return LINK_HUB_HOSTS.includes(host);
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!/^https?:\/\//i.test(trimmed)) {
    return "https://" + trimmed;
  }
  return trimmed;
}

export function classifyUrls(urls: string[], bio: string): WebsiteStatus {
  const external = urls
    .map(normalizeUrl)
    .filter((u): u is string => u !== null);

  if (external.length === 0) {
    const hasWhatsAppCall = /whatsapp|wa\.me|vem? no zap|chama no zap|pedidos por whats/i.test(
      bio
    );
    return hasWhatsAppCall
      ? WEBSITE_STATUS.HAS_WHATSAPP_ONLY
      : WEBSITE_STATUS.NO_EXTERNAL_LINK;
  }

  const whatsappLinks = external.filter((u) => isWhatsAppLink(u));
  const socialLinks = external.filter(
    (u) => isSocialLink(u) || isInstagram(u)
  );
  const hubLinks = external.filter((u) => isLinkHub(u));
  const realLinks = external.filter(
    (u) =>
      !isWhatsAppLink(u) && !isSocialLink(u) && !isInstagram(u) && !isLinkHub(u)
  );

  if (realLinks.length > 0) {
    const first = realLinks[0].toLowerCase();
    if (
      ECOMMERCE_HINTS.some((hint) => first.includes(hint)) ||
      /\.store\.|\.shop\.|\/loja|ecommerce|shop(\.|\/)/i.test(first)
    ) {
      return WEBSITE_STATUS.HAS_ECOMMERCE;
    }
    if (LANDING_HINTS.some((hint) => first.includes(hint))) {
      return WEBSITE_STATUS.HAS_LANDING_PAGE;
    }
    return WEBSITE_STATUS.HAS_WEBSITE;
  }

  if (hubLinks.length > 0) {
    return WEBSITE_STATUS.HAS_LINK_HUB;
  }

  if (whatsappLinks.length > 0) {
    return WEBSITE_STATUS.HAS_WHATSAPP_ONLY;
  }

  if (socialLinks.length > 0) {
    return WEBSITE_STATUS.HAS_SOCIAL_ONLY;
  }

  return WEBSITE_STATUS.NO_EXTERNAL_LINK;
}

export function hasOwnDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return !/[^a-z0-9.-]/i.test(host) && host.split(".").length >= 2;
  } catch {
    return false;
  }
}

export function isProbablyLandingPage(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    LANDING_HINTS.some((h) => lower.includes(h)) ||
    /^(https?:\/\/[^/]+)\/?$/.test(lower) === false
  );
}