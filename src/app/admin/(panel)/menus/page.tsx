"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, CornerDownRight, ExternalLink, FolderTree, ImageOff, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { MenuForm, type MenuEditorTarget } from "@/components/admin/catalog/menu-form";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, Skeleton } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/overlay";
import { api, errorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type { AdminMenu } from "@/types/admin-catalog";

/**
 * Menus & categories — an unlimited-depth tree. Each menu can be a collection
 * (own page with products) or a plain link, and can show in the header, footer
 * and on the home page. Order is changed with the up/down arrows.
 */
export default function MenusPage() {
  const { data: tree, isLoading, mutate } = useSWR<AdminMenu[]>("/admin/menus");
  const [editor, setEditor] = useState<MenuEditorTarget | null>(null);
  const [deleting, setDeleting] = useState<AdminMenu | null>(null);
  const [busy, setBusy] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);

  /** Swaps a menu with its neighbour and saves the new order for all its siblings. */
  const move = async (siblings: AdminMenu[], index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= siblings.length) return;
    const order = [...siblings];
    [order[index], order[target]] = [order[target], order[index]];
    setMoving(siblings[index].id);
    try {
      const next = await api.post<AdminMenu[]>("/admin/menus/reorder", {
        items: order.map((m, i) => ({ id: m.id, parentId: m.parentId, sortOrder: i })),
      });
      await mutate(next, { revalidate: false });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setMoving(null);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.delete(`/admin/menus/${deleting.id}`);
      toast.success("Menu deleted");
      setDeleting(null);
      mutate();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const renderLevel = (menus: AdminMenu[], depth: number) =>
    menus.map((menu, index) => (
      <li key={menu.id}>
        <MenuRow
          menu={menu}
          depth={depth}
          isFirst={index === 0}
          isLast={index === menus.length - 1}
          moving={moving === menu.id}
          onMove={(delta) => move(menus, index, delta)}
          onAddChild={() => setEditor({ parentId: menu.id })}
          onEdit={() => setEditor({ menu })}
          onDelete={() => setDeleting(menu)}
        />
        {menu.children.length > 0 && <ul className="divide-y border-t">{renderLevel(menu.children, depth + 1)}</ul>}
      </li>
    ));

  return (
    <>
      <PageHeader
        title="Menus & categories"
        description="Build the store navigation. Sub-menus can go as deep as you like, and a product can belong to many menus."
        actions={
          <Button onClick={() => setEditor({ parentId: null })}>
            <Plus className="size-4" /> New menu
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border bg-card">
        {isLoading && !tree ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : tree?.length ? (
          <ul className="divide-y">{renderLevel(tree, 0)}</ul>
        ) : (
          <EmptyState
            icon={<FolderTree className="size-6" />}
            title="No menus yet"
            description="Start with top-level menus like Men, Women or T-Shirts, then add sub-menus such as Graphic Tees."
            action={<Button onClick={() => setEditor({ parentId: null })}>Create menu</Button>}
          />
        )}
      </div>

      <MenuForm
        target={editor}
        tree={tree ?? []}
        onClose={() => setEditor(null)}
        onSaved={() => {
          setEditor(null);
          mutate();
        }}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title={`Delete ${deleting?.name}?`}
        message={
          <>
            {deleting?.children.length ? `Its ${deleting.children.length} sub-menu(s) will move up one level. ` : ""}
            Products are not deleted — they are only removed from this menu.
          </>
        }
      />
    </>
  );
}

function MenuRow({
  menu,
  depth,
  isFirst,
  isLast,
  moving,
  onMove,
  onAddChild,
  onEdit,
  onDelete,
}: {
  menu: AdminMenu;
  depth: number;
  isFirst: boolean;
  isLast: boolean;
  moving: boolean;
  onMove: (delta: -1 | 1) => void;
  onAddChild: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const href = menu.type === "LINK" ? menu.url : `/collections/${menu.slug}`;
  const flags = [
    menu.showInHeader && "Header",
    menu.showInFooter && "Footer",
    menu.showOnHome && "Home tile",
    menu.homeSection && "Home section",
  ].filter((f): f is string => !!f);

  return (
    <div
      className={cn("flex flex-col gap-3 py-3 pr-3 sm:flex-row sm:items-center sm:pr-4", depth > 0 && "bg-muted/20", !menu.isActive && "opacity-60")}
      style={{ paddingLeft: 16 + depth * 24 }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {depth > 0 && <CornerDownRight className="size-4 shrink-0 text-muted-foreground" />}
        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
          {menu.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={menu.image} alt="" className="size-full object-cover" loading="lazy" />
          ) : menu.type === "LINK" ? (
            <Link2 className="size-4 text-muted-foreground" />
          ) : (
            <ImageOff className="size-4 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            <button type="button" onClick={onEdit} className="truncate text-left hover:underline">
              {menu.name}
            </button>
            <Badge tone={menu.type === "LINK" ? "info" : "neutral"}>{menu.type === "LINK" ? "Link" : "Collection"}</Badge>
            {!menu.isActive && <Badge tone="danger">Hidden</Badge>}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {href && (
              <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono hover:text-foreground">
                {href} <ExternalLink className="size-3" />
              </a>
            )}
            {menu.type === "COLLECTION" && <span>{menu.productCount} product{menu.productCount === 1 ? "" : "s"}</span>}
            {flags.map((f) => (
              <Badge key={f} tone="accent" className="px-1.5 py-0 text-[11px]">{f}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 self-end sm:self-auto">
        <Button size="icon-sm" variant="ghost" onClick={() => onMove(-1)} disabled={isFirst || moving} aria-label="Move up" title="Move up">
          <ArrowUp className="size-4" />
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={() => onMove(1)} disabled={isLast || moving} aria-label="Move down" title="Move down">
          <ArrowDown className="size-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onAddChild} title="Add sub-menu">
          <Plus className="size-4" /> <span className="hidden md:inline">Sub-menu</span>
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={onEdit} aria-label="Edit" title="Edit">
          <Pencil className="size-4" />
        </Button>
        <Button size="icon-sm" variant="ghost" onClick={onDelete} aria-label="Delete" title="Delete">
          <Trash2 className="size-4 text-sale" />
        </Button>
      </div>
    </div>
  );
}
