import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-8xl font-semibold tracking-tight text-muted-foreground/40">404</p>
      <h1 className="mt-4 text-2xl font-semibold">We couldn’t find that page</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">The product may have sold out or the link may be wrong.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground">Go home</Link>
        <Link href="/shop" className="inline-flex h-11 items-center rounded-md border px-6 text-sm font-medium hover:bg-muted">Browse products</Link>
      </div>
    </div>
  );
}
