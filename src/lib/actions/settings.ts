"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { addCategory, removeCategory } from "@/lib/database/settings";
import { logEntry } from "@/lib/database/log";

export async function addCategoryAction(formData: FormData) {
  await requireAuth();
  const category = String(formData.get("category") ?? "").trim();
  if (!category) return { error: "Categoria obrigatória" };
  if (category.length > 60) return { error: "Categoria muito longa" };

  const categories = await addCategory(category);
  await logEntry("Settings", `Categoria adicionada: ${category}`, {
    metadata: { categories: categories.length },
  });
  revalidatePath("/settings");
  return { success: true, error: null };
}

export async function removeCategoryAction(formData: FormData) {
  await requireAuth();
  const category = String(formData.get("category") ?? "").trim();
  if (!category) return { error: "Categoria obrigatória" };

  await removeCategory(category);
  await logEntry("Settings", `Categoria removida: ${category}`);
  revalidatePath("/settings");
  return { success: true, error: null };
}