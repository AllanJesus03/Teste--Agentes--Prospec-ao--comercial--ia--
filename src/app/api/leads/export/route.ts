import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { queryLeads } from "@/lib/database/leads";
import type { LeadFilters } from "@/types/lead";
import * as XLSX from "xlsx";

type ExportFormat = "csv" | "xlsx" | "json";

export const runtime = "nodejs";

const EXPORT_COLUMNS = [
  "id",
  "instagram_username",
  "business_name",
  "category",
  "bio",
  "city",
  "state",
  "country",
  "followers",
  "website_url",
  "website_status",
  "landing_page_status",
  "website_quality_score",
  "commercial_score",
  "lead_score",
  "lead_priority",
  "lead_status",
  "contact_email",
  "contact_phone",
  "whatsapp",
  "created_at",
  "updated_at",
  "last_checked_at",
];

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const format = (url.searchParams.get("format") ?? "csv") as ExportFormat;
  if (!["csv", "xlsx", "json"].includes(format)) {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  const filters: LeadFilters = {
    query: url.searchParams.get("query") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    city: url.searchParams.get("city") ?? undefined,
    state: url.searchParams.get("state") ?? undefined,
    priority: url.searchParams.get("priority") ?? undefined,
    leadStatus: url.searchParams.get("leadStatus") ?? undefined,
    websiteStatus: url.searchParams.get("websiteStatus") ?? undefined,
    landingPageStatus: url.searchParams.get("landingPageStatus") ?? undefined,
    opportunities: url.searchParams.get("opportunities") === "1",
    minScore: numberParam(url, "minScore"),
    maxScore: numberParam(url, "maxScore"),
    minFollowers: numberParam(url, "minFollowers"),
    maxFollowers: numberParam(url, "maxFollowers"),
    pageSize: 500,
  };

  const { leads } = await queryLeads(filters);

  const rows = leads.map((lead) => {
    const row = new Map<string, unknown>();
    EXPORT_COLUMNS.forEach((col) => row.set(col, lead[col as keyof typeof lead]));
    row.set("website_quality_score", lead.websiteQualityScore);
    row.set("external_links", lead.externalLinks);
    return Object.fromEntries(row);
  });

  if (format === "json") {
    return NextResponse.json({ leads: rows, total: rows.length });
  }

  const sheet = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "leads");

  const filename = `leads-${new Date().toISOString().slice(0, 10)}.${format}`;

  if (format === "xlsx") {
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "csv" });
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function numberParam(url: URL, key: string): number | undefined {
  const raw = url.searchParams.get(key);
  if (!raw) return undefined;
  const num = Number(raw);
  return Number.isFinite(num) ? num : undefined;
}