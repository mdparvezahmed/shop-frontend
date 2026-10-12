import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Store logo. Uses the uploaded logo (Settings → Store) when present,
 * otherwise a clean wordmark built from the store name.
 */
export function Logo({ name, logo, logoDark, href = "/", className }: { name: string; logo?: string; logoDark?: string; href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)} aria-label={`${name} home`}>
      {logo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={name} className={cn("h-8 w-auto", logoDark && "dark:hidden")} />
          {logoDark && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoDark} alt={name} className="hidden h-8 w-auto dark:block" />
          )}
        </>
      ) : (
        <span className="font-display text-lg font-semibold tracking-[0.12em] whitespace-nowrap uppercase sm:text-2xl sm:tracking-[0.18em]">{name}</span>
      )}
    </Link>
  );
}
