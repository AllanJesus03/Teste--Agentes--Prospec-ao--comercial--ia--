"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createCampaignAction } from "@/lib/actions/campaigns";

export function CreateCampaignDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    const result = await createCampaignAction(new FormData(e.currentTarget));
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Campanha criada");
    setOpen(false);
    router.push(`/campaigns/${result.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Nova campanha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova campanha</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="camp-name">Nome *</Label>
            <Input id="camp-name" name="name" placeholder="Ex: Oportunidades Curitiba" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="camp-desc">Descrição</Label>
            <Textarea id="camp-desc" name="description" rows={3} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Criando…" : "Criar campanha"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}