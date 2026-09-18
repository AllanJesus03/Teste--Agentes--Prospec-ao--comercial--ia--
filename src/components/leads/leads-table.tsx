"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCompact, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import {
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
  Ban,
  RotateCcw,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  deleteLeadAction,
  setOptOutAction,
  undoOptOutAction,
  reanalyzeSelected,
} from "@/lib/actions/leads";
import type { Lead } from "@prisma/client";

interface LeadsTableProps {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
  showOpportunities?: boolean;
  onSelectionChange?: (newIds: string[]) => void;
}

export function LeadsTable({
  leads,
  showOpportunities = false,
  onSelectionChange,
}: LeadsTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string, checked: boolean) => {
    const next = checked
      ? [...selected, id]
      : selected.filter((s) => s !== id);
    setSelected(next);
    onSelectionChange?.(next);
  };

  const toggleAll = (checked: boolean) => {
    const next = checked ? leads.map((l) => l.id) : [];
    setSelected(next);
    onSelectionChange?.(next);
  };

  const handleReanalyze = async () => {
    const result = await reanalyzeSelected(selected);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${result.enqueued} lead(s) em análise.`);
    setSelected([]);
    onSelectionChange?.([]);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const fd = new FormData();
    fd.set("id", id);
    const result = await deleteLeadAction(fd);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Lead excluído");
      router.refresh();
    }
  };

  const handleOptOut = async (id: string) => {
    const fd = new FormData();
    fd.set("id", id);
    const result = await setOptOutAction(fd);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Lead adicionado ao opt-out");
      router.refresh();
    }
  };

  const handleUndoOptOut = async (id: string) => {
    const fd = new FormData();
    fd.set("id", id);
    const result = await undoOptOutAction(fd);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Opt-out removido");
      router.refresh();
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="w-8 py-2 pr-2">
              <Checkbox
                checked={leads.length > 0 && selected.length === leads.length}
                onCheckedChange={(v) => toggleAll(Boolean(v))}
                aria-label="Selecionar todos"
              />
            </th>
            <th className="px-2 py-2 font-medium">Negócio / Instagram</th>
            <th className="hidden px-2 py-2 font-medium lg:table-cell">Categoria</th>
            <th className="hidden px-2 py-2 font-medium md:table-cell">Local</th>
            <th className="hidden px-2 py-2 font-medium md:table-cell">Seguid.</th>
            <th className="px-2 py-2 font-medium">Website</th>
            <th className="hidden px-2 py-2 font-medium md:table-cell">Score</th>
            <th className="hidden px-2 py-2 font-medium lg:table-cell">Status</th>
            <th className="hidden px-2 py-2 font-medium lg:table-cell">Criado</th>
            <th className="w-8 px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={10} className="py-12 text-center text-muted-foreground">
                {showOpportunities
                  ? "Nenhuma oportunidade com os filtros atuais."
                  : "Nenhum lead encontrado."}
              </td>
            </tr>
          ) : null}
          {leads.map((lead) => {
            const isOptedOut = lead.optedOut || lead.leadStatus === "OPTED_OUT";
            return (
              <tr
                key={lead.id}
                className={cn(
                  "border-b transition-colors hover:bg-accent/40",
                  isOptedOut && "opacity-60"
                )}
              >
                <td className="py-2 pr-2">
                  <Checkbox
                    checked={selected.includes(lead.id)}
                    onCheckedChange={(v) => toggle(lead.id, Boolean(v))}
                    aria-label={`Selecionar ${lead.instagramUsername}`}
                  />
                </td>
                <td className="px-2 py-2">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="flex flex-col gap-0.5"
                  >
                    <span className="font-medium">
                      {lead.businessName ?? lead.instagramUsername}
                      {isOptedOut ? (
                        <span className="ml-2 inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                          <Ban className="h-3 w-3" /> opt-out
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @{lead.instagramUsername}
                      {lead.whatsapp ? (
                        <span className="ml-1.5">· WhatsApp ✓</span>
                      ) : null}
                    </span>
                  </Link>
                </td>
                <td className="hidden px-2 py-2 text-muted-foreground lg:table-cell">
                  {lead.category ?? "—"}
                </td>
                <td className="hidden px-2 py-2 text-muted-foreground md:table-cell">
                  {lead.city ?? "—"}
                  {lead.state ? `/${lead.state}` : ""}
                </td>
                <td className="hidden px-2 py-2 tabular-nums md:table-cell">
                  {formatCompact(lead.followers)}
                </td>
                <td className="px-2 py-2">
                  <StatusBadge
                    value={
                      lead.websiteStatus === "NO_EXTERNAL_LINK" &&
                      lead.websiteNotReachable
                        ? "WEBSITE_NOT_REACHABLE"
                        : lead.websiteStatus === "NO_EXTERNAL_LINK" &&
                            lead.analysisFailed
                          ? "ANALYSIS_FAILED"
                          : lead.websiteStatus
                    }
                    kind="websiteStatus"
                  />
                </td>
                <td className="hidden px-2 py-2 md:table-cell">
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        lead.leadScore >= 60
                          ? "bg-emerald-500"
                          : lead.leadScore >= 40
                            ? "bg-amber-500"
                            : "bg-slate-300"
                      )}
                    />
                    {lead.leadScore}
                  </span>
                </td>
                <td className="hidden px-2 py-2 lg:table-cell">
                  <StatusBadge value={lead.leadStatus} />
                </td>
                <td className="hidden px-2 py-2 text-xs text-muted-foreground lg:table-cell">
                  {formatDate(lead.createdAt)}
                </td>
                <td className="px-2 py-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Ações</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild>
                        <Link href={`/leads/${lead.id}`}>
                          <ExternalLink className="mr-2 h-4 w-4" /> Ver detalhes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          reanalyzeSelected([lead.id]).then((r) => {
                            if (r?.error) toast.error(r.error);
                            else {
                              toast.success("Reanálise enfileirada");
                              router.refresh();
                            }
                          });
                        }}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" /> Reanalisar
                      </DropdownMenuItem>

                      {isOptedOut ? (
                        <DropdownMenuItem onSelect={() => handleUndoOptOut(lead.id)}>
                          <RotateCcw className="mr-2 h-4 w-4" /> Remover opt-out
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => handleOptOut(lead.id)}>
                          <Ban className="mr-2 h-4 w-4" /> Não contatar
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4 text-red-600" /> Excluir
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
                            <AlertDialogDescription>
                              @{lead.instagramUsername} e todos os contatos
                              associados serão removidos permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(lead.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer / bulk bar */}
      {selected.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t pt-3">
          <span className="text-sm text-muted-foreground">
            {selected.length} selecionado(s)
          </span>
          <Button size="sm" variant="secondary" onClick={handleReanalyze}>
            <RefreshCw className="mr-1 h-4 w-4" /> Reanalisar
          </Button>
          <Button size="sm" variant="outline" onClick={() => {
            setSelected([]);
            onSelectionChange?.([]);
          }}>
            Limpar
          </Button>
        </div>
      ) : null}
    </div>
  );
}