import { prisma } from "@/lib/database/prisma";
import { TemplateEditorDialog } from "@/components/templates/template-editor-dialog";
import { TemplateCard } from "@/components/templates/template-card";
import { TEMPLATE_CATEGORY_LABELS } from "@/lib/constants";

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Templates de mensagem</h1>
          <p className="text-sm text-muted-foreground">
            {templates.length} template(s) · use variáveis no formato {"{{var}}"}
          </p>
        </div>
        <TemplateEditorDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            categoryLabel={TEMPLATE_CATEGORY_LABELS[template.category] ?? template.category}
          />
        ))}
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          Nenhum template criado.
        </div>
      ) : null}
    </div>
  );
}