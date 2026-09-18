import type { Agent, AgentContext, AgentResult } from "@/types/agent";
import { logEntry, type LogLevel } from "@/lib/database/log";

export abstract class BaseAgent implements Agent {
  abstract name: string;

  async execute(context: AgentContext): Promise<AgentResult> {
    const startedAt = Date.now();
    try {
      this.log("INFO", `Iniciando execução`, context.leadId);
      const result = await this.run(context);
      this.log(
        result.success ? "INFO" : "ERROR",
        result.success
          ? `Execução concluída em ${Date.now() - startedAt}ms`
          : `Execução falhou: ${result.errors?.join("; ") ?? "erro desconhecido"}`,
        context.leadId
      );
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.log("ERROR", `Erro não tratado: ${message}`, context.leadId);
      return {
        success: false,
        errors: [message],
      };
    }
  }

  protected abstract run(context: AgentContext): Promise<AgentResult>;

  protected log(
    level: LogLevel,
    message: string,
    leadId?: string,
    metadata?: unknown
  ) {
    void logEntry(this.name, message, { level, leadId, metadata });
  }

  protected ok(data?: unknown, warnings?: string[]): AgentResult {
    return { success: true, data, warnings };
  }
}