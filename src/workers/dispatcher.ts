import { prisma } from "@/lib/database/prisma";
import {
  claimNextJob,
  completeJob,
  failJob,
  markJobFailed,
  parseJobPayload,
} from "@/lib/queue/queue";
import type { Job } from "@/lib/queue/queue";
import { JOB_TYPE } from "@/lib/constants";
import { OrchestratorAgent } from "@/agents/orchestrator-agent";
import { CommercialAgent } from "@/agents/commercial-agent";
import { WebsiteAgent } from "@/agents/website-agent";
import { SalesAgent } from "@/agents/sales-agent";
import { OutreachAgent } from "@/agents/outreach-agent";
import { logEntry } from "@/lib/database/log";

const orchestrator = new OrchestratorAgent();
const commercial = new CommercialAgent();
const website = new WebsiteAgent();
const sales = new SalesAgent();
const outreach = new OutreachAgent();

async function dispatch(job: Job): Promise<boolean> {
  switch (job.type) {
    case JOB_TYPE.DISCOVERY: {
      const payload = parseJobPayload<Record<string, unknown>>(job.payload, {});
      const result = await orchestrator.execute({
        input: { action: "discover", discover: payload },
      });
      return result.success;
    }
    case JOB_TYPE.REANALYZE:
    case JOB_TYPE.ANALYSIS: {
      if (!job.leadId) throw new Error("Job ANALYSIS sem leadId");
      const result = await orchestrator.analyzeLead(job.leadId);
      return result.success;
    }
    case JOB_TYPE.WEBSITE: {
      if (!job.leadId) throw new Error("Job WEBSITE sem leadId");
      return (await website.execute({ leadId: job.leadId })).success;
    }
    case JOB_TYPE.AI: {
      if (!job.leadId) throw new Error("Job AI sem leadId");
      return (await sales.execute({ leadId: job.leadId })).success;
    }
    case JOB_TYPE.OUTREACH: {
      if (!job.leadId) throw new Error("Job OUTREACH sem leadId");
      const result = await outreach.execute({ leadId: job.leadId });
      return result.success;
    }
    default:
      return (await commercial.execute({ leadId: job.leadId ?? undefined })).success;
  }
}

export async function processOneJob(): Promise<number> {
  const job = await claimNextJob();
  if (!job) return 0;

  try {
    const ok = await dispatch(job);
    if (ok) {
      await completeJob(job.id);
      return 1;
    }
    await markJobFailed(job.id, "Agente retornou success=false");
    return 1;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await failJob(job.id, message);
    await logEntry("Worker", `Job ${job.type} falhou: ${message}`, {
      level: "ERROR",
      leadId: job.leadId ?? undefined,
    });
    return 1;
  }
}

export async function runOnce(timeoutMs = 15000): Promise<number> {
  const deadline = Date.now() + timeoutMs;
  let processed = 0;
  while (Date.now() < deadline) {
    const done = await processOneJob();
    if (done === 0) {
      await sleep(1000);
    } else {
      processed += done;
    }
  }
  return processed;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export { prisma };