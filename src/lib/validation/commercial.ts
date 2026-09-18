import type { CommercialSignal } from "@/types/lead";

const SIGNAL_RULES: Array<{ signal: string; pattern: RegExp; weight: number }> = [
  { signal: "Vende produtos", pattern: /vendo|vendemos|revenda|produtos|loja|catálogo|catalogo/i, weight: 15 },
  { signal: "Presta serviços", pattern: /serviços|servicos|atendemos|oferecemos|prestamos|agende|agenda/i, weight: 15 },
  { signal: "Preço/orçamento", pattern: /a partir de|preços|precos|valores|orçamento|orcamento|sob consulta|condições|condicoes/i, weight: 12 },
  { signal: "Pedidos", pattern: /pedidos|faça seu pedido|faca seu pedido|pedido/i, weight: 12 },
  { signal: "Delivery/entrega", pattern: /delivery|entrega|enviamos para todo|envio para todo|frete/i, weight: 10 },
  { signal: "WhatsApp comercial", pattern: /whatsapp|wa\.me|chama no zap|chame no zap|vem no zap|zap/i, weight: 10 },
  { signal: "Agendamento", pattern: /agende|agendar|horários|horarios|marcar consulta|reservas?/i, weight: 8 },
  { signal: "Localização comercial", pattern: /rua |avenida|av\. |endereço|endereco|estamos em|localizada|localizado/i, weight: 6 },
  { signal: "Evento/promoção", pattern: /promo|promoção|promocao|sorteio|desconto|black friday|cupom/i, weight: 8 },
  { signal: "Link na bio", pattern: /link na bio|link em destaque|clique no link|link aqu/i, weight: 6 },
  { signal: "Contato direto", pattern: /contato|atendimento|dm aberta|direct|mensagem diret/i, weight: 6 },
  { signal: "Compras/compra", pattern: /comprar|compre|compra/i, weight: 8 },
  { signal: "Catálogo digital", pattern: /catálogo|catalogo|cardápio|cardapio|menu/i, weight: 8 },
  { signal: "Site próprio", pattern: /nossa loja|nosso site|site oficial|www\.|\.com\.br|\.com/i, weight: 6 },
];

export function detectCommercialSignals(bio: string | null | undefined): {
  signals: CommercialSignal[];
  score: number;
} {
  const text = bio ?? "";
  const signals: CommercialSignal[] = [];
  let score = 0;

  for (const rule of SIGNAL_RULES) {
    if (rule.pattern.test(text)) {
      signals.push({ signal: rule.signal, found: true });
      score += rule.weight;
    }
  }

  return { signals, score: Math.min(100, score) };
}

const NON_COMMERCIAL_BIO_PATTERN = /fotógrafo amador|página pessoal|blog pessoal/i;

export function isLikelyNonCommercial(bio: string | null | undefined): boolean {
  return NON_COMMERCIAL_BIO_PATTERN.test(bio ?? "");
}