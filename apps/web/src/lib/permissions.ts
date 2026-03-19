type Role = 'FOUNDER' | 'ADMIN' | 'STAFF';

export const DEFAULT_PERMISSIONS: Record<string, Record<string, Role[]>> = {
  donors: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
    create: ['FOUNDER', 'ADMIN', 'STAFF'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF'],
    delete: ['FOUNDER', 'ADMIN'],
    export: ['FOUNDER', 'ADMIN'],
    addNotes: ['FOUNDER', 'ADMIN', 'STAFF'],
    viewSensitive: ['FOUNDER', 'ADMIN'],
    assign: ['FOUNDER', 'ADMIN'],
  },
  donations: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
    create: ['FOUNDER', 'ADMIN', 'STAFF'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF'],
    delete: ['FOUNDER', 'ADMIN'],
    export: ['FOUNDER', 'ADMIN'],
  },
  beneficiaries: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
    create: ['FOUNDER', 'ADMIN', 'STAFF'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF'],
    delete: ['FOUNDER', 'ADMIN'],
    export: ['FOUNDER', 'ADMIN'],
    viewSensitive: ['FOUNDER', 'ADMIN'],
  },
  pledges: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
    create: ['FOUNDER', 'ADMIN', 'STAFF'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF'],
    delete: ['FOUNDER', 'ADMIN'],
  },
  campaigns: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
    create: ['FOUNDER', 'ADMIN', 'STAFF'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF'],
    delete: ['FOUNDER', 'ADMIN'],
  },
  reports: {
    view: ['FOUNDER', 'ADMIN'],
    export: ['FOUNDER', 'ADMIN'],
  },
  analytics: {
    view: ['FOUNDER', 'ADMIN'],
  },
  management: {
    view: ['FOUNDER', 'ADMIN'],
  },
  settings: {
    view: ['FOUNDER', 'ADMIN'],
  },
  users: {
    view: ['FOUNDER', 'ADMIN'],
    create: ['FOUNDER', 'ADMIN'],
    edit: ['FOUNDER', 'ADMIN'],
    delete: ['FOUNDER', 'ADMIN'],
    resetPassword: ['FOUNDER', 'ADMIN'],
  },
  milestones: {
    view: ['FOUNDER', 'ADMIN'],
  },
  dailyActions: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
  },
  reminders: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
  },
  followUps: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
    create: ['FOUNDER', 'ADMIN', 'STAFF'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF'],
    delete: ['FOUNDER', 'ADMIN'],
  },
  templates: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
  },
  reportCampaigns: {
    view: ['FOUNDER', 'ADMIN'],
  },
  emailQueue: {
    view: ['FOUNDER', 'ADMIN'],
  },
  auditLog: {
    view: ['FOUNDER', 'ADMIN'],
  },
  backup: {
    view: ['FOUNDER', 'ADMIN'],
    create: ['FOUNDER', 'ADMIN'],
    restore: ['FOUNDER', 'ADMIN'],
  },
  archive: {
    view: ['FOUNDER', 'ADMIN'],
    manage: ['FOUNDER', 'ADMIN'],
  },
  birthdayWishes: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
    send: ['FOUNDER', 'ADMIN', 'STAFF'],
    manageTemplates: ['FOUNDER', 'ADMIN'],
  },
  donorUpdates: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
    create: ['FOUNDER', 'ADMIN', 'STAFF'],
    send: ['FOUNDER', 'ADMIN', 'STAFF'],
    delete: ['FOUNDER', 'ADMIN'],
  },
  donorReports: {
    view: ['FOUNDER', 'ADMIN'],
    generate: ['FOUNDER', 'ADMIN'],
    share: ['FOUNDER', 'ADMIN'],
    delete: ['FOUNDER', 'ADMIN'],
    manageTemplates: ['FOUNDER', 'ADMIN'],
  },
  progressReports: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
    generate: ['FOUNDER', 'ADMIN', 'STAFF'],
    share: ['FOUNDER', 'ADMIN', 'STAFF'],
    delete: ['FOUNDER', 'ADMIN'],
  },
  homeSummary: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
    export: ['FOUNDER', 'ADMIN', 'STAFF'],
  },
  ngoDocuments: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
    upload: ['FOUNDER', 'ADMIN', 'STAFF'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF'],
    delete: ['FOUNDER', 'ADMIN'],
    accessLog: ['FOUNDER', 'ADMIN'],
  },
  timeMachine: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
    create: ['FOUNDER', 'ADMIN', 'STAFF'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF'],
    delete: ['FOUNDER', 'ADMIN'],
    uploadPhoto: ['FOUNDER', 'ADMIN', 'STAFF'],
  },
  permissions: {
    view: ['FOUNDER', 'ADMIN'],
    manage: ['FOUNDER', 'ADMIN'],
  },
  impact: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
  },
  retention: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
  },
  staffTasks: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
    create: ['FOUNDER', 'ADMIN'],
    update: ['FOUNDER', 'ADMIN', 'STAFF'],
    delete: ['FOUNDER', 'ADMIN'],
  },
  dashboard: {
    view: ['FOUNDER', 'ADMIN', 'STAFF'],
  },
};

export const PERMISSIONS = DEFAULT_PERMISSIONS;

let _apiPermissions: Record<string, string[]> | null = null;

export function setApiPermissions(perms: Record<string, string[]>) {
  _apiPermissions = perms;
}

export function clearApiPermissions() {
  _apiPermissions = null;
}

export function hasPermission(
  userRole: string | undefined | null,
  module: string,
  action: string
): boolean {
  if (!userRole) return false;
  if (userRole === 'FOUNDER' || userRole === 'ADMIN') return true;

  if (_apiPermissions) {
    const modulePerms = _apiPermissions[module];
    if (!modulePerms) return false;
    return modulePerms.includes(action);
  }

  const modulePerms = PERMISSIONS[module];
  if (!modulePerms) return false;
  const allowedRoles = (modulePerms as Record<string, Role[]>)[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(userRole as Role);
}

export function canAccessModule(
  userRole: string | undefined | null,
  module: string
): boolean {
  return hasPermission(userRole, module, 'view');
}

export const ALL_ROLES: Role[] = ['FOUNDER', 'ADMIN', 'STAFF'];

export const ROLE_LABELS: Record<string, string> = {
  FOUNDER: 'Founder',
  ADMIN: 'Admin',
  STAFF: 'Staff',
};
