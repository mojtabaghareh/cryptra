export type Role = 'user' | 'moderator' | 'admin' | 'superadmin';

const roleHierarchy: Record<Role, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
  superadmin: 4,
};

export function hasRole(userRole: Role, required: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[required];
}

export function requireRole(userRole: Role, required: Role): void {
  if (!hasRole(userRole, required)) {
    throw new Error(`Insufficient role. Required: ${required}, has: ${userRole}`);
  }
}

export const Permissions = {
  READ_OWN_PROFILE: 'read:own_profile',
  UPDATE_OWN_PROFILE: 'update:own_profile',
  READ_USERS: 'read:users',
  UPDATE_USERS: 'update:users',
  READ_AUDIT: 'read:audit',
  MANAGE_FEES: 'manage:fees',
  MANAGE_REWARDS: 'manage:rewards',
  SYSTEM_CONFIG: 'system:config',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

const rolePermissions: Record<Role, Permission[]> = {
  user: [Permissions.READ_OWN_PROFILE, Permissions.UPDATE_OWN_PROFILE],
  moderator: [
    Permissions.READ_OWN_PROFILE,
    Permissions.UPDATE_OWN_PROFILE,
    Permissions.READ_USERS,
  ],
  admin: [
    Permissions.READ_OWN_PROFILE,
    Permissions.UPDATE_OWN_PROFILE,
    Permissions.READ_USERS,
    Permissions.UPDATE_USERS,
    Permissions.READ_AUDIT,
    Permissions.MANAGE_FEES,
    Permissions.MANAGE_REWARDS,
  ],
  superadmin: Object.values(Permissions),
};

export function can(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}
