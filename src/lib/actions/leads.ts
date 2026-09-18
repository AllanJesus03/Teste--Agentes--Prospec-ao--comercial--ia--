"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/database/prisma";
import {
  upsertLead,
  deleteLeadCompletely,
  setOptOut,
} from "@/lib/database/leads";
import { OrchestratorAgent } from "@/agents/orchestrator-agent";
import { enqueue } from "@/lib/queue/queue";
import { JOB_TYPE } from "@/lib/constants";
import { logEntry } from "@/lib/database/log";
import { requireAuth } from "@/lib/auth/session";
import { auth } from "@/auth";

const orchestrator = new OrchestratorAgent();

function cleanString(value: FormDataEntryValue | null): string | undefined {
  const s = String(value ?? "").trim();
  return s.length ? s : undefined;
}

function cleanNumber(value: FormDataEntryValue | null): number | undefined {
  const s = String(value ?? "").trim().replace(/\D/g, "");
  return s.length ? Number(s) : undefined;
}

export async function createLeadAction(formData: FormData) {
  await requireAuth();

  const instagramUsername = String(formData.get("instagramUsername") ?? "");
  if (!instagramUsername) {
    return { error: "Instagram é obrigatório" };
  }

  const category = cleanString(formData.get("category"));
  const externalLinksText = cleanString(formData.get("externalLinks"));
  const externalLinks = externalLinksText
    ? externalLinksText.split(/\n|,|;/).map((l) => l.trim()).filter(Boolean)
    : undefined;

  const roles = await auth();
  const createdBy = roles?.user?.id;

  try {
    const { lead, created } = await upsertLead({
      instagramUsername,
      businessName: cleanString(formData.get("businessName")),
      category,
      bio: cleanString(formData.get("bio")),
      city: cleanString(formData.get("city")),
      state: cleanString(formData.get("state")),
      followers: cleanNumber(formData.get("followers")),
      whatsapp: cleanString(formData.get("whatsapp")),
      contactEmail: cleanString(formData.get("contactEmail")),
      contactPhone: cleanString(formData.get("contactPhone")),
      websiteUrl: cleanString(formData.get("websiteUrl")),
      externalLinks,
      dataSource: "manual",
      sourceUrl: cleanString(formData.get("instagramUrl")),
    });

    await logEntry("Database", created ? `Lead criado manualmente: @${lead.instagramUsername}` : `Lead atualizado: @${lead.instagramUsername}`, {
      leadId: lead.id,
    });

    await enqueue(JOB_TYPE.ANALYSIS, { leadId: lead.id, createdBy });

    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return {
      success: true,
      created,
      id: lead.id,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

export async function updateLeadAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  const data: Record<string, unknown> = {};
  const fields: Array<{ key: string; type?: "number" | "text" }> = [
    { key: "businessName" },
    { key: "category" },
    { key: "bio" },
    { key: "city" },
    { key: "state" },
    { key: "whatsapp" },
    { key: "contactEmail" },
    { key: "contactPhone" },
    { key: "websiteUrl" },
    { key: "instagramUrl" },
    { key: "followers", type: "number" },
    { key: "posts", type: "number" },
  ];

  for (const field of fields) {
    const raw = formData.get(field.key);
    const value =
      field.type === "number"
        ? cleanNumber(raw)
        : cleanString(raw);
    data[field.key] = value;
  }

  if (typeof data.businessName === "string" && /<script/i.test(data.businessName)) {
    return { error: "Dados inválidos" };
  }

  try {
    await prisma.lead.update({ where: { id }, data });
    revalidatePath(`/leads/${id}`);
    revalidatePath("/leads");
    return { success: true, id, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

export async function deleteLeadAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  try {
    await deleteLeadCompletely(id);
    await logEntry("Database", `Lead excluído: ${id}`);
    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

export async function setOptOutAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || undefined;
  if (!id) return { error: "ID inválido" };

  try {
    await setOptOut(id, reason);
    await prisma.contact.updateMany({
      where: { leadId: id, status: { in: ["DRAFT", "PENDING_REVIEW"] } },
      data: { status: "OPTED_OUT" },
    });
    await logEntry("Lead", `Lead marcado como opt-out`, { leadId: id, metadata: { reason } });
    revalidatePath(`/leads/${id}`);
    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

export async function undoOptOutAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  try {
    await prisma.lead.update({
      where: { id },
      data: { optedOut: false, optOutReason: null, leadStatus: "QUALIFIED" },
    });
    revalidatePath(`/leads/${id}`);
    revalidatePath("/leads");
    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

export async function runDiscoveryAction(formData: FormData) {
  await requireAuth();
  const category = cleanString(formData.get("category"));
  const city = cleanString(formData.get("city"));
  const limit = Math.min(50, Math.max(1, Number(formData.get("limit") ?? 10)));

  try {
    const result = await orchestrator.execute({
      input: {
        action: "discover",
        discover: { category, city, limit },
      },
    });
    const payload = (result.data ?? {}) as { total?: number; created?: number };
    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return {
      success: result.success,
      total: payload.total ?? 0,
      created: payload.created ?? 0,
      error: result.success ? null : (result.errors?.join("; ") ?? "Falha no discovery"),
      jobId: undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, total: 0, created: 0, error: message, jobId: undefined };
  }
}

export async function enqueueDiscoveryJob(formData: FormData) {
  await requireAuth();
  const author = await auth();
  const job = await enqueue(JOB_TYPE.DISCOVERY, {
    createdBy: author?.user?.id ?? "system",
    payload: {
      category: cleanString(formData.get("category")),
      city: cleanString(formData.get("city")),
      limit: Math.min(50, Math.max(1, Number(formData.get("limit") ?? 10))),
    },
  });
  return { success: true, total: 0, created: 0, error: null as string | null, jobId: job.id };
}

export async function reanalyzeSelected(ids: string[]) {
  await requireAuth();
  const validIds = (ids ?? []).filter((id) => typeof id === "string" && id);
  if (!validIds.length) return { error: "Nenhum lead selecionado" };

  const author = await auth();
  const createdBy = author?.user?.id;

  for (const id of validIds) {
    await enqueue(JOB_TYPE.REANALYZE, { leadId: id, createdBy });
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true, enqueued: validIds.length, error: null };
}

export async function importCsvAction(formData: FormData) {
  await requireAuth();
  const file = formData.get("file");
  if (!(file instanceof File) || !file.size) {
    return { error: "Arquivo inválido" };
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { error: "Arquivo vazio" };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const required = ["instagram"];
  const missing = required.filter((r) => !headers.includes(r));
  if (missing.length) {
    return { error: `Coluna obrigatória ausente: ${missing.join(", ")}` };
  }

  const normalizedHeaders = headers.map((h) =>
    h === "instagram"
      ? "instagramUsername"
      : h === "nome"
        ? "businessName"
        : h === "whatsapp"
          ? "whatsapp"
          : h === "site"
            ? "websiteUrl"
            : h === "email"
              ? "contactEmail"
              : h === "bio"
                ? "bio"
                : h === "cidade"
                  ? "city"
                  : h === "estado"
                    ? "state"
                    : h === "categoria"
                      ? "category"
                      : h
  );

  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    const cells = row.split(",").map((c) => c.trim());
    const record: Record<string, string | undefined> = {};
    normalizedHeaders.forEach((h, idx) => {
      record[h] = cells[idx] ?? undefined;
    });

    if (!record.instagramUsername) {
      failed++;
      continue;
    }

    try {
      const { created: isCreated } = await upsertLead({
        instagramUsername: record.instagramUsername,
        businessName: record.businessName,
        category: record.category,
        bio: record.bio,
        city: record.city,
        state: record.state,
        whatsapp: record.whatsapp,
        contactEmail: record.email,
        websiteUrl: record.websiteUrl,
        dataSource: "csv",
      });
      if (isCreated) created++;
      else updated++;
    } catch (err) {
      failed++;
      errors.push(
        `Linha ${i + 1}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  await logEntry("Database", `Importação CSV: ${created} criados, ${updated} atualizados, ${failed} falhas`, {
    metadata: { errors: errors.slice(0, 10) },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");

  if (failed > 0) {
    return { success: true, created, updated, failed, errors: errors.slice(0, 10), error: null };
  }
  return { success: true, created, updated, failed: 0, error: null };
}