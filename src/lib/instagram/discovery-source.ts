import type { DiscoveryCandidate } from "@/types/agent";
import { MOCK_LEADS, type MockLead } from "@/data/mock-leads";

export interface DiscoveryOptions {
  category?: string;
  city?: string;
  limit?: number;
  categories?: string[];
}

export interface DiscoverySource {
  name: string;
  discover(options: DiscoveryOptions): Promise<DiscoveryCandidate[]>;
}

function toCandidate(lead: MockLead): DiscoveryCandidate {
  return {
    instagramUsername: lead.username,
    businessName: lead.businessName,
    category: lead.category,
    bio: lead.bio,
    city: lead.city,
    state: lead.state,
    country: lead.country,
    followers: lead.followers,
    posts: lead.posts,
    websiteUrl: lead.websiteUrl ?? undefined,
    externalLinks: lead.externalLinks,
    whatsapp: lead.whatsapp ?? undefined,
    contactEmail: lead.contactEmail ?? undefined,
    dataSource: "mock",
    sourceUrl: `https://instagram.com/${lead.username}`,
  };
}

export class MockDiscoverySource implements DiscoverySource {
  name = "mock";

  async discover(options: DiscoveryOptions = {}): Promise<DiscoveryCandidate[]> {
    let filtered = [...MOCK_LEADS];
    if (options.category) {
      filtered = filtered.filter(
        (l) => l.category.toLowerCase() === options.category?.toLowerCase()
      );
    }
    if (options.city) {
      filtered = filtered.filter(
        (l) => l.city.toLowerCase() === options.city?.toLowerCase()
      );
    }
    if (options.categories?.length) {
      filtered = filtered.filter((l) =>
        options.categories!.some(
          (c) => c.toLowerCase() === l.category.toLowerCase()
        )
      );
    }
    const limit = options.limit ?? 10;
    return filtered.slice(0, limit).map(toCandidate);
  }
}

export function getDiscoverySource(): DiscoverySource {
  return new MockDiscoverySource();
}