"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import {
  addCategoryAction,
  removeCategoryAction,
} from "@/lib/actions/settings";

export function CategoryManager({ categories }: { categories: string[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);

  const add = async () => {
    if (!value.trim()) return;
    setPending(true);
    const fd = new FormData();
    fd.set("category", value);
    const result = await addCategoryAction(fd);
    setPending(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setValue("");
    toast.success("Categoria adicionada");
    router.refresh();
  };

  const remove = async (category: string) => {
    const fd = new FormData();
    fd.set("category", category);
    const result = await removeCategoryAction(fd);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Categoria removida");
      router.refresh();
    }
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-end gap-2">
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="new-cat">Nova categoria</Label>
          <Input
            id="new-cat"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ex: Padaria artesanal"
            maxLength={60}
          />
        </div>
        <Button onClick={add} disabled={pending || !value.trim()}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </div>

      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs"
            >
              {cat}
              <button
                onClick={() => remove(cat)}
                className="text-muted-foreground hover:text-red-600"
                aria-label={`Remover ${cat}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Nenhuma categoria personalizada ainda. As categorias padrão estão
          sempre disponíveis no Discovery.
        </p>
      )}
    </div>
  );
}