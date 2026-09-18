import { prisma } from "@/lib/database/prisma";
import type { Lead } from "@prisma/client";

export interface LeadIdentity {
  instagramUsername?: string;
  instagramUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  businessName?: string | null;
  city?: string | null;
}

function normalize(value?: string | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizePhone(value?: string | null): string {
  return (value ?? "").replace(/\D/g, "");
}

function normalizeEmail(value?: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

export async function findDuplicate(
  identity: LeadIdentity
): Promise<Lead | null> {
  const checks: Array<Record<string, string>> = [];

  if (identity.instagramUsername) {
    const username = identity.instagramUsername
      .replace(/^@/, "")
      .replace(/\s+/g, "")
      .toLowerCase();
    checks.push({ instagramUsername: username });
  }

  if (identity.phone) {
    const phone = normalizePhone(identity.phone);
    if (phone.length >= 8) {
      checks.push({ whatsapp: phone });
      checks.push({ contactPhone: phone });
    }
  }

  if (identity.email) {
    const email = normalizeEmail(identity.email);
    if (email.includes("@")) checks.push({ contactEmail: email });
  }

  if (identity.websiteUrl) {
    const domain = extractDomain(identity.websiteUrl);
    if (domain) checks.push({ websiteUrl: domain });
  }

  if (checks.length === 0) {
    return null;
  }

  const existing = await prisma.lead.findFirst({
    where: { OR: checks },
  });
  if (existing) return existing;

  if (identity.businessName && identity.city) {
    const name = normalize(identity.businessName);
    const city = normalize(identity.city);
    if (name && city) {
      const leads = await prisma.lead.findMany({
        where: { city: { contains: city } },
      });
      return (
        leads.find((l) => l.businessName && normalize(l.businessName) === name) ??
        null
      );
    }
  }

  return null;
}

function extractDomain(url: string): string | null {
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}