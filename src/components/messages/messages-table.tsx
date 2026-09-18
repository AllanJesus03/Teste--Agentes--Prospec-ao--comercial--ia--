"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, ThumbsUp, Send, Reply } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { MESSAGE_STATUS } from "@/lib/constants";
import type { Contact, Lead } from "@prisma/client";
import {
  updateMessageStatusAction,
  markRepliedAction,
} from "@/lib/actions/messages";

type ContactWithLead = Contact & { lead: Pick<Lead, "id" | "instagramUsername" | "businessName" | "city" | "state"> };

interface MessagesTableProps {
  contacts: ContactWithLead[];
}

export function MessagesTable({ contacts }: MessagesTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const advance = async (id: string, status: string) => {
    setPendingId(id);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", status);
    const result = await updateMessageStatusAction(fd);
    setPendingId(null);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Status atualizado");
      router.refresh();
    }
  };

  const markReplied = async (id: string) => {
    setPendingId(id);
    const fd = new FormData();
    fd.set("id", id);
    const result = await markRepliedAction(fd);
    setPendingId(null);
    if (result?.error) toast.error(result.error);
    else {
      toast.success("Marcada como respondida");
      router.refresh();
    }
  };

  if (contacts.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nenhuma mensagem nesta lista ainda.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {contacts.map((contact) => (
        <div key={contact.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="grid gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/leads/${contact.lead.id}`}
                className="font-medium hover:underline"
              >
                {contact.lead.businessName ?? `@${contact.lead.instagramUsername}`}
              </Link>
              <StatusBadge value={contact.status} kind="messageStatus" />
              <span className="text-xs text-muted-foreground">
                {contact.lead.city ?? "—"}{contact.lead.state ? `/${contact.lead.state}` : ""} · {formatDate(contact.updatedAt)}
              </span>
            </div>
            <p className="line-clamp-2 max-w-3xl text-sm text-muted-foreground">
              {contact.message}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Card className="w-full border-transparent sm:w-auto">
              <CardContent className="flex flex-wrap items-center gap-2 p-1">
                {contact.status === MESSAGE_STATUS.DRAFT ? (
                  <Button size="sm" disabled={pendingId === contact.id} onClick={() => advance(contact.id, MESSAGE_STATUS.PENDING_REVIEW)}>
                    <Eye className="mr-1 h-4 w-4" /> Revisar
                  </Button>
                ) : null}
                {contact.status === MESSAGE_STATUS.PENDING_REVIEW ? (
                  <Button size="sm" disabled={pendingId === contact.id} onClick={() => advance(contact.id, MESSAGE_STATUS.APPROVED)}>
                    <ThumbsUp className="mr-1 h-4 w-4" /> Aprovar
                  </Button>
                ) : null}
                {contact.status === MESSAGE_STATUS.APPROVED ? (
                  <Button size="sm" variant="secondary" disabled={pendingId === contact.id} onClick={() => advance(contact.id, MESSAGE_STATUS.SENT)}>
                    <Send className="mr-1 h-4 w-4" /> Enviar
                  </Button>
                ) : null}
                {contact.status === MESSAGE_STATUS.SENT ? (
                  <Button size="sm" variant="outline" disabled={pendingId === contact.id} onClick={() => markReplied(contact.id)}>
                    <Reply className="mr-1 h-4 w-4" /> Resposta
                  </Button>
                ) : null}
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/leads/${contact.lead.id}`}>Abrir lead</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}