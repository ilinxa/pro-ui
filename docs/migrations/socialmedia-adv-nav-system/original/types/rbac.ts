/**
 * RBAC types matching backend API contracts.
 *
 * Backend source: apps.rbac.serializers, apps.core.constants
 */

export type AccountType = "business" | "platform";

export type MembershipStatus = "active" | "pending_approval" | "suspended" | "left" | "removed" | "banned";

export interface MembershipPermission {
  code: string;
  scope: string;
}

export interface Role {
  id: string;
  name: string;
  account_type: AccountType;
  account_id: string;
  level: number;
  is_system_role: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  account_type: AccountType;
  account_id: string;
  account_name: string;
  account_slug: string;
  account_max_members: number;
  role: Role;
  is_owner: boolean;
  status: MembershipStatus;
  joined_at: string;
  permissions: MembershipPermission[];
}
