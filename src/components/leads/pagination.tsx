import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter((p) => {
    if (totalPages <= 7) return true;
    return p === 1 || p === totalPages || Math.abs(p - page) <= 1;
  });

  const items: Array<number | "…"> = [];
  let prev = 0;
  visible.forEach((p) => {
    if (prev && p - prev > 1) items.push("…");
    items.push(p);
    prev = p;
  });

  return (
    <div className="flex items-center gap-1">
      {page > 1 ? (
        <Button asChild variant="outline" size="icon" className="h-8 w-8">
          <Link href={buildHref(page - 1)} aria-label="Anterior">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
      ) : null}

      {items.map((p, idx) =>
        p === "…" ? (
          <span key={`e-${idx}`} className="px-1 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={p}
            asChild
            variant={p === page ? "default" : "outline"}
            size="icon"
            className={cn("h-8 w-8", p === page && "pointer-events-none")}
          >
            <Link href={buildHref(p)}>{p}</Link>
          </Button>
        )
      )}

      {page < totalPages ? (
        <Button asChild variant="outline" size="icon" className="h-8 w-8">
          <Link href={buildHref(page + 1)} aria-label="Próxima">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}