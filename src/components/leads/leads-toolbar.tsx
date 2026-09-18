"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter, Download, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { DiscoveryDialog } from "@/components/leads/discovery-dialog";
import { LeadFiltersPanel } from "@/components/leads/lead-filters-panel";
import { useRef } from "react";

export function LeadsToolbar({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get("query") ?? "";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateQuery = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("query", value);
      else params.delete("query");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 350);
  };

  const buildExportUrl = (format: "csv" | "xlsx" | "json") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("format", format);
    return `/api/leads/export?${params.toString()}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="query"
          defaultValue={query}
          onChange={(e) => updateQuery(e.target.value)}
          placeholder="Buscar leads…"
          className="pl-9"
        />
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="mr-1 h-4 w-4" /> Filtros
          </Button>
        </SheetTrigger>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filtrar leads</SheetTitle>
          </SheetHeader>
          <LeadFiltersPanel />
        </SheetContent>
      </Sheet>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-4 w-4" /> Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {total} lead(s) com filtros atuais
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => router.push(buildExportUrl("csv"))}>
            CSV
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push(buildExportUrl("xlsx"))}>
            Excel (XLSX)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push(buildExportUrl("json"))}>
            JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DiscoveryDialog />
      <AddLeadDialog />

      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("opportunities", "1");
          router.push(`${pathname}?${params.toString()}`);
        }}
      >
        <Radar className="mr-1 h-4 w-4" /> Oportunidades
      </Button>
    </div>
  );
}