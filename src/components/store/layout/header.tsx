import { Logo } from "@/components/shared/logo";
import type { StoreLayout } from "@/types";
import { DesktopNav } from "./desktop-nav";
import { HeaderActions, MenuButton } from "./header-actions";

/**
 * Sticky store header.
 * Phone / tablet:  [menu]   LOGO   [search][cart]
 * Desktop (lg+):   LOGO ………………………… [search][account][wishlist][theme][cart]
 *                  ──────── menu row (wraps if the admin adds many menus) ────────
 */
export function Header({ layout }: { layout: StoreLayout }) {
  const { store, navigation } = layout;
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container-page flex h-16 items-center gap-2 lg:h-[72px]">
        <div className="flex flex-1 items-center lg:hidden">
          <MenuButton />
        </div>
        <Logo name={store.name} logo={store.logo} logoDark={store.logoDark} className="shrink-0" />
        <div className="flex min-w-0 flex-1 justify-end">
          <HeaderActions />
        </div>
      </div>
      <DesktopNav items={navigation.header} />
    </header>
  );
}
