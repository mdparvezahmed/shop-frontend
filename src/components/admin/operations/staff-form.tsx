"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { api, ApiError, errorMessage } from "@/lib/api/client";
import type { User } from "@/types";
import type { StaffRole } from "@/types/admin-operations";

/** What each role can do — shown on the staff page and in the form. */
export const ROLE_INFO: Record<StaffRole, { label: string; summary: string; can: string[] }> = {
  STAFF: {
    label: "Staff",
    summary: "Day-to-day order handling",
    can: ["See the dashboard", "Confirm, pack and ship orders; book Pathao parcels", "Add order notes, edit delivery details", "View customers, catalog and messages"],
  },
  MANAGER: {
    label: "Manager",
    summary: "Runs the shop",
    can: ["Everything Staff can do", "Edit products, menus, inventory, coupons", "Banners, pages, media and subscribers", "Mark payments, block customers, delivery zones", "View store settings"],
  },
  ADMIN: {
    label: "Owner (Admin)",
    summary: "Full access",
    can: ["Everything Managers can do", "Change store settings", "Add staff and change roles or passwords"],
  },
};

const EMPTY = { name: "", email: "", phone: "", password: "", role: "STAFF" as StaffRole | "CUSTOMER", status: "ACTIVE" as User["status"] };

/** Create or edit a staff account (POST /admin/staff, PATCH /admin/staff/:id). */
export function StaffForm({ member, open, onClose, onSaved, isSelf }: { member: User | null; open: boolean; onClose: () => void; onSaved: () => void; isSelf: boolean }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      member
        ? { name: member.name, email: member.email ?? "", phone: member.phone ?? "", password: "", role: member.role, status: member.status }
        : EMPTY,
    );
  }, [open, member]);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const phone = form.phone.trim() ? { phone: form.phone.trim() } : {};
    try {
      if (member) {
        await api.patch(`/admin/staff/${member.id}`, {
          name: form.name,
          email: form.email,
          ...phone,
          // Sending role/status signs the person out, so only send real changes.
          ...(form.role !== member.role ? { role: form.role } : {}),
          ...(form.status !== member.status ? { status: form.status } : {}),
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        await api.post("/admin/staff", { name: form.name, email: form.email, ...phone, password: form.password, role: form.role });
      }
      toast.success(member ? "Staff member updated" : "Staff account created");
      onSaved();
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const role = form.role !== "CUSTOMER" ? ROLE_INFO[form.role] : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={member ? `Edit ${member.name}` : "Add staff member"}
      description={member ? "Changing the role, status or password signs them out everywhere." : "They log in at /admin/login with this email and password."}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="staff-form" loading={saving}>{member ? "Save changes" : "Create account"}</Button>
        </>
      }
    >
      <form id="staff-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.name}>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Phone" error={errors.phone} hint="Optional — Bangladeshi mobile number">
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" placeholder="01XXXXXXXXX" />
        </Field>
        <Field label="Email" required error={errors.email} className="sm:col-span-2">
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Role" required error={errors.role}>
          <Select value={form.role} onChange={(e) => set("role", e.target.value as StaffRole | "CUSTOMER")} disabled={isSelf}>
            {(Object.keys(ROLE_INFO) as StaffRole[]).map((r) => (
              <option key={r} value={r}>{ROLE_INFO[r].label}</option>
            ))}
            {member && <option value="CUSTOMER">No admin access (customer)</option>}
          </Select>
        </Field>
        {member ? (
          <Field label="Status" error={errors.status}>
            <Select value={form.status} onChange={(e) => set("status", e.target.value as User["status"])} disabled={isSelf}>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked — cannot log in</option>
            </Select>
          </Field>
        ) : (
          <div className="hidden sm:block" />
        )}
        <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs sm:col-span-2">
          {role ? (
            <>
              <p className="font-medium">{role.label}: {role.summary.toLowerCase()}</p>
              <p className="mt-0.5 text-muted-foreground">{role.can.join(" · ")}</p>
            </>
          ) : (
            <p className="text-muted-foreground">They keep their account for shopping but can no longer open the admin panel.</p>
          )}
          {isSelf && <p className="mt-1 text-warning">You cannot change your own role or block yourself.</p>}
        </div>
        <Field
          label={member ? "Reset password" : "Password"}
          required={!member}
          error={errors.password}
          hint={member ? "Leave empty to keep the current password" : "At least 6 characters"}
          className="sm:col-span-2"
        >
          <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" />
        </Field>
      </form>
    </Modal>
  );
}
