import "dotenv/config";
import { runOnce } from "@/workers/dispatcher";

interface Config {
  intervalMs: number;
  pollEveryMs: number;
  maxJobsPerCycle?: number;
}

function parseConfig(): Config {
  const arg = process.argv.slice(2).find((a) => a.startsWith("--interval="));
  const intervalMs = arg ? Number(arg.split("=")[1]) : 5000;
  return { intervalMs, pollEveryMs: 1000 };
}

async function main() {
  const { intervalMs, pollEveryMs } = parseConfig();
  console.log(`Worker iniciado. Intervalo: ${intervalMs}ms`);

  const shutdown = () => {
    console.log("Worker encerrado.");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  while (true) {
    try {
      const processed = await runOnce(intervalMs);
      if (processed > 0) {
        console.log(`[worker] ${new Date().toISOString()} - ${processed} job(s) processado(s)`);
      }
    } catch (err) {
      console.error(`[worker] erro no ciclo: ${err instanceof Error ? err.message : err}`);
    }
    await new Promise((r) => setTimeout(r, pollEveryMs));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});