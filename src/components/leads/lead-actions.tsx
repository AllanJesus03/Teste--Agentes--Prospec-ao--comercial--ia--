"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Ban,
  RotateCcw,
  MessageSquarePlus,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteLeadAction,
  setOptOutAction,
  undoOptOutAction,
  reanalyzeSelected,
  updateLeadAction,
} from "@/lib/actions/leads";
import { generateMessageAction } from "@/lib/actions/messages";

interface LeadActionsProps {
  lead: {
    id: string;
    instagramUsername: string;
    optedOut: boolean;
  };
}

export function LeadActions({ lead }: LeadActionsProps) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const reanalyze = async () => {
    setAnalyzing(true);
    const result = await reanalyzeSelected([lead.id]);
    setAnalyzing(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Lead reanalisado.");
    router.refresh();
  };

  const generateMessage = async () => {
    setGenerating(true);
    const fd = new FormData();
    fd.set("leadId", lead.id);
    const result = await generateMessageAction(fd);
    setGenerating(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(result.reused ? "Rascunho existente reutilizado" : "Mensagem gerada (rascunho).");
    router.refresh();
  };

  const handleOptOut = async () => {
    const fd = new FormData();
    fd.set("id", lead.id);
    const result = await setOptOutAction(fd);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Adicionado ao opt-out");
      router.refresh();
    }
  };

  const undoOptOut = async () => {
    const fd = new FormData();
    fd.set("id", lead.id);
    const result = await undoOptOutAction(fd);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Opt-out removido");
      router.refresh();
    }
  };

  const handleDelete = async () => {
    const fd = new FormData();
    fd.set("id", lead.id);
    const result = await deleteLeadAction(fd);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Lead excluído");
      router.push("/leads");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <LeadEditDialog leadId={lead.id} instagramUsername={lead.instagramUsername} />

      <Button variant="outline" size="sm" onClick={reanalyze} disabled={analyzing}>
        <RefreshCw className={`mr-1 h-4 w-4 ${analyzing ? "animate-spin" : ""}`} />
        {analyzing ? "Analisando…" : "Reanalisar"}
      </Button>

      <Button size="sm" onClick={generateMessage} disabled={generating}>
        <MessageSquarePlus className="mr-1 h-4 w-4" />
        {generating ? "Gerando…" : "Gerar mensagem"}
      </Button>

      {lead.optedOut ? (
        <Button variant="outline" size="sm" onClick={undoOptOut}>
          <RotateCcw className="mr-1 h-4 w-4" /> Remover opt-out
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleOptOut}
          className="text-red-600 hover:text-red-700"
        >
          <Ban className="mr-1 h-4 w-4" /> Não contatar
        </Button>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-red-600">
            <Trash2 className="mr-1 h-4 w-4" /> Excluir
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os dados de @{lead.instagramUsername} serão removidos
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LeadEditDialog({
  leadId,
  instagramUsername,
}: {
  leadId: string;
  instagramUsername: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("id", leadId);
    const result = await updateLeadAction(fd);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Lead atualizado");
    router.refresh();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="mr-1 h-4 w-4" /> Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar @{instagramUsername}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="eg-businessName">Nome do negócio</Label>
              <Input id="eg-businessName" name="businessName" placeholder="Ex: Loja Exemplo" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="eg-category">Categoria</Label>
              <Input id="eg-category" name="category" placeholder="Ex: Nutricionista" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="eg-bio">Biografia</Label>
            <Textarea id="eg-bio" name="bio" rows={2} placeholder="Texto da bio…" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="eg-city">Cidade</Label>
              <Input id="eg-city" name="city" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="eg-state">Estado</Label>
              <Input id="eg-state" name="state" maxLength={2} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="eg-whatsapp">WhatsApp</Label>
              <Input id="eg-whatsapp" name="whatsapp" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="eg-email">E-mail</Label>
              <Input id="eg-email" name="contactEmail" type="email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="eg-websiteUrl">Site</Label>
              <Input id="eg-websiteUrl" name="websiteUrl" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="eg-followers">Seguidores</Label>
              <Input id="eg-followers" name="followers" type="number" />
            </div>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}