"use client";

import { Mail, MailOpen, Phone, Trash2 } from "lucide-react";
import { WhatsappIcon } from "@/components/shared/social-icons";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/overlay";
import { formatDateTime } from "@/lib/utils";
import type { ContactMessage } from "@/types/admin-operations";
import { whatsappLink } from "./helpers";

/** Full contact message with reply shortcuts (email, call, WhatsApp). */
export function MessageModal({
  message,
  onClose,
  onMarkUnread,
  onDelete,
}: {
  message: ContactMessage | null;
  onClose: () => void;
  onMarkUnread: (m: ContactMessage) => void;
  onDelete: (m: ContactMessage) => void;
}) {
  const m = message;
  const subject = `Re: ${m?.subject || "Your message"}`;
  const wa = whatsappLink(m?.phone, m ? `Hi ${m.name}, thanks for contacting us.` : undefined);
  const linkClass = "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition hover:bg-muted";

  return (
    <Modal
      open={!!m}
      onClose={onClose}
      title={m?.subject || "Message"}
      description={m ? `From ${m.name} · ${formatDateTime(m.createdAt)}` : undefined}
      footer={
        m && (
          <>
            <Button variant="ghost" className="mr-auto" onClick={() => onDelete(m)}>
              <Trash2 className="size-4 text-sale" /> Delete
            </Button>
            <Button variant="outline" onClick={() => onMarkUnread(m)}>
              <MailOpen className="size-4" /> Mark unread
            </Button>
            <Button onClick={onClose}>Done</Button>
          </>
        )
      }
    >
      {m && (
        <div className="space-y-4">
          <p className="text-sm leading-relaxed whitespace-pre-line">{m.message}</p>
          <div className="rounded-lg bg-muted/60 p-3 text-sm">
            <p className="font-medium">{m.name}</p>
            {m.email && <p className="break-all text-muted-foreground">{m.email}</p>}
            {m.phone && <p className="text-muted-foreground">{m.phone}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {m.email && (
              <a className={linkClass} href={`mailto:${m.email}?subject=${encodeURIComponent(subject)}`}>
                <Mail className="size-4" /> Reply by email
              </a>
            )}
            {m.phone && (
              <a className={linkClass} href={`tel:${m.phone}`}>
                <Phone className="size-4" /> Call
              </a>
            )}
            {wa && (
              <a className={linkClass} href={wa} target="_blank" rel="noreferrer">
                <WhatsappIcon className="size-4 text-success" /> WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
