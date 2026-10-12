"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/misc";
import { api, ApiError, errorMessage } from "@/lib/api/client";
import type { AdminSettings, SettingKey } from "@/types/admin-operations";

/** Props every settings tab receives from the settings page. */
export type SettingsTabProps<K extends SettingKey> = {
  value: AdminSettings[K];
  canSave: boolean;
  onSaved: (value: AdminSettings[K]) => void;
  integrations: AdminSettings["integrations"];
};

/**
 * Local form state for one settings group, saved with PUT /admin/settings/:key.
 * The API merges the body over the current value and returns the result.
 */
export function useSettingForm<K extends SettingKey>(key: K, { value, onSaved }: Pick<SettingsTabProps<K>, "value" | "onSaved">) {
  const [form, setForm] = useState(value);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(value), [value]);

  const set = <F extends keyof AdminSettings[K]>(field: F, v: AdminSettings[K][F]) => setForm((f) => ({ ...f, [field]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(value);

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const saved = await api.put<AdminSettings[K]>(`/admin/settings/${key}`, form);
      toast.success("Settings saved");
      onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      toast.error(error instanceof ApiError && error.status === 403 ? "Only the store owner can change settings." : errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return { form, setForm, set, errors, saving, dirty, save, reset: () => setForm(value) };
}

/** Card wrapper with a sticky save bar for a settings section. */
export function SettingsSection({
  title,
  description,
  children,
  onSubmit,
  saving,
  dirty,
  canSave,
  onReset,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  dirty: boolean;
  canSave: boolean;
  onReset: () => void;
}) {
  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader title={title} description={description} />
        <div className="px-5 py-5">{children}</div>
        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 rounded-b-xl border-t bg-card/95 px-5 py-3 backdrop-blur">
          {!canSave ? (
            <p className="mr-auto text-xs text-muted-foreground">View only — the store owner can change settings.</p>
          ) : dirty ? (
            <p className="mr-auto text-xs text-warning">You have unsaved changes</p>
          ) : null}
          {dirty && canSave && <Button variant="ghost" onClick={onReset}>Discard</Button>}
          <Button type="submit" loading={saving} disabled={!dirty || !canSave}>Save changes</Button>
        </div>
      </Card>
    </form>
  );
}
