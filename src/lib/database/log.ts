import { prisma } from "@/lib/database/prisma";
import type { LogLevel } from "@/lib/constants";

export type { LogLevel };

function serializeMetadata(metadata?: unknown): string | undefined {
  if (metadata === undefined || metadata === null) return undefined;
  if (typeof metadata === "string") return metadata;
  try {
    return JSON.stringify(metadata);
  } catch {
    return String(metadata);
  }
}

export async function logEntry(
  agent: string,
  message: string,
  options: {
    level?: LogLevel;
    leadId?: string;
    metadata?: unknown;
  } = {}
) {
  try {
    await prisma.logEntry.create({
      data: {
        agent,
        level: options.level ?? "INFO",
        message,
        leadId: options.leadId,
        metadata: serializeMetadata(options.metadata),
      },
    });
  } catch {
    // Logging must never break the main flow.
  }
}

export async function clearLogs() {
  await prisma.logEntry.deleteMany({});
}