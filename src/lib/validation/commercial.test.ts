import { describe, it, expect } from "vitest";
import {
  detectCommercialSignals,
  isLikelyNonCommercial,
} from "@/lib/validation/commercial";

describe("detectCommercialSignals", () => {
  it("detecta sinais em uma bio comercial", () => {
    const { signals, score } = detectCommercialSignals(
      "Loja de calçados. Vendas pelo WhatsApp e envio para todo o Brasil. Frete grátis acima de R$200."
    );
    expect(score).toBeGreaterThanOrEqual(30);
    expect(signals.map((s) => s.signal)).toEqual(
      expect.arrayContaining(["Vende produtos", "WhatsApp comercial", "Delivery/entrega"])
    );
  });

  it("não encontra sinais em bio pessoal vazia", () => {
    const { signals, score } = detectCommercialSignals("Só fotos da minha família");
    expect(score).toBe(0);
    expect(signals).toHaveLength(0);
  });

  it("retorna score vazio para bio nula", () => {
    expect(detectCommercialSignals(null).score).toBe(0);
    expect(detectCommercialSignals(undefined).signals).toEqual([]);
  });

  it("limita score a 100", () => {
    const { score } = detectCommercialSignals(
      "Vendo produtos, presto serviços, peço pedidos, envio delivery, tem promoção e desconto, agende no WhatsApp, chama no zap, link na bio, contato por direct, comprar direto pelo site www.loja.com.br"
    );
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("isLikelyNonCommercial", () => {
  it("identifica perfil pessoal", () => {
    expect(isLikelyNonCommercial("Blog pessoal de fotografia")).toBe(true);
  });

  it("não identifica perfil comercial como pessoal", () => {
    expect(isLikelyNonCommercial("Loja com delivery")).toBe(false);
  });
});