"use client";

import { useState } from "react";
import { Check, Pencil, Plus, ShieldCheck } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ListToolbar } from "@/components/admin/list-toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { ROLE_INFO, StaffForm } from "@/components/admin/operations/staff-form";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, Skeleton } from "@/components/ui/misc";
import { useAdminList } from "@/hooks/use-admin-list";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, initials } from "@/lib/utils";
import type { User } from "@/types";
import type { StaffRole } from "@/types/admin-operations";

const ROLE_TONE = { ADMIN: "dark", MANAGER: "accent", STAFF: "info", CUSTOMER: "neutral" } as const;

/** Staff & roles — owner only. Create accounts, change roles, reset passwords. */
export default function StaffPage() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (user?.role !== "ADMIN") {
    return (
      <>
        <PageHeader title="Staff & roles" />
        <Card>
          <EmptyState icon={<ShieldCheck className="size-6" />} title="Owner access only" description="Only the store owner (Admin role) can manage staff accounts." />
        </Card>
      </>
    );
  }
  return <StaffList currentUserId={user.id} />;
}

function StaffList({ currentUserId }: { currentUserId: string }) {
  const list = useAdminList<User>("/admin/staff", { q: "" });
  const [editing, setEditing] = useState<User | "new" | null>(null);

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{initials(u.name)}</span>
          <div className="min-w-0">
            <p className="font-medium whitespace-nowrap">
              {u.name} {u.id === currentUserId && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
            </p>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", header: "Phone", cell: (u) => u.phone ?? "—", hideOnMobile: true },
    { key: "role", header: "Role", cell: (u) => <Badge tone={ROLE_TONE[u.role]}>{u.role === "CUSTOMER" ? "Customer" : ROLE_INFO[u.role].label}</Badge> },
    { key: "status", header: "Status", cell: (u) => <StatusBadge status={u.status} /> },
    { key: "login", header: "Last login", cell: (u) => (u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"), hideOnMobile: true },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (u) => (
        <Button size="icon-sm" variant="ghost" onClick={() => setEditing(u)} aria-label="Edit">
          <Pencil className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Staff & roles"
        description="People who can open this admin panel."
        actions={<Button onClick={() => setEditing("new")}><Plus className="size-4" /> Add staff</Button>}
      />

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {(Object.keys(ROLE_INFO) as StaffRole[]).map((r) => (
          <Card key={r} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <Badge tone={ROLE_TONE[r]}>{ROLE_INFO[r].label}</Badge>
              <span className="text-xs text-muted-foreground">{ROLE_INFO[r].summary}</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {ROLE_INFO[r].can.map((c) => (
                <li key={c} className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" /> {c}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <ListToolbar search={String(list.filters.q ?? "")} onSearch={(q) => list.setFilter("q", q)} placeholder="Search name, email or phone…" />
      <DataTable
        rows={list.items}
        columns={columns}
        loading={list.isLoading}
        meta={list.meta}
        onPageChange={list.setPage}
        onRowClick={(u) => setEditing(u)}
        empty={{ title: "No staff found" }}
      />

      <StaffForm
        member={editing === "new" ? null : editing}
        open={editing !== null}
        isSelf={editing !== "new" && editing?.id === currentUserId}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          list.reload();
        }}
      />
    </>
  );
}
