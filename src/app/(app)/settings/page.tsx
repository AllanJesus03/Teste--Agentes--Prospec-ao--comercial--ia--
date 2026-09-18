import { prisma } from "@/lib/database/prisma";
import { config } from "@/lib/config";
import { getCategories } from "@/lib/database/settings";
import { CategoryManager } from "@/components/settings/category-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { formatCompact } from "@/lib/utils/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const categories = await getCategories();
  const [leadsCount, contactsCount, jobsCount, logsCount, usersCount] = await Promise.all([
    prisma.lead.count(),
    prisma.contact.count(),
    prisma.job.count(),
    prisma.logEntry.count(),
    prisma.user.count(),
  ]);

  const pendingJobs = await prisma.job.count({ where: { status: "PENDING" } });
  const failedJobs = await prisma.job.count({ where: { status: "FAILED" } });

  const provider = config.ai.provider;
  const isMock = config.mockMode;

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Preferências, categorias e saúde do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modo de operação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant={isMock ? "secondary" : "default"}>
              {isMock ? "DEMONSTRATIVO (mock)" : "AO VIVO"}
            </Badge>
            {isMock ? (
              <span className="text-muted-foreground">
                Dados simulados, sem integrações externas. Mude MOCK_MODE=false no .env para
                integrar provedores reais.
              </span>
            ) : (
              <span className="text-muted-foreground">
                Integrações reais: exigem chaves nas APIs autorizadas e seguem as regras das
                plataformas.
              </span>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Item k="Provider de IA" v={provider} />
            <Item k="Modelo" v={config.ai.model} />
            <Item k="URL do app" v={config.appUrl} />
            <Item k="Banco (DATABASE_URL)" v={config.databaseUrl ? "definido" : "vazio"} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorias de negócio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <CategoryManager categories={categories} />
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Categorias padrão
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_CATEGORIES.map((c) => (
                <Badge key={c} variant="outline">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saúde do sistema</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <Item k="Leads" v={formatCompact(leadsCount)} />
            <Item k="Mensagens" v={formatCompact(contactsCount)} />
            <Item k="Jobs na fila" v={formatCompact(jobsCount)} />
            <Item k="Jobs pendentes" v={formatCompact(pendingJobs)} />
            <Item k="Jobs com falha" v={formatCompact(failedJobs)} />
            <Item k="Logs" v={formatCompact(logsCount)} />
            <Item k="Usuários" v={formatCompact(usersCount)} />
          </dl>

          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Worker (fila de jobs)</p>
            <p className="text-muted-foreground">
              {jobsCount > 0 ? (
                <>
                  Há jobs na fila. A fila é processada pelo worker (
                  <code className="rounded bg-muted px-1">npm run worker</code>) ou
                  na própria UI quando a execução é síncrona.
                </>
              ) : (
                "Nenhum job pendente no momento."
              )}{" "}
              Máximo de 3 tentativas por job.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/logs" className="text-sm font-medium text-primary hover:underline">
              Ver logs do sistema →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="truncate font-medium tabular-nums">{v}</dd>
    </div>
  );
}