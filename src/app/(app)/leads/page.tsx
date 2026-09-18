import { queryLeads } from "@/lib/database/leads";
import type { LeadFilters } from "@/types/lead";
import { LeadsToolbar } from "@/components/leads/leads-toolbar";
import { LeadsTable } from "@/components/leads/leads-table";
import { Pagination } from "@/components/leads/pagination";
import { Card, CardContent } from "@/components/ui/card";

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{
    query?: string;
    category?: string;
    city?: string;
    state?: string;
    priority?: string;
    leadStatus?: string;
    websiteStatus?: string;
    landingPageStatus?: string;
    opportunities?: string;
    minScore?: string;
    maxScore?: string;
    minFollowers?: string;
    maxFollowers?: string;
    page?: string;
  }>;
}

function numberParam(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function buildPageHref(
  base: URLSearchParams,
  page: number
): string {
  const params = new URLSearchParams(base);
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  return `/leads?${params.toString()}`;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  const filters: LeadFilters = {
    query: sp.query,
    category: sp.category === "ALL" ? undefined : sp.category,
    city: sp.city,
    state: sp.state,
    priority: sp.priority === "ALL" ? undefined : sp.priority,
    leadStatus: sp.leadStatus,
    websiteStatus:
      sp.websiteStatus === "ALL" ? undefined : sp.websiteStatus,
    landingPageStatus:
      sp.landingPageStatus === "ALL" ? undefined : sp.landingPageStatus,
    opportunities: sp.opportunities === "1" || undefined,
    minScore: numberParam(sp.minScore),
    maxScore: numberParam(sp.maxScore),
    minFollowers: numberParam(sp.minFollowers),
    maxFollowers: numberParam(sp.maxFollowers),
    page: Math.max(1, numberParam(sp.page) ?? 1),
    pageSize: PAGE_SIZE,
    sortBy: "updatedAt",
  };

  const { leads, total, page, totalPages } = await queryLeads(filters);

  const base = new URLSearchParams();
  const copy = (k: string, v?: string) => {
    if (v && v !== "ALL") base.set(k, v);
  };
  copy("query", sp.query);
  copy("category", sp.category);
  copy("city", sp.city);
  copy("state", sp.state);
  copy("priority", sp.priority);
  copy("leadStatus", sp.leadStatus);
  copy("websiteStatus", sp.websiteStatus);
  copy("landingPageStatus", sp.landingPageStatus);
  if (sp.opportunities === "1") base.set("opportunities", "1");
  copy("minScore", sp.minScore);
  copy("maxScore", sp.maxScore);
  copy("minFollowers", sp.minFollowers);
  copy("maxFollowers", sp.maxFollowers);

  const paginate = (p: number) => buildPageHref(base, p);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">Leads</h1>
        <p className="text-sm text-muted-foreground">
          {total} lead(s) · atualizados nos últimos 30 dias por padrão
        </p>
      </div>

      <LeadsToolbar total={total} />

      <Card>
        <CardContent className="p-0 pt-0">
          <LeadsTable
            leads={leads}
            total={total}
            page={page}
            pageSize={PAGE_SIZE}
            showOpportunities={filters.opportunities}
          />
          <div className="flex items-center justify-between border-t px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <Pagination page={page} totalPages={totalPages} buildHref={paginate} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}