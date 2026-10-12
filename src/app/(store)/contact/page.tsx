import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/store/contact-form";
import { WhatsappIcon } from "@/components/shared/social-icons";
import { pageMetadata } from "@/lib/seo";
import { getLayout } from "@/services/storefront.server";

export async function generateMetadata(): Promise<Metadata> {
  const { store } = await getLayout();
  return pageMetadata({ title: "Contact us", description: `Get in touch with ${store.name}. Call ${store.phone} or send us a message.`, path: "/contact" });
}

export default async function ContactPage() {
  const { store } = await getLayout();
  const items = [
    { icon: Phone, label: "Call us", value: store.phone, href: `tel:${store.phone.replace(/[^\d+]/g, "")}` },
    { icon: Mail, label: "Email", value: store.email, href: `mailto:${store.email}` },
    ...(store.whatsapp ? [{ icon: WhatsappIcon, label: "WhatsApp", value: "Chat with us", href: `https://wa.me/${store.whatsapp.replace(/\D/g, "")}` }] : []),
    { icon: MapPin, label: "Visit", value: store.address },
    { icon: Clock, label: "Hours", value: "Saturday – Thursday, 10am – 8pm" },
  ];

  return (
    <div className="container-page py-10 sm:py-14">
      <h1 className="text-3xl font-semibold sm:text-4xl">Contact us</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">Questions about sizing, an order or a bulk purchase? We usually reply within a few hours.</p>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <ul className="space-y-5">
          {items.map(({ icon: Icon, label, value, href }) => (
            <li key={label} className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted"><Icon className="size-5" /></span>
              <div>
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{label}</p>
                {href ? <a href={href} className="font-medium hover:underline">{value}</a> : <p className="font-medium">{value}</p>}
              </div>
            </li>
          ))}
        </ul>
        <ContactForm />
      </div>
    </div>
  );
}
