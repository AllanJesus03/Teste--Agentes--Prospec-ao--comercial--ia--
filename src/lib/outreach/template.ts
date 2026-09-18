import { TEMPLATE_VARIABLES } from "@/lib/constants";

const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export interface TemplateRenderInput {
  body: string;
  variables: Record<string, string>;
}

export interface TemplateRenderResult {
  body: string;
  missing: string[];
  unknown: string[];
}

export function extractVariables(template: string): string[] {
  const result: string[] = [];
  const re = new RegExp(VARIABLE_PATTERN.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) {
    result.push(m[1]);
  }
  return [...new Set(result)];
}

export function renderTemplate(input: TemplateRenderInput): TemplateRenderResult {
  const { body, variables } = input;

  if (body.trim().length === 0) {
    return { body: "", missing: [], unknown: [] };
  }

  const declared = extractVariables(body);
  const missing = declared.filter(
    (v) => variables[v] === undefined || variables[v] === null
  );
  const unknown = declared.filter((v) => !TEMPLATE_VARIABLES.includes(v as never));

  let rendered = body;
  for (const key of Object.keys(variables)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
    rendered = rendered.replace(pattern, (match) => {
      if (missing.includes(key)) return match;
      return variables[key];
    });
  }

  return { body: rendered, missing, unknown };
}

export function isMessageOptOutSafe(context: { optedOut?: boolean; status?: string }): boolean {
  return !context.optedOut && context.status !== "OPTED_OUT";
}