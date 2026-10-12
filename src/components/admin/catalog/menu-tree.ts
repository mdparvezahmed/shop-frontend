import type { AdminMenu } from "@/types/admin-catalog";

/**
 * Helpers for the nested menu tree returned by GET /admin/menus.
 * The tree is small (tens of menus), so plain recursion is fine.
 */

export type FlatMenu = { menu: AdminMenu; depth: number; path: string[] };

/** Depth-first list in display order, with each menu's depth and ancestor names. */
export function flattenMenus(tree: AdminMenu[] | undefined, depth = 0, path: string[] = []): FlatMenu[] {
  if (!tree) return [];
  return tree.flatMap((menu) => [{ menu, depth, path }, ...flattenMenus(menu.children, depth + 1, [...path, menu.name])]);
}

/** Ids of every menu below `menu` (not including it). */
export function descendantIds(menu: AdminMenu): string[] {
  return menu.children.flatMap((c) => [c.id, ...descendantIds(c)]);
}

/** Finds a menu anywhere in the tree. */
export function findMenu(tree: AdminMenu[] | undefined, id: string | null | undefined): AdminMenu | undefined {
  if (!tree || !id) return undefined;
  for (const m of tree) {
    if (m.id === id) return m;
    const hit = findMenu(m.children, id);
    if (hit) return hit;
  }
  return undefined;
}

/** "Men › T-Shirts › Basic Tees" */
export function menuLabel(flat: FlatMenu) {
  return [...flat.path, flat.menu.name].join(" › ");
}

/** Indented label for <option> elements (selects cannot be styled with padding). */
export function indentedLabel(flat: FlatMenu) {
  return `${"   ".repeat(flat.depth)}${flat.depth ? "└ " : ""}${flat.menu.name}`;
}
