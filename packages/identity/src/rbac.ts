/**
 * @sovereign/identity — RBAC Engine
 *
 * MERGED FROM:
 *   fth-capital-os/core/permissions.ts (hasPermission, requirePermission)
 *   circle-superapp/src/lib/mog-os/types.ts (ROLE_PERMISSIONS matrix)
 *
 * RULE: This is the ONE permission-checking module in the system.
 */

import { Role, Permission, ROLE_PERMISSIONS, SovereignIdentity } from './types';

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if an identity has a specific permission (checks ALL assigned roles)
 */
export function hasPermission(identity: SovereignIdentity, permission: Permission): boolean {
  return identity.roles.some(role => roleHasPermission(role, permission));
}

/**
 * Check if an identity has ALL of the specified permissions
 */
export function hasAllPermissions(identity: SovereignIdentity, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(identity, permission));
}

/**
 * Check if an identity has ANY of the specified permissions
 */
export function hasAnyPermission(identity: SovereignIdentity, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(identity, permission));
}

/**
 * Get all permissions for an identity (union of all role permissions)
 */
export function getPermissions(identity: SovereignIdentity): Permission[] {
  const permissionSet = new Set<Permission>();
  for (const role of identity.roles) {
    const rolePerms = ROLE_PERMISSIONS[role];
    if (rolePerms) {
      for (const perm of rolePerms) {
        permissionSet.add(perm);
      }
    }
  }
  return Array.from(permissionSet);
}

/**
 * Require a permission — throws if not present
 */
export function requirePermission(
  identity: SovereignIdentity,
  permission: Permission,
  action?: string
): void {
  if (!hasPermission(identity, permission)) {
    throw new PermissionDeniedError(identity.id, permission, action);
  }
}

/**
 * Require all permissions — throws if any missing
 */
export function requireAllPermissions(
  identity: SovereignIdentity,
  permissions: Permission[],
  action?: string
): void {
  const missing = permissions.filter(p => !hasPermission(identity, p));
  if (missing.length > 0) {
    throw new PermissionDeniedError(identity.id, missing[0], action, missing);
  }
}

/**
 * Permission denied error
 */
export class PermissionDeniedError extends Error {
  public readonly identityId: string;
  public readonly permission: Permission;
  public readonly missingPermissions?: Permission[];

  constructor(
    identityId: string,
    permission: Permission,
    action?: string,
    missingPermissions?: Permission[]
  ) {
    const actionMsg = action ? ` for action "${action}"` : '';
    const missingMsg = missingPermissions
      ? ` (missing: ${missingPermissions.join(', ')})`
      : '';
    super(
      `Permission denied: identity "${identityId}" lacks "${permission}"${actionMsg}${missingMsg}`
    );
    this.name = 'PermissionDeniedError';
    this.identityId = identityId;
    this.permission = permission;
    this.missingPermissions = missingPermissions;
  }
}
