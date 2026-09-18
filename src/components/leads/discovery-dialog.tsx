"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  runDiscoveryAction,
  enqueueDiscoveryJob,
} from "@/lib/actions/leads";
import { isMockMode } from "@/lib/config";

export function DiscoveryDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"sync" | "queue">("sync");
  const [pending, setPending] = useState(false);
  const mock = isMockMode();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);

    let result;
    if (mode === "sync") {
      result = await runDiscoveryAction(formData);
    } else {
      result = await enqueueDiscoveryJob(formData);
    }

    setPending(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }
    if (result?.success) {
      if (mode === "sync") {
        toast.success(
          `Discovery concluído: ${result.total ?? 0} encontrados, ${result.created ?? 0} novos`
        );
      } else {
        toast.success(`Discovery enfileirado (job ${result.jobId})`);
      }
      setOpen(false);
      router.refresh();
      return;
    }
    toast.success("Tarefa enfileirada na fila de processamento.");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Radar className="mr-1 h-4 w-4" /> Discovery
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rodar Discovery</DialogTitle>
          <DialogDescription>
            Busca perfis com atividade comercial no Instagram a partir das
            categorias configuradas.
            {mock
              ? " Modo demonstrativo: simula a descoberta com dados fictícios."
              : " Requer credenciais e segue as regras da plataforma (sem contornar limites)."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="category">Categoria</Label>
            <Input id="category" name="category" placeholder="Ex: Nutricionista" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" name="city" placeholder="Opcional — ex: Curitiba" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="limit">Quantidade máxima</Label>
            <Input id="limit" name="limit" type="number" min={1} max={50} defaultValue={10} />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "sync" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("sync")}
            >
              Executar agora
            </Button>
            <Button
              type="button"
              variant={mode === "queue" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("queue")}
            >
              Enfileirar
            </Button>
          </div>
          <Button type="submit" disabled={pending}>
            {pending
              ? mode === "sync"
                ? "Descobrindo…"
                : "Enfileirando…"
              : mode === "sync"
                ? "Iniciar Discovery"
                : "Enfileirar job"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}