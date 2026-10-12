"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-debounce";

/** Open overlays, newest last — Escape only closes the top one (e.g. media library inside a form modal). */
const overlayStack: symbol[] = [];

/** Locks page scroll and closes on Escape while an overlay is open. */
function useOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const id = Symbol("overlay");
    overlayStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && overlayStack.at(-1) === id) onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      overlayStack.splice(overlayStack.indexOf(id), 1);
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
}

/** Centered dialog (bottom sheet on phones). */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const mounted = useMounted();
  useOverlay(open, onClose);
  if (!mounted || !open) return null;

  const width = { sm: "sm:max-w-sm", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" }[size];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-[var(--overlay)]" onClick={onClose} />
      <div
        className={cn(
          "relative flex max-h-[92vh] w-full animate-slide-up flex-col rounded-t-2xl bg-card shadow-2xl sm:rounded-xl",
          width,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
            <div>
              {title && <h2 className="text-lg font-semibold">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
            <button onClick={onClose} className="-mr-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Slide-in side panel (cart, mobile menu, filters). */
export function Sheet({
  open,
  onClose,
  side = "right",
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const mounted = useMounted();
  useOverlay(open, onClose);
  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade-in bg-[var(--overlay)]" onClick={onClose} />
      <aside
        className={cn(
          "absolute top-0 flex h-full w-[88%] max-w-md flex-col bg-card shadow-2xl",
          side === "right" ? "right-0 animate-slide-in-right" : "left-0 animate-slide-in-left",
          className,
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <div className="font-display text-base font-semibold">{title}</div>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t p-4">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}

/** Small "Are you sure?" dialog. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmText = "Delete",
  loading,
  tone = "danger",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: ReactNode;
  confirmText?: string;
  loading?: boolean;
  tone?: "danger" | "primary";
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="h-9 rounded-md border px-4 text-sm hover:bg-muted" onClick={onClose}>
            Cancel
          </button>
          <button
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-medium text-white disabled:opacity-60",
              tone === "danger" ? "bg-sale" : "bg-primary text-primary-foreground",
            )}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait…" : confirmText}
          </button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </Modal>
  );
}
