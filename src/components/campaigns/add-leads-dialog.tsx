"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { addLeadsToCampaign } from "@/lib/actions/campaigns";

interface AddLeadsDialogProps {
  campaignId: string;
  leads: Array<{
    id: string;
    instagramUsername: string;
    businessName: string | null;
    category: string | null;
    leadScore: number;
  }>;
}

export function AddLeadsDialog({ campaignId, leads }: AddLeadsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((s) => s !== id)
    );
  };

  const submit = async () => {
    if (!selected.length) return;
    setPending(true);
    const fd = new FormData();
    fd.set("campaignId", campaignId);
    fd.set("leadIds", selected.join(","));
    const result = await addLeadsToCampaign(fd);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${result.added} lead(s) adicionados${result.skipped ? ` (${result.skipped} já estavam)` : ""}`);
    setSelected([]);
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-1 h-4 w-4" /> Adicionar leads
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar leads à campanha</DialogTitle>
        </DialogHeader>
        <div className="grid gap-1.5">
          {leads.map((lead) => (
            <label
              key={lead.id}
              className="flex cursor-pointer items-center gap-3 rounded-md border p-2.5 hover:bg-accent/50"
            >
              <Checkbox
                checked={selected.includes(lead.id)}
                onCheckedChange={(v) => toggle(lead.id, Boolean(v))}
                aria-label={lead.instagramUsername}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {lead.businessName ?? `@${lead.instagramUsername}`}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  @{lead.instagramUsername} ·{" "}
                  {lead.leadScore} pts · {lead.category ?? "—"}
                </p>
              </div>
            </label>
          ))}
          {leads.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum lead disponível para adicionar.
            </p>
          ) : null}
        </div>
        <Button onClick={submit} disabled={pending || selected.length === 0}>
          {pending ? (
            "Adicionando…"
          ) : (
            <>
              <Check className="mr-1 h-4 w-4" /> Adicionar {selected.length > 0 ? `(${selected.length})` : ""}
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}