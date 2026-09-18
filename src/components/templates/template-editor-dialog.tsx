"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { extractVariables } from "@/lib/outreach/template";
import { TEMPLATE_CATEGORY_LABELS, TEMPLATE_VARIABLES } from "@/lib/constants";
import {
  createTemplateAction,
  updateTemplateAction,
} from "@/lib/actions/templates";

interface TemplateEditorProps {
  existing?: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    body: string;
  };
}

export function TemplateEditorDialog({ existing }: TemplateEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [category, setCategory] = useState(existing?.category ?? "first_contact");
  const [body, setBody] = useState(existing?.body ?? "");

  const analysis = useMemo(() => {
    const extracted = extractVariables(body);
    const unknown = extracted.filter(
      (v) => !TEMPLATE_VARIABLES.includes(v as (typeof TEMPLATE_VARIABLES)[number])
    );
    return { extracted, unknown };
  }, [body]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    if (existing) fd.set("id", existing.id);
    fd.set("category", category);
    const result = existing
      ? await updateTemplateAction(fd)
      : await createTemplateAction(fd);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(existing ? "Template atualizado" : "Template criado");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {existing ? (
          <Button variant="ghost" size="sm">Editar</Button>
        ) : (
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> Novo template
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{existing ? "Editar template" : "Novo template"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="tmpl-name">Nome *</Label>
              <Input
                id="tmpl-name"
                name="name"
                defaultValue={existing?.name}
                placeholder="Ex: Primeiro contato"
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tmpl-desc">Descrição</Label>
            <Input
              id="tmpl-desc"
              name="description"
              defaultValue={existing?.description ?? ""}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tmpl-body">Corpo *</Label>
            <Textarea
              id="tmpl-body"
              name="body"
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Olá {{business_name}}! …"}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis:{" "}
              {TEMPLATE_VARIABLES.map((v) => (
                <code key={v} className="mr-1 rounded bg-muted px-1 py-0.5 text-[11px]">
                  {`{{${v}}}`}
                </code>
              ))}
            </p>
            {analysis.extracted.length ? (
              <div className="flex flex-wrap gap-1.5">
                {analysis.extracted.map((v) => (
                  <Badge
                    key={v}
                    variant={
                      TEMPLATE_VARIABLES.includes(v as (typeof TEMPLATE_VARIABLES)[number])
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {`{{${v}}}`} {analysis.unknown.includes(v) ? "(desconhecida)" : ""}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : existing ? "Salvar alterações" : "Criar template"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}