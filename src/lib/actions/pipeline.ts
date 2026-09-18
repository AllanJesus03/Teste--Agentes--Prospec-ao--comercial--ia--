"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/session";
import { logEntry } from "@/lib/database/log";
import { LEAD_STATUS } from "@/lib/constants";

export async function setLeadStatusAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return { error: "Dados inválidos" };

  const valid = Object.values(LEAD_STATUS);
  if (!valid.includes(status as (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS])) {
    return { error: "Status inválido" };
  }

  await prisma.lead.update({ where: { id }, data: { leadStatus: status } });
  await logEntry("Pipeline", `Lead movido para ${status}`, { leadId: id });

  revalidatePath("/pipeline");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/dashboard");
  return { success: true, error: null };
}