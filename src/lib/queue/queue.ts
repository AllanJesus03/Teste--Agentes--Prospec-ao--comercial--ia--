import { prisma } from "@/lib/database/prisma";
import type { Job } from "@prisma/client";
import type { JobType, JobStatus } from "@/lib/constants";
import { JOB_STATUS } from "@/lib/constants";
import type { EnqueueOptions } from "@/types/job";

export const MAX_ATTEMPTS = 3;

export async function enqueue(
  type: JobType,
  options: EnqueueOptions = {}
) {
  return prisma.job.create({
    data: {
      type,
      leadId: options.leadId,
      status: JOB_STATUS.PENDING,
      priority: options.priority ?? 0,
      payload: options.payload !== undefined
        ? JSON.stringify(options.payload)
        : null,
      createdBy: options.createdBy ?? "system",
    },
  });
}

export async function claimNextJob(types?: string[]): Promise<Job | null> {
  const jobs = await prisma.job.findMany({
    where: {
      status: JOB_STATUS.PENDING,
      ...(types?.length ? { type: { in: types } } : {}),
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: 1,
  });
  if (!jobs.length) return null;

  const job = await prisma.job.findUnique({ where: { id: jobs[0].id } });
  if (!job) return null;

  return prisma.job.update({
    where: { id: job.id },
    data: {
      status: JOB_STATUS.RUNNING,
      attempts: { increment: 1 },
      startedAt: new Date(),
    },
  });
}

export async function completeJob(id: string, data?: unknown) {
  return prisma.job.update({
    where: { id },
    data: {
      status: JOB_STATUS.SUCCESS,
      finishedAt: new Date(),
      error: data ? JSON.stringify(data) : null,
    },
  });
}

export async function failJob(id: string, error: string, attempts?: number) {
  const current = attempts ?? (await prisma.job.findUnique({ where: { id } }))?.attempts ?? 1;
  const canRetry = current < MAX_ATTEMPTS;
  return prisma.job.update({
    where: { id },
    data: {
      status: canRetry ? JOB_STATUS.PENDING : JOB_STATUS.FAILED,
      finishedAt: canRetry ? null : new Date(),
      error: (error ?? "").slice(0, 2000),
    },
  });
}

export async function markJobFailed(id: string, error: string) {
  return prisma.job.update({
    where: { id },
    data: { status: JOB_STATUS.FAILED, finishedAt: new Date(), error: (error ?? "").slice(0, 2000) },
  });
}

export async function queueStats() {
  const groups = await prisma.job.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  return groups.reduce<Record<string, number>>((acc, g) => {
    acc[g.status] = g._count._all;
    return acc;
  }, {});
}

export async function jobStatsByType(type: string) {
  const groups = await prisma.job.groupBy({
    by: ["status"],
    where: { type },
    _count: { _all: true },
  });
  return groups.reduce<Record<string, number>>((acc, g) => {
    acc[g.status] = g._count._all;
    return acc;
  }, {});
}

export function parseJobPayload<T>(payload: string | null, fallback: T): T {
  if (!payload) return fallback;
  try {
    return JSON.parse(payload) as T;
  } catch {
    return fallback;
  }
}

export type { Job };
export type { JobType, JobStatus };