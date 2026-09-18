"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Send,
  Eye,
  ThumbsUp,
  Reply,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { MESSAGE_STATUS } from "@/lib/constants";
import {
  updateMessageStatusAction,
  deleteMessageAction,
  markRepliedAction,
} from "@/lib/actions/messages";
import type { Contact } from "@prisma/client";

export function ContactCard({ contact, channelLabel }: { contact: Contact; channelLabel: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const copyBody = async () => {
    await navigator.clipboard.writeText(contact.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const run = async (status: string) => {
    const fd = new FormData();
    fd.set("id", contact.id);
    fd.set("status", status);
    const result = await updateMessageStatusAction(fd);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Status atualizado");
      router.refresh();
    }
  };

  const remove = async () => {
    const fd = new FormData();
    fd.set("id", contact.id);
    const result = await deleteMessageAction(fd);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Mensagem excluída");
      router.refresh();
    }
  };

  const markReplied = async () => {
    const fd = new FormData();
    fd.set("id", contact.id);
    const result = await markRepliedAction(fd);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Marcada como respondida");
      router.refresh();
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">
            {channelLabel}
          </CardTitle>
          <StatusBadge value={contact.status} kind="messageStatus" />
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {formatDate(contact.createdAt)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border bg-muted/30 p-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{contact.message}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyBody}>
            {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            {copied ? "Copiado" : "Copiar"}
          </Button>

          {contact.status === MESSAGE_STATUS.DRAFT ? (
            <Button size="sm" onClick={() => run(MESSAGE_STATUS.PENDING_REVIEW)}>
              <Eye className="mr-1 h-4 w-4" /> Submeter revisão
            </Button>
          ) : null}

          {contact.status === MESSAGE_STATUS.PENDING_REVIEW ? (
            <Button size="sm" onClick={() => run(MESSAGE_STATUS.APPROVED)}>
              <ThumbsUp className="mr-1 h-4 w-4" /> Aprovar
            </Button>
          ) : null}

          {contact.status === MESSAGE_STATUS.APPROVED ? (
            <Button size="sm" variant="secondary" onClick={() => run(MESSAGE_STATUS.SENT)}>
              <Send className="mr-1 h-4 w-4" /> Enviar
            </Button>
          ) : null}

          {contact.status === MESSAGE_STATUS.SENT ? (
            <Button size="sm" variant="outline" onClick={markReplied}>
              <Reply className="mr-1 h-4 w-4" /> Marcar resposta
            </Button>
          ) : null}

          {!(
            [
              MESSAGE_STATUS.SENT,
              MESSAGE_STATUS.REPLIED,
              MESSAGE_STATUS.OPTED_OUT,
            ] as string[]
          ).includes(contact.status) ? (
            <Button variant="ghost" size="sm" className="text-red-600" onClick={remove}>
              <Trash2 className="mr-1 h-4 w-4" /> Excluir
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}