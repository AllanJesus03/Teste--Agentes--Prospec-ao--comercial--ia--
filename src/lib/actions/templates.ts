"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/session";
import { logEntry } from "@/lib/database/log";
import { extractVariables } from "@/lib/outreach/template";

export async function createTemplateAction(formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "first_contact");
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name || !body) return { error: "Nome e corpo são obrigatórios" };
  if (typeof body === "string" && /<script/i.test(body)) {
    return { error: "Conteúdo inválido" };
  }

  const extraction = extractVariables(body);
  const template = await prisma.template.create({
    data: {
      name,
      description,
      category,
      body,
      variables: JSON.stringify(extraction),
    },
  });
  await logEntry("Templates", `Template criado: ${template.name}`);
  revalidatePath("/templates");
  return { success: true, id: template.id, error: null };
}

export async function updateTemplateAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!id) return { error: "ID inválido" };
  if (!name || !body) return { error: "Nome e corpo são obrigatórios" };

  const extraction = extractVariables(body);
  await prisma.template.update({
    where: { id },
    data: {
      name,
      description,
      category,
      body,
      variables: JSON.stringify(extraction),
    },
  });
  revalidatePath("/templates");
  return { success: true, id, error: null };
}

export async function deleteTemplateAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  await prisma.template.delete({ where: { id } });
  await logEntry("Templates", `Template excluído: ${id}`);
  revalidatePath("/templates");
  return { success: true, error: null };
}