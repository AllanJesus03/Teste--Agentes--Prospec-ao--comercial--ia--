"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/session";
import { OutreachAgent } from "@/agents/outreach-agent";
import { logEntry } from "@/lib/database/log";
import { MESSAGE_STATUS, LEAD_STATUS } from "@/lib/constants";
import { renderTemplate } from "@/lib/outreach/template";

const outreachAgent = new OutreachAgent();

export async function generateMessageAction(formData: FormData) {
  await requireAuth();
  const leadId = String(formData.get("leadId") ?? "");
  const templateId = String(formData.get("templateId") ?? "") || undefined;

  if (!leadId) return { error: "leadId inválido" };

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { error: "Lead não encontrado" };
  if (lead.optedOut) return { error: "Lead em opt-out: conversas manuais ainda permitidas, mas contatos automáticos bloqueados." };

  const existingPending = await prisma.contact.findFirst({
    where: {
      leadId,
      status: { in: [MESSAGE_STATUS.DRAFT, MESSAGE_STATUS.PENDING_REVIEW, MESSAGE_STATUS.APPROVED] },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existingPending) {
    return { success: true, draft: existingPending, error: null, reused: true };
  }

  let body: string;
  let templateUsed: string | null = null;

  if (templateId) {
    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) return { error: "Template não encontrado" };
    const vars = {
      business_name: lead.businessName ?? lead.instagramUsername,
      instagram_username: lead.instagramUsername,
      category: lead.category ?? "",
      city: lead.city ?? "",
    };
    const rendered = renderTemplate({ body: template.body, variables: vars });
    body = rendered.body;
    templateUsed = template.id;
  } else {
    const result = await outreachAgent.execute({ leadId });
    if (!result.success) return { error: result.errors?.join("; ") ?? "Falha ao gerar mensagem" };
    body = (result.data as { body?: string })?.body ?? "";
    if (!body) return { error: "Mensagem vazia gerada" };
  }

  const draft = await prisma.contact.create({
    data: {
      leadId,
      channel: "message",
      message: body,
      status: MESSAGE_STATUS.DRAFT,
      templateId: templateUsed,
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { leadStatus: LEAD_STATUS.CONTACT_PENDING },
  });

  await logEntry("Outreach Agent", `Mensagem iniciada (rascunho) para @${lead.instagramUsername}`, {
    leadId,
  });

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/messages");
  return { success: true, draft: { ...draft, message: body }, error: null, reused: false };
}

export async function updateMessageStatusAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return { error: "Parâmetros inválidos" };
  if (
    !(
      [
        MESSAGE_STATUS.PENDING_REVIEW,
        MESSAGE_STATUS.APPROVED,
        MESSAGE_STATUS.SENT,
        MESSAGE_STATUS.FAILED,
      ] as string[]
    ).includes(status)
  ) {
    return { error: "Status inválido" };
  }

  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) return { error: "Mensagem não encontrada" };

  const transitions: Record<string, string[]> = {
    [MESSAGE_STATUS.PENDING_REVIEW]: [MESSAGE_STATUS.DRAFT],
    [MESSAGE_STATUS.APPROVED]: [MESSAGE_STATUS.PENDING_REVIEW],
    [MESSAGE_STATUS.SENT]: [MESSAGE_STATUS.APPROVED, MESSAGE_STATUS.SENT],
  };
  const allowed = transitions[status] ?? [];
  if (contact.status !== status && !allowed.includes(contact.status)) {
    return { error: `Transição inválida: ${contact.status} → ${status}` };
  }

  const data: Record<string, unknown> = { status };
  if (status === MESSAGE_STATUS.SENT) {
    data.sentAt = new Date();
    if (contact.status === MESSAGE_STATUS.APPROVED) {
      data.responseAt = null;
    }
  }

  await prisma.contact.update({ where: { id }, data });

  if (status === MESSAGE_STATUS.SENT) {
    await prisma.lead.update({
      where: { id: contact.leadId },
      data: { leadStatus: LEAD_STATUS.CONTACTED, lastCheckedAt: new Date() },
    });
    await logEntry("Outreach Agent", `Mensagem enviada (canal abstrato)`, { leadId: contact.leadId });
  }

  revalidatePath("/messages");
  revalidatePath(`/leads/${contact.leadId}`);
  return { success: true, error: null };
}

export async function deleteMessageAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) return { error: "Mensagem não encontrada" };
  if (contact.status === MESSAGE_STATUS.SENT) {
    return { error: "Mensagens enviadas não podem ser excluídas" };
  }

  await prisma.contact.delete({ where: { id } });
  revalidatePath("/messages");
  revalidatePath(`/leads/${contact.leadId}`);
  return { success: true, error: null };
}

export async function markRepliedAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) return { error: "Mensagem não encontrada" };

  await prisma.contact.update({
    where: { id },
    data: { status: MESSAGE_STATUS.REPLIED, responseAt: new Date() },
  });
  await prisma.lead.update({
    where: { id: contact.leadId },
    data: { leadStatus: LEAD_STATUS.REPLIED },
  });

  revalidatePath("/messages");
  revalidatePath(`/leads/${contact.leadId}`);
  return { success: true, error: null };
}