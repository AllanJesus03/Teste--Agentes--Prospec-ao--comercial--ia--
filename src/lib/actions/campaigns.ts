"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/database/prisma";
import { requireAuth } from "@/lib/auth/session";
import { logEntry } from "@/lib/database/log";
import { CAMPAIGN_STATUS } from "@/lib/constants";
import { OutreachAgent } from "@/agents/outreach-agent";

const outreachAgent = new OutreachAgent();

export async function draftCampaignMessagesAction(formData: FormData) {
  await requireAuth();
  const campaignId = String(formData.get("campaignId") ?? "");
  if (!campaignId) return { error: "Campanha inválida" };

  const campaignLeads = await prisma.campaignLead.findMany({
    where: {
      campaignId,
      status: { in: ["PENDING", "MESSAGE_DRAFTED"] },
      lead: { optedOut: false },
    },
    include: {
      lead: {
        select: {
          id: true,
          instagramUsername: true,
        },
      },
    },
    take: 50,
  });

  let drafted = 0;
  let reused = 0;
  let failed = 0;

  for (const cl of campaignLeads) {
    try {
      const lead = await prisma.lead.findUnique({ where: { id: cl.leadId } });
      if (!lead?.optedOut) {
        const result = await outreachAgent.execute({ leadId: cl.leadId });
        if (result.success) {
          const existing = await prisma.contact.findFirst({
            where: {
              leadId: cl.leadId,
              status: "DRAFT",
            },
          });
          if (existing) {
            reused++;
          } else {
            await prisma.contact.create({
              data: {
                leadId: cl.leadId,
                channel: "message",
                message: (result.data as { body?: string })?.body ?? "",
                status: "DRAFT",
              },
            });
            drafted++;
          }
          await prisma.campaignLead.update({
            where: { id: cl.id },
            data: { status: "MESSAGE_DRAFTED" },
          });
        } else {
          failed++;
        }
      }
    } catch {
      failed++;
    }
  }

  await logEntry("Campaigns", `Rascunhos gerados: ${drafted} novos, ${reused} existentes, ${failed} falhas`, {
    metadata: { campaignId },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/messages");
  revalidatePath("/campaigns");
  return {
    success: true,
    drafted,
    reused,
    failed,
    error: failed > 0 ? `${failed} falha(s) ao gerar rascunhos` : null,
  };
}

export async function createCampaignAction(formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!name) return { error: "Nome da campanha é obrigatório" };

  const campaign = await prisma.campaign.create({
    data: { name, description, status: CAMPAIGN_STATUS.DRAFT },
  });
  await logEntry("Campaigns", `Campanha criada: ${campaign.name}`, {
    metadata: { campaignId: campaign.id },
  });
  revalidatePath("/campaigns");
  revalidatePath("/messages");
  return { success: true, id: campaign.id, error: null };
}

export async function updateCampaignAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "");
  if (!id || !name) return { error: "Dados inválidos" };

  await prisma.campaign.update({
    where: { id },
    data: {
      name,
      description,
      ...(status
        ? { status: status as typeof CAMPAIGN_STATUS[keyof typeof CAMPAIGN_STATUS] }
        : {}),
    },
  });
  revalidatePath("/campaigns");
  return { success: true, id, error: null };
}

export async function deleteCampaignAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "ID inválido" };

  await prisma.campaign.delete({ where: { id } });
  await logEntry("Campaigns", `Campanha excluída: ${id}`);
  revalidatePath("/campaigns");
  return { success: true, error: null };
}

export async function setCampaignStatusAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return { error: "Dados inválidos" };
  const valid = Object.values(CAMPAIGN_STATUS);
  if (!valid.includes(status as (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS])) {
    return { error: "Status inválido" };
  }
  await prisma.campaign.update({ where: { id }, data: { status } });
  revalidatePath("/campaigns");
  return { success: true, error: null };
}

export async function addLeadsToCampaign(formData: FormData) {
  await requireAuth();
  const campaignId = String(formData.get("campaignId") ?? "");
  const leadIds = String(formData.get("leadIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!campaignId || !leadIds.length) return { error: "Dados inválidos" };

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return { error: "Campanha não encontrada" };

  const existing = await prisma.campaignLead.findMany({
    where: { campaignId, leadId: { in: leadIds } },
    select: { leadId: true },
  });
  const existingSet = new Set(existing.map((e) => e.leadId));
  const toAdd = leadIds.filter((id) => !existingSet.has(id));

  if (toAdd.length) {
    await prisma.campaignLead.createMany({
      data: toAdd.map((leadId) => ({ campaignId, leadId, status: "PENDING" })),
    });
  }

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true, added: toAdd.length, skipped: leadIds.length - toAdd.length, error: null };
}

export async function removeLeadFromCampaign(formData: FormData) {
  await requireAuth();
  const campaignId = String(formData.get("campaignId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");
  if (!campaignId || !leadId) return { error: "Dados inválidos" };

  await prisma.campaignLead.deleteMany({ where: { campaignId, leadId } });
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  return { success: true, error: null };
}