"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { ApiError, errorMessage } from "@/lib/api/client";
import { authApi } from "@/services/shop";

export function ProfileForms() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState<"profile" | "password" | null>(null);

  useEffect(() => {
    if (user) setProfile({ name: user.name, email: user.email ?? "", phone: user.phone ?? "" });
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("profile");
    setErrors({});
    try {
      setUser(await authApi.updateProfile(profile));
      toast.success("Profile updated");
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("password");
    setErrors({});
    try {
      await authApi.changePassword(pw.currentPassword, pw.newPassword);
      setPw({ currentPassword: "", newPassword: "" });
      toast.success("Password changed. Other devices have been signed out.");
    } catch (error) {
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <form onSubmit={saveProfile} className="space-y-4 rounded-xl border p-6">
        <h2 className="font-sans text-lg font-semibold">Profile</h2>
        <Field label="Full name" error={errors.name}><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
        <Field label="Mobile number" error={errors.phone}><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} type="tel" /></Field>
        <Field label="Email" error={errors.email}><Input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} type="email" /></Field>
        <Button type="submit" loading={busy === "profile"}>Save profile</Button>
      </form>
      <form onSubmit={savePassword} className="space-y-4 rounded-xl border p-6">
        <h2 className="font-sans text-lg font-semibold">Change password</h2>
        <Field label="Current password" error={errors.currentPassword}><Input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} autoComplete="current-password" required /></Field>
        <Field label="New password" error={errors.newPassword} hint="At least 6 characters"><Input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} autoComplete="new-password" required /></Field>
        <Button type="submit" loading={busy === "password"}>Change password</Button>
      </form>
    </div>
  );
}
