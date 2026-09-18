import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TemplateEditorDialog } from "@/components/templates/template-editor-dialog";
import { DeleteTemplateButton } from "@/components/templates/delete-template-button";
import { safeJsonParse } from "@/lib/utils/format";
import type { Template } from "@prisma/client";

export function TemplateCard({
  template,
  categoryLabel,
}: {
  template: Template;
  categoryLabel: string;
}) {
  const variables = safeJsonParse<string[]>(template.variables, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium leading-tight">{template.name}</p>
            <Badge variant="secondary" className="mt-1">
              {categoryLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <TemplateEditorDialog
              existing={{
                id: template.id,
                name: template.name,
                description: template.description,
                category: template.category,
                body: template.body,
              }}
            />
            <DeleteTemplateButton id={template.id} />
          </div>
        </div>
        {template.description ? (
          <p className="text-sm text-muted-foreground">{template.description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-2">
        <div className="rounded-md border bg-muted/30 p-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {template.body}
          </p>
        </div>
        {variables.length ? (
          <div className="flex flex-wrap gap-1">
            {variables.map((v) => (
              <Badge key={v} variant="outline" className="text-[11px]">
                {`{{${v}}}`}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}