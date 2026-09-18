import { prisma } from "@/lib/database/prisma";
import {
  LEAD_STATUS,
  MESSAGE_STATUS,
  WEBSITE_STATUS,
  LANDING_PAGE_STATUS,
} from "@/lib/constants";

export interface DashboardMetrics {
  totalLeads: number;
  noWebsite: number;
  hasWebsite: number;
  noLandingPage: number;
  qualified: number;
  contactsPending: number;
  contactsSent: number;
  replies: number;
  opportunities: number;
  optedOut: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [
    totalLeads,
    noWebsite,
    hasWebsite,
    noLandingPage,
    qualified,
    optedOut,
    opportunities,
    contactsPending,
    contactsSent,
    replies,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({
      where: {
        websiteStatus: {
          in: [
            WEBSITE_STATUS.NO_EXTERNAL_LINK,
            WEBSITE_STATUS.HAS_WHATSAPP_ONLY,
            WEBSITE_STATUS.HAS_LINK_HUB,
            WEBSITE_STATUS.HAS_SOCIAL_ONLY,
          ],
        },
      },
    }),
    prisma.lead.count({
      where: {
        websiteStatus: {
          in: [
            WEBSITE_STATUS.HAS_WEBSITE,
            WEBSITE_STATUS.HAS_LANDING_PAGE,
            WEBSITE_STATUS.HAS_ECOMMERCE,
          ],
        },
      },
    }),
    prisma.lead.count({
      where: {
        landingPageStatus: {
          not: LANDING_PAGE_STATUS.HAS_LANDING_PAGE,
        },
      },
    }),
    prisma.lead.count({ where: { leadStatus: LEAD_STATUS.QUALIFIED } }),
    prisma.lead.count({ where: { optedOut: true } }),
    prisma.lead.count({
      where: {
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
      },
    }),
    prisma.contact.count({
      where: { status: { in: [MESSAGE_STATUS.DRAFT, MESSAGE_STATUS.PENDING_REVIEW] } },
    }),
    prisma.contact.count({
      where: { status: { in: [MESSAGE_STATUS.SENT, MESSAGE_STATUS.DELIVERED] } },
    }),
    prisma.contact.count({
      where: { status: { in: [MESSAGE_STATUS.REPLIED] } },
    }),
  ]);

  return {
    totalLeads,
    noWebsite,
    hasWebsite,
    noLandingPage,
    qualified,
    contactsPending,
    contactsSent,
    replies,
    opportunities,
    optedOut,
  };
}

export interface AnalyticsMetrics {
  leadsFound: number;
  commercialLeads: number;
  leadsWithoutWebsite: number;
  leadsWithoutLandingPage: number;
  qualifiedLeads: number;
  messagesPrepared: number;
  messagesSent: number;
  replies: number;
  replyRate: number;
  meetings: number;
  proposals: number;
  customers: number;
  optedOut: number;
  leadsByStatus: Array<{ status: string; count: number }>;
  leadsByCategory: Array<{ category: string; count: number }>;
  leadsByWebsiteStatus: Array<{ status: string; count: number }>;
  leadsByCity: Array<{ city: string; count: number }>;
  leadsPerDay: Array<{ date: string; count: number }>;
}

export async function getAnalyticsMetrics(): Promise<AnalyticsMetrics> {
  const minDate = new Date();
  minDate.setDate(minDate.getDate() - 30);

  const [
    leadsFound,
    commercialLeads,
    leadsWithoutWebsite,
    leadsWithoutLandingPage,
    qualifiedLeads,
    messagesPrepared,
    messagesSent,
    replies,
    meetings,
    proposals,
    customers,
    optedOut,
    leadsByStatus,
    leadsByCategory,
    leadsByWebsiteStatus,
    leadsByCity,
    leadsPerDay,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { commercialScore: { gte: 25 } } }),
    prisma.lead.count({
      where: {
        websiteStatus: {
          in: [
            WEBSITE_STATUS.NO_EXTERNAL_LINK,
            WEBSITE_STATUS.HAS_WHATSAPP_ONLY,
            WEBSITE_STATUS.HAS_LINK_HUB,
            WEBSITE_STATUS.HAS_SOCIAL_ONLY,
          ],
        },
      },
    }),
    prisma.lead.count({
      where: {
        landingPageStatus: { not: LANDING_PAGE_STATUS.HAS_LANDING_PAGE },
      },
    }),
    prisma.lead.count({ where: { leadStatus: LEAD_STATUS.QUALIFIED } }),
    prisma.contact.count({
      where: { status: { in: [MESSAGE_STATUS.DRAFT, MESSAGE_STATUS.PENDING_REVIEW] } },
    }),
    prisma.contact.count({
      where: { status: { in: [MESSAGE_STATUS.SENT, MESSAGE_STATUS.DELIVERED] } },
    }),
    prisma.contact.count({ where: { status: MESSAGE_STATUS.REPLIED } }),
    prisma.lead.count({ where: { leadStatus: LEAD_STATUS.MEETING } }),
    prisma.lead.count({ where: { leadStatus: LEAD_STATUS.PROPOSAL } }),
    prisma.lead.count({ where: { leadStatus: LEAD_STATUS.CUSTOMER } }),
    prisma.lead.count({ where: { optedOut: true } }),
    prisma.lead.groupBy({ by: ["leadStatus"], _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["category"], _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["websiteStatus"], _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["city"], _count: { _all: true } }),
    prisma.lead.findMany({
      where: { createdAt: { gte: minDate } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const groupedByDay = new Map<string, number>();
  for (const lead of leadsPerDay) {
    const key = lead.createdAt.toISOString().slice(0, 10);
    groupedByDay.set(key, (groupedByDay.get(key) ?? 0) + 1);
  }

  return {
    leadsFound,
    commercialLeads,
    leadsWithoutWebsite,
    leadsWithoutLandingPage,
    qualifiedLeads,
    messagesPrepared,
    messagesSent,
    replies,
    replyRate: messagesSent ? Math.round((replies / messagesSent) * 100) : 0,
    meetings,
    proposals,
    customers,
    optedOut,
    leadsByStatus: leadsByStatus.map((l) => ({
      status: l.leadStatus,
      count: l._count._all,
    })),
    leadsByCategory: leadsByCategory
      .map((l) => ({ category: l.category ?? "Sem categoria", count: l._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    leadsByWebsiteStatus: leadsByWebsiteStatus.map((l) => ({
      status: l.websiteStatus,
      count: l._count._all,
    })),
    leadsByCity: leadsByCity
      .map((l) => ({ city: l.city ?? "Sem cidade", count: l._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    leadsPerDay: Array.from(groupedByDay.entries()).map(([date, count]) => ({
      date,
      count,
    })),
  };
}

export async function getTopOpportunities(limit = 10) {
  return prisma.lead.findMany({
    where: {
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
    },
    orderBy: [{ leadScore: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });
}