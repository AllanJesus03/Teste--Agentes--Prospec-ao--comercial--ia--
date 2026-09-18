# LeadScout — Prospecção Comercial por Inteligência Artificial

Sistema de prospecção B2C alimentado por agentes de IA: descobre leads comerciais pelo Instagram em uma região, valida e qualifica cada um, monta a base de contato, gera propostas personalizadas e acompanha campanhas — sempre respeitando as regras das plataformas e o opt-out dos contatos.

## Stack

- **Next.js 16** (App Router, Turbopack) · React 19 · TypeScript strict
- **Prisma 6.19.3** com SQLite (dev) ou PostgreSQL (produção)
- **Auth.js (NextAuth v5)** — credenciais (bcrypt)
- **shadcn/ui + Tailwind CSS v4** — interface em pt-BR
- **Zod** — validação de entrada · **Recharts** — analytics · **xlsx** — exportação
- **Queue** própria em banco + worker (`src/workers/runner.ts`) para jobs de IA
- **Vitest** — testes unitários (links, comerciais, templates, website analyzer)

## Estrutura

```text
src/
├─ app/
│  ├─ (app)/                 # autenticado (dashboard, leads, messages, campaigns,
│  │                          #  templates, analytics, pipeline, logs, settings)
│  ├─ api/leads/export       # export CSV / XLSX / JSON
│  └─ login/
├─ agents/                   # agentes de IA (discovery, commercial, website,
│  │                          #  qualification, sales, outreach, orchestrator)
├─ lib/
│  ├─ actions/               # server actions das páginas
│  ├─ database/              # prisma + queries (stats, settings, log)
│  ├─ ai/                    # AIProvider (mock + OpenAI-compatível)
│  ├─ validation/            # links, comercial, duplicidade
│  ├─ website/               # WebsiteAnalyzer
│  └─ outreach/              # templates de mensagens
├─ workers/runner.ts         # processa a fila de jobs (npm run worker)
├─ proxy.ts                  # proteção de rotas autenticadas (Next 16 proxy)
└─ auth.ts                   # configuração do Auth.js
prisma/
├─ schema.prisma             # SQLite
├─ schema.postgres.prisma    # PostgreSQL (produção)
└─ seed.ts                   # admin + templates + 54 leads demonstrativos
```

## Começando

Requisitos: Node 20+ e npm.

```bash
npm install
cp .env.example .env        # edite AUTH_SECRET, DATABASE_URL, MOCK_MODE
npm run db:push             # cria o banco (SQLite em dev)
npm run db:seed             # admin@leadscout.local / admin123 + dados demo
npm run dev                 # http://localhost:3000
```

Em outro terminal, o worker da fila de IA:

```bash
npm run worker
```

O modo **mock** (`MOCK_MODE=true`) não faz nenhuma chamada externa real: o Discovery gera
perfis simulados e a análise de sites usa heurísticas locais. Para integrar provedores reais,
desligue o mock e configure o provedor OpenAI-compatível no `.env` (`AI_PROVIDER`, `AI_BASE_URL`,
`AI_API_KEY`, `AI_MODEL`) — as integrações seguem estritamente as regras das plataformas
(§4: sem bypass de login/CAPTCHA/rate-limit, sem enviar mensagens sem revisão humana).

## Fluxo de trabalho típico

1. **Discovery** — Escolha região/categorias e rode o Discovery (manual com CSV/sincronizado, ou
   enfileirado). Leads entram como `NEW`; o Commercial Agent sinaliza se é negócio real.
2. **Validação** — WebsiteAnalyzer classifica o perfil (`HAS_WEBSITE`, `HAS_ECOMMERCE`,
   `HAS_LANDING_PAGE`, `HAS_LINK_HUB`, `HAS_WHATSAPP_ONLY`, `HAS_SOCIAL_ONLY`,
   `NO_EXTERNAL_LINK`). Duplicidade é checada por username, telefone, e-mail, domínio ou
   nome+cidade.
3. **Qualificação** — O Qualification Agent (score 0–100) decide se vale contato. Aprovados
   viram `QUALIFIED`.
4. **Mensagens** — Template → rascunho por lead (variáveis resolvidas) → revisão humana →
   status `SENT`/`DELIVERED`/`REPLIED`/`FAILED`. Contatos que pedem para sair ficam
   `OPTED_OUT` e são bloqueados de qualquer automação.
5. **Pipeline & campanhas** — Regue o funil (Kanban), agrupe leads em campanhas e gere
   rascunhos em massa.

## Scripts

| Comando | Ação |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm start` | build de produção / servidor |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit) |
| `npm run worker` | worker da fila de jobs |
| `npm run db:seed` | seed demonstrativo (idempotente) |

## Migração SQLite → PostgreSQL (produção)

1. Configure `DATABASE_URL` com o Postgres no `.env`.
2. Crie as tabelas e gere o cliente:

```bash
npx prisma migrate deploy --schema prisma/schema.postgres.prisma
npx prisma generate --schema prisma/schema.postgres.prisma
```

3. Seque os dados se desejado (`npm run db:seed` aponta para a URL do `.env`).
4. Rode a aplicação e o worker normalmente.

## Docker

```bash
cp .env.example .env        # ajuste secrets
docker compose up -d --build
```

Levanta Postgres 16 + aplicação (porta 3000) + worker. O worker roda as migrações
(`migrate deploy`) e processa a fila. Para prod, ajuste `AUTH_SECRET`, `MOCK_MODE` e
acredenciais do Postgres.

## Notas de compliance (§4 da spec de requisitos)

- Sem autenticação/CAPTCHA/rate-limit contornados em qualquer plataforma.
- Coleta respeitando termos das plataformas e LGPD; só dados públicos/informados pelo usuário.
- Envio de mensagens exige revisão humana e respeito absoluto ao opt-out.
- Em caso de dúvida, agentes marcam o dado como `UNAVAILABLE` em vez de inventar.

## Testes

Cobrem: extração/classificação de links, sinais comerciais, templates/variáveis/opt-out e o
`WebsiteAnalyzer.classify`. Rode com `npm test`.