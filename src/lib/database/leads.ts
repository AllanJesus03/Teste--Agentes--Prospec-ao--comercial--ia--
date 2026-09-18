import { prisma } from "@/lib/database/prisma";
import type { Prisma, Lead } from "@prisma/client";
import type { LeadFilters } from "@/types/lead";
import { findDuplicate, type LeadIdentity } from "@/lib/validation/duplicate";
import { LEAD_STATUS, LEAD_PRIORITY, WEBSITE_STATUS } from "@/lib/constants";

export type LeadCreateInput = Omit<
  Prisma.LeadUncheckedCreateInput,
  "externalLinks"
> &
  Partial<LeadIdentity> & { externalLinks?: string | string[] | null };

export async function upsertLead(
  input: LeadCreateInput
): Promise<{ lead: Lead; created: boolean; updated: boolean }> {
  const username = input.instagramUsername?.replace(/^@/, "").trim() ?? "";
  if (!username) {
    throw new Error("instagramUsername é obrigatório");
  }

  const existing = await findDuplicate({
    instagramUsername: username,
    instagramUrl: input.instagramUrl,
    phone: input.whatsapp ?? input.contactPhone,
    email: input.contactEmail,
    websiteUrl: input.websiteUrl,
    businessName: input.businessName,
    city: input.city,
  });

  if (existing) {
    const updateData = buildUpdateData(input, existing, username);
    const lead = await prisma.lead.update({
      where: { id: existing.id },
      data: updateData,
    });
    return { lead, created: false, updated: true };
  }

  const lead = await prisma.lead.create({
    data: buildCreateData(input, username),
  });
  return { lead, created: true, updated: false };
}

function stringifyLinks(links?: string | string[] | null): string | null {
  if (!links) return null;
  if (Array.isArray(links)) {
    return links.length ? JSON.stringify(links) : null;
  }
  return links;
}

function buildCreateData(
  input: LeadCreateInput,
  username: string
): Prisma.LeadCreateInput {
  return {
    instagramUsername: username,
    instagramUrl: input.instagramUrl,
    businessName: input.businessName,
    category: input.category,
    bio: input.bio,
    city: input.city,
    state: input.state,
    country: input.country,
    followers: input.followers,
    posts: input.posts,
    profilePicUrl: input.profilePicUrl,
    websiteUrl: input.websiteUrl,
    externalLinks: stringifyLinks(input.externalLinks) ?? undefined,
    whatsapp: input.whatsapp,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    websiteStatus: input.websiteStatus ?? WEBSITE_STATUS.UNKNOWN,
    landingPageStatus: input.landingPageStatus ?? WEBSITE_STATUS.UNKNOWN,
    commercialScore: input.commercialScore ?? 0,
    leadScore: input.leadScore ?? 0,
    leadPriority: input.leadPriority ?? LEAD_PRIORITY.LOW,
    leadStatus: input.leadStatus ?? LEAD_STATUS.NEW,
    dataSource: input.dataSource,
    sourceUrl: input.sourceUrl,
    collectedAt: input.collectedAt ?? new Date(),
    lastCheckedAt: new Date(),
  };
}

function buildUpdateData(
  input: LeadCreateInput,
  existing: Lead,
  username: string
): Prisma.LeadUpdateInput {
  return {
    instagramUsername: username,
    instagramUrl: input.instagramUrl ?? existing.instagramUrl,
    businessName: input.businessName ?? existing.businessName,
    category: input.category ?? existing.category,
    bio: input.bio ?? existing.bio,
    city: input.city ?? existing.city,
    state: input.state ?? existing.state,
    country: input.country ?? existing.country,
    followers: input.followers ?? existing.followers,
    posts: input.posts ?? existing.posts,
    profilePicUrl: input.profilePicUrl ?? existing.profilePicUrl,
    websiteUrl: input.websiteUrl ?? existing.websiteUrl,
    externalLinks:
      stringifyLinks(input.externalLinks) ?? existing.externalLinks,
    whatsapp: input.whatsapp ?? existing.whatsapp,
    contactEmail: input.contactEmail ?? existing.contactEmail,
    contactPhone: input.contactPhone ?? existing.contactPhone,
    websiteStatus: input.websiteStatus ?? existing.websiteStatus,
    landingPageStatus: input.landingPageStatus ?? existing.landingPageStatus,
    commercialScore: input.commercialScore ?? existing.commercialScore,
    leadScore: input.leadScore ?? existing.leadScore,
    leadPriority: input.leadPriority ?? existing.leadPriority,
    leadStatus: input.leadStatus ?? existing.leadStatus,
    dataSource: input.dataSource ?? existing.dataSource,
    sourceUrl: input.sourceUrl ?? existing.sourceUrl,
    lastCheckedAt: new Date(),
  };
}

function buildWhere(filters: LeadFilters): Prisma.LeadWhereInput {
  const and: Prisma.LeadWhereInput[] = [];

  if (filters.query) {
    const terms = filters.query.trim().split(/\s+/).filter(Boolean);
    if (terms.length) {
      and.push({
        OR: terms.map((t) => ({
          OR: [
            { businessName: { contains: t } },
            { instagramUsername: { contains: t } },
            { category: { contains: t } },
            { city: { contains: t } },
            { state: { contains: t } },
            { contactEmail: { contains: t } },
            { whatsapp: { contains: t } },
            { contactPhone: { contains: t } },
            { websiteUrl: { contains: t } },
          ],
        })),
      });
    }
  }

  if (filters.category) {
    and.push({ category: { contains: filters.category } });
  }
  if (filters.city) {
    and.push({ city: { contains: filters.city } });
  }
  if (filters.state) {
    and.push({ state: { contains: filters.state } });
  }
  if (filters.priority) {
    and.push({ leadPriority: filters.priority });
  }
  if (filters.leadStatus && filters.leadStatus !== "ALL") {
    and.push({ leadStatus: filters.leadStatus });
  }

  if (filters.minFollowers !== undefined || filters.maxFollowers !== undefined) {
    and.push({
      followers: {
        ...(filters.minFollowers !== undefined
          ? { gte: filters.minFollowers }
          : {}),
        ...(filters.maxFollowers !== undefined
          ? { lte: filters.maxFollowers }
          : {}),
      },
    });
  }

  if (filters.minScore !== undefined || filters.maxScore !== undefined) {
    and.push({
      leadScore: {
        ...(filters.minScore !== undefined ? { gte: filters.minScore } : {}),
        ...(filters.maxScore !== undefined ? { lte: filters.maxScore } : {}),
      },
    });
  }

  if (filters.websiteStatus) {
    and.push({ websiteStatus: filters.websiteStatus });
  }

  if (filters.landingPageStatus) {
    if (filters.landingPageStatus === WEBSITE_STATUS.HAS_LANDING_PAGE) {
      and.push({ landingPageStatus: WEBSITE_STATUS.HAS_LANDING_PAGE });
    } else {
      and.push({ landingPageStatus: { not: WEBSITE_STATUS.HAS_LANDING_PAGE } });
    }
  }

  if (filters.opportunities) {
    and.push({
      optedOut: false,
      leadStatus: {
        notIn: [
          LEAD_STATUS.OPTED_OUT,
          LEAD_STATUS.NOT_INTERESTED,
          LEAD_STATUS.CUSTOMER,
        ],
      },
      websiteStatus: {
        in: [
          WEBSITE_STATUS.NO_EXTERNAL_LINK,
          WEBSITE_STATUS.HAS_WHATSAPP_ONLY,
          WEBSITE_STATUS.HAS_LINK_HUB,
          WEBSITE_STATUS.HAS_SOCIAL_ONLY,
        ],
      },
    });
  }

  return and.length ? { AND: and } : {};
}

export interface LeadQueryResult {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function queryLeads(
  filters: LeadFilters
): Promise<LeadQueryResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(500, Math.max(1, filters.pageSize ?? 25));
  const where = buildWhere(filters);

  const allowedSorts: Record<string, Prisma.LeadOrderByWithRelationInput> = {
    createdAt: { createdAt: "desc" },
    updatedAt: { updatedAt: "desc" },
    businessName: { businessName: "asc" },
    followers: { followers: "desc" },
    leadScore: { leadScore: "desc" },
    commercialScore: { commercialScore: "desc" },
  };
  const sort =
    allowedSorts[filters.sortBy ?? "updatedAt"] ?? allowedSorts.updatedAt;

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: sort,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    leads,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getLeadWithRelations(
  id: string
): Promise<(Lead & { contacts: import("@prisma/client").Contact[] }) | null> {
  return prisma.lead.findUnique({
    where: { id },
    include: { contacts: { orderBy: { createdAt: "desc" } } },
  });
}

export async function deleteLeadCompletely(id: string) {
  await prisma.$transaction([
    prisma.campaignLead.deleteMany({ where: { leadId: id } }),
    prisma.job.deleteMany({ where: { leadId: id } }),
    prisma.contact.deleteMany({ where: { leadId: id } }),
    prisma.lead.delete({ where: { id } }),
  ]);
}

export async function setOptOut(id: string, reason?: string) {
  return prisma.lead.update({
    where: { id },
    data: {
      optedOut: true,
      optOutReason: reason?.trim() || null,
      leadStatus: LEAD_STATUS.OPTED_OUT,
    },
  });
}

export function parseExternalLinks(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}