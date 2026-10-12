"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { CircleAlert, CircleCheck, KeyRound } from "lucide-react";
import { FilterTabs } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { CheckoutSettingsTab, CourierSettingsTab } from "@/components/admin/operations/settings-checkout";
import { SeoSettingsTab } from "@/components/admin/operations/settings-seo";
import { StoreSettingsTab } from "@/components/admin/operations/settings-store";
import { Badge, Card, EmptyState, Skeleton } from "@/components/ui/misc";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/api/client";
import type { AdminSettings, SettingKey } from "@/types/admin-operations";

const TABS: { value: SettingKey; label: string }[] = [
  { value: "store", label: "Store" },
  { value: "seo", label: "SEO" },
  { value: "checkout", label: "Checkout" },
  { value: "courier", label: "Courier" },
];

/** Store settings — one tab per settings group, each saved on its own. */
export default function SettingsPage() {
  return (
    <Suspense>
      <Settings />
    </Suspense>
  );
}

function Settings() {
  const params = useSearchParams();
  const initial = TABS.find((t) => t.value === params.get("tab"))?.value ?? "store";
  const [tab, setTab] = useState<SettingKey>(initial);
  const { user } = useAuth();
  const { data, error, mutate } = useSWR<AdminSettings>("/admin/settings", { revalidateOnFocus: false });
  const canSave = user?.role === "ADMIN";

  if (error && !data) {
    return (
      <>
        <PageHeader title="Store settings" />
        <Card><EmptyState icon={<KeyRound className="size-6" />} title="Settings are not available" description={errorMessage(error)} /></Card>
      </>
    );
  }

  const saved = <K extends SettingKey>(key: K) => (value: AdminSettings[K]) => mutate({ ...data!, [key]: value }, { revalidate: false });

  return (
    <>
      <PageHeader title="Store settings" description="Brand, SEO, checkout and courier settings for the whole store." />

      {data && (
        <Card className="mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap gap-2">
            <Integration ok={data.integrations.sslcommerz} label={data.integrations.sslcommerz ? "SSLCommerz connected" : "SSLCommerz not configured"} />
            <Integration ok={data.integrations.pathao} label={data.integrations.pathao ? "Pathao configured" : "Pathao not configured"} />
          </div>
          <p className="text-xs text-muted-foreground sm:ml-auto sm:max-w-md sm:text-right">
            Payment and courier credentials (store IDs, passwords, API keys) live in the backend <code className="rounded bg-muted px-1 py-0.5 font-mono">.env</code> file and are never shown here.
          </p>
        </Card>
      )}

      <FilterTabs<SettingKey> value={tab} onChange={(v) => setTab(v || "store")} options={TABS} />

      {!data ? (
        <Skeleton className="h-[520px] rounded-xl" />
      ) : tab === "store" ? (
        <StoreSettingsTab value={data.store} onSaved={saved("store")} canSave={canSave} integrations={data.integrations} />
      ) : tab === "seo" ? (
        <SeoSettingsTab value={data.seo} onSaved={saved("seo")} canSave={canSave} integrations={data.integrations} />
      ) : tab === "checkout" ? (
        <CheckoutSettingsTab value={data.checkout} onSaved={saved("checkout")} canSave={canSave} integrations={data.integrations} />
      ) : (
        <CourierSettingsTab value={data.courier} onSaved={saved("courier")} canSave={canSave} integrations={data.integrations} />
      )}
    </>
  );
}

function Integration({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge tone={ok ? "success" : "warning"} className="px-2.5 py-1">
      {ok ? <CircleCheck className="size-3.5" /> : <CircleAlert className="size-3.5" />} {label}
    </Badge>
  );
}
