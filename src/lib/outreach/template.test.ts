import { describe, it, expect } from "vitest";
import {
  extractVariables,
  renderTemplate,
  isMessageOptOutSafe,
} from "@/lib/outreach/template";

describe("extractVariables", () => {
  it("extrai variáveis únicas", () => {
    expect(extractVariables("Olá {{business_name}}, de {{city}} e {{city}}")).toEqual([
      "business_name",
      "city",
    ]);
  });

  it("retorna vazio sem variáveis", () => {
    expect(extractVariables("Olá! Tudo bem?")).toEqual([]);
  });
});

describe("renderTemplate", () => {
  it("substitui variáveis conhecidas", () => {
    const result = renderTemplate({
      body: "Olá {{business_name}} em {{city}}!",
      variables: { business_name: "Loja X", city: "Curitiba" },
    });
    expect(result.body).toBe("Olá Loja X em Curitiba!");
    expect(result.missing).toEqual([]);
  });

  it("lista variáveis ausentes", () => {
    const result = renderTemplate({
      body: "Olá {{business_name}}!",
      variables: { city: "Curitiba" },
    });
    expect(result.missing).toContain("business_name");
    expect(result.body).toContain("{{business_name}}");
  });

  it("lista variáveis desconhecidas", () => {
    const result = renderTemplate({
      body: "Olá {{business_name}} {{telefone_movel}}",
      variables: { business_name: "Loja X", telefone_movel: "11" },
    });
    expect(result.unknown).toContain("telefone_movel");
  });

  it("corpo vazio retorna vazio", () => {
    expect(renderTemplate({ body: "", variables: {} }).body).toBe("");
  });
});

describe("isMessageOptOutSafe", () => {
  it("bloqueia quando opt-out ou status OPTED_OUT", () => {
    expect(isMessageOptOutSafe({ optedOut: true })).toBe(false);
    expect(isMessageOptOutSafe({ status: "OPTED_OUT" })).toBe(false);
  });
  it("libera contatos normais", () => {
    expect(isMessageOptOutSafe({ optedOut: false, status: "CONTACTED" })).toBe(true);
  });
});