import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { FacebookIcon, InstagramIcon, TiktokIcon, YoutubeIcon } from "@/components/shared/social-icons";
import type { StoreLayout } from "@/types";
import { NewsletterForm } from "./newsletter-form";

export function Footer({ layout }: { layout: StoreLayout }) {
  const { store, navigation, footerPages } = layout;
  const social = [
    { href: store.social.facebook, icon: FacebookIcon, label: "Facebook" },
    { href: store.social.instagram, icon: InstagramIcon, label: "Instagram" },
    { href: store.social.youtube, icon: YoutubeIcon, label: "YouTube" },
    { href: store.social.tiktok, icon: TiktokIcon, label: "TikTok" },
  ].filter((s) => s.href);

  return (
    <footer className="mt-16 border-t bg-muted/50">
      {/* Newsletter */}
      <div className="border-b">
        <div className="container-page flex flex-col items-start justify-between gap-5 py-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-semibold">Join the club</h2>
            <p className="mt-1 text-sm text-muted-foreground">New drops, restocks and members-only offers. No spam.</p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo name={store.name} logo={store.logo} logoDark={store.logoDark} />
          {store.footerAbout && <p className="text-sm leading-relaxed text-muted-foreground">{store.footerAbout}</p>}
          {social.length > 0 && (
            <div className="flex gap-2">
              {social.map(({ href, icon: Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex size-9 items-center justify-center rounded-full border transition hover:bg-primary hover:text-primary-foreground">
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <FooterColumn title="Shop">
          {navigation.footer.map((m) => (
            <FooterLink key={m.id} href={m.href}>{m.name}</FooterLink>
          ))}
          <FooterLink href="/shop?newArrival=true">New arrivals</FooterLink>
          <FooterLink href="/shop?onSale=true">Offers</FooterLink>
        </FooterColumn>

        <FooterColumn title="Help">
          <FooterLink href="/track-order">Track your order</FooterLink>
          <FooterLink href="/contact">Contact us</FooterLink>
          {footerPages.map((p) => (
            <FooterLink key={p.slug} href={`/pages/${p.slug}`}>{p.title}</FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Contact">
          <li className="flex gap-2.5 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" />{store.address}</li>
          <li><a href={`tel:${store.phone.replace(/[^\d+]/g, "")}`} className="flex gap-2.5 text-sm text-muted-foreground hover:text-foreground"><Phone className="mt-0.5 size-4 shrink-0" />{store.phone}</a></li>
          <li><a href={`mailto:${store.email}`} className="flex gap-2.5 text-sm text-muted-foreground hover:text-foreground"><Mail className="mt-0.5 size-4 shrink-0" />{store.email}</a></li>
        </FooterColumn>
      </div>

      <div className="border-t">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-2">
            <span>We accept</span>
            {["Cash on delivery", "bKash", "Nagad", "Visa", "Mastercard"].map((m) => (
              <span key={m} className="rounded border bg-background px-2 py-0.5 font-medium text-foreground">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 font-sans text-xs font-semibold tracking-widest uppercase">{title}</h3>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-muted-foreground transition hover:text-foreground">{children}</Link>
    </li>
  );
}
