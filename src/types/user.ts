export type Role = "CUSTOMER" | "STAFF" | "MANAGER" | "ADMIN";

export type User = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  status: "ACTIVE" | "BLOCKED";
  avatar: string | null;
  lastLoginAt: string | null;
  createdAt: string;
};

export type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  district: string;
  area: string;
  addressLine: string;
  isDefault: boolean;
};

export const STAFF_ROLES: Role[] = ["ADMIN", "MANAGER", "STAFF"];
