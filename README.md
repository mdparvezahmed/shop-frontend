# Frontend — storefront + admin

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · SWR · zustand · next-themes · TipTap · recharts

```bash
npm install
npm run dev     # http://localhost:3100 (the backend must run on :4000)
npm run build   # the backend must be running: the home page is pre-rendered
```

## Folder map

```
src/
├─ app/
│  ├─ (store)/              Public website — server-rendered for SEO
│  │  ├─ page.tsx           Home
│  │  ├─ shop, search, collections/[slug]     Product listings (filters live in the URL)
│  │  ├─ products/[slug]    Product page (+ JSON-LD)
│  │  ├─ cart, checkout, checkout/complete, track-order
│  │  ├─ login, register, account/**, wishlist
│  │  └─ pages/[slug], contact
│  ├─ admin/
│  │  ├─ login/             Staff sign-in
│  │  └─ (panel)/**         Dashboard pages (guarded by layout.tsx)
│  ├─ sitemap.ts, robots.ts, not-found.tsx, layout.tsx, globals.css
├─ components/
│  ├─ ui/                   Design-system primitives (Button, Field, Modal, Sheet, Badge, Price…)
│  ├─ store/                Storefront pieces, grouped: layout/, home/, listing/, product/, cart/, checkout/, order/, account/
│  ├─ admin/                Admin shell, DataTable, ImagePicker, RichTextEditor + catalog/ and operations/ screens
│  └─ shared/               Logo, JSON-LD, social icons
├─ services/
│  ├─ storefront.server.ts  Data loaders for Server Components (cached)
│  └─ shop.ts               Client-side calls (auth, cart, checkout, account)
├─ lib/
│  ├─ api/client.ts         Browser API client (calls /api/v1 on this origin)
│  ├─ api/server.ts         Server API client (calls the backend directly, forwards cookies)
│  ├─ seo.ts                Metadata + JSON-LD builders
│  └─ utils.ts              cn, formatPrice, dates, URLs
├─ stores/                  zustand: cart (localStorage), wishlist, UI panels
├─ hooks/                   useAuth, useWishlist, useAdminList, useCartValidation…
├─ types/                   API response types
└─ proxy.ts                 Redirects signed-out visitors away from /account and /admin
```

## Conventions

* **Theme**: colours are CSS variables in `globals.css` (`--background`, `--foreground`, `--muted`, `--primary`, `--accent`, `--sale`…). Use the Tailwind names (`bg-card`, `text-muted-foreground`) — never raw greys — and dark mode works automatically.
* **Storefront pages** are Server Components that load data through `services/storefront.server.ts`; only interactive bits are client components.
* **Admin pages** are client components using `useAdminList` + `DataTable`; see `app/admin/(panel)/coupons` for the reference CRUD pattern.
* **API errors** come back as `ApiError` with `.fieldErrors` for showing messages under form fields.
* Images are already resized/compressed by the backend, so `next/image` optimisation is disabled.
