"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createLeadAction, importCsvAction } from "@/lib/actions/leads";

export function AddLeadDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const handleManual = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await createLeadAction(formData);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(result.created ? "Lead criado e enviado para análise" : "Lead existente atualizado");
    setOpen(false);
    router.refresh();
    if (result.id) router.push(`/leads/${result.id}`);
  };

  const handleCsv = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await importCsvAction(formData);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(
      `Importação concluída: ${result.created} criados, ${result.updated} atualizados${result.failed ? `, ${result.failed} falhas` : ""}`
    );
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" /> Adicionar lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar lead</DialogTitle>
          <DialogDescription>
            Cadastre manualmente ou importe uma lista CSV.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="csv">Importar CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="pt-4">
            <form onSubmit={handleManual} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ig">Instagram *</Label>
                <Input id="ig" name="instagramUsername" placeholder="@exemplo" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="bn">Nome do negócio</Label>
                  <Input id="bn" name="businessName" placeholder="Ex: Loja Exemplo" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="cat">Categoria</Label>
                  <Input id="cat" name="category" placeholder="Ex: Nutricionista" />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea id="bio" name="bio" rows={3} placeholder="Texto da bio…" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" name="city" placeholder="Curitiba" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="state">Estado</Label>
                  <Input id="state" name="state" maxLength={2} placeholder="PR" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" name="whatsapp" placeholder="5541999990000" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="followers">Seguidores</Label>
                  <Input id="followers" name="followers" type="number" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="websiteUrl">Site</Label>
                  <Input id="websiteUrl" name="websiteUrl" placeholder="https://…" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="contactEmail">E-mail</Label>
                  <Input id="contactEmail" name="contactEmail" type="email" />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="links">Links externos (um por linha)</Label>
                <Textarea id="links" name="externalLinks" rows={2} placeholder="https://wa.me/…" />
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? "Salvando…" : "Salvar lead"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="csv" className="pt-4">
            <form onSubmit={handleCsv} className="grid gap-3">
              <p className="text-xs text-muted-foreground">
                Colunas aceitas: instagram, nome, categoria, bio, cidade, estado,
                whatsapp, email, site. Opcional: seguidores.
              </p>
              <div className="grid gap-1.5">
                <Label htmlFor="file">Arquivo CSV</Label>
                <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? "Importando…" : "Importar CSV"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}