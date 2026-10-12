import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast redirect for signed-out visitors before rendering protected pages.
 * The real permission check happens in the API (and in the layouts).
 */
const SESSION_COOKIE = "ec_session";

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (req.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  if (pathname.startsWith("/account")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/account/:path*", "/admin/:path*"] };
