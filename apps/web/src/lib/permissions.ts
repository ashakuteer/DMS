type Role = 'ADMIN' | 'STAFF' | 'TELECALLER' | 'ACCOUNTANT' | 'MANAGER' | 'CARETAKER' | 'VIEWER';

export const DEFAULT_PERMISSIONS: Record<string, Record<string, Role[]>> = {
  donors: {
    view: ['ADMIN', 'STAFF', 'TELECALLER', 'MANAGER'],
    create: ['ADMIN', 'STAFF', 'MANAGER'],
    edit: ['ADMIN', 'STAFF', 'MANAGER'],
    delete: ['ADMIN'],
    export: ['ADMIN', 'MANAGER'],
    addNotes: ['ADMIN', 'STAFF', 'TELECALLER', 'MANAGER'],
    viewSensitive: ['ADMIN', 'MANAGER'],
  },
  donations: {
    view: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'MANAGER', 'VIEWER'],
    create: ['ADMIN', 'STAFF', 'MANAGER'],
    edit: ['ADMIN', 'STAFF', 'MANAGER'],
    delete: ['ADMIN'],
    export: ['ADMIN', 'ACCOUNTANT', 'MANAGER'],
  },
  beneficiaries: {
    view: ['ADMIN', 'STAFF', 'MANAGER', 'CARETAKER'],
    create: ['ADMIN', 'STAFF', 'MANAGER'],
    edit: ['ADMIN', 'STAFF', 'MANAGER', 'CARETAKER'],
    delete: ['ADMIN'],
    export: ['ADMIN', 'MANAGER'],
    viewSensitive: ['ADMIN', 'MANAGER', 'CARETAKER'],
  },
  pledges: {
    view: ['ADMIN', 'STAFF', 'TELECALLER', 'MANAGER'],
    create: ['ADMIN', 'STAFF', 'TELECALLER', 'MANAGER'],
    edit: ['ADMIN', 'STAFF', 'MANAGER'],
    delete: ['ADMIN'],
  },
  campaigns: {
    view: ['ADMIN', 'STAFF', 'MANAGER', 'VIEWER'],
    create: ['ADMIN', 'STAFF', 'MANAGER'],
    edit: ['ADMIN', 'STAFF', 'MANAGER'],
    delete: ['ADMIN'],
  },
  reports: {
    view: ['ADMIN', 'ACCOUNTANT', 'MANAGER'],
    export: ['ADMIN', 'ACCOUNTANT', 'MANAGER'],
  },
  analytics: {
    view: ['ADMIN', 'MANAGER'],
  },
  management: {
    view: ['ADMIN'],
  },
  settings: {
    view: ['ADMIN'],
  },
  users: {
    view: ['ADMIN'],
  },
  milestones: {
    view: ['ADMIN'],
  },
  dailyActions: {
    view: ['ADMIN', 'STAFF', 'TELECALLER', 'MANAGER', 'CARETAKER'],
  },
  reminders: {
    view: ['ADMIN', 'STAFF', 'TELECALLER', 'MANAGER'],
  },
  followUps: {
    view: ['ADMIN', 'STAFF', 'TELECALLER', 'MANAGER'],
    create: ['ADMIN', 'STAFF', 'MANAGER'],
    edit: ['ADMIN', 'STAFF', 'MANAGER'],
    delete: ['ADMIN'],
  },
  templates: {
    view: ['ADMIN', 'STAFF', 'TELECALLER', 'MANAGER'],
  },
  reportCampaigns: {
    view: ['ADMIN'],
  },
  emailQueue: {
    view: ['ADMIN'],
  },
  auditLog: {
    view: ['ADMIN'],
  },
  backup: {
    view: ['ADMIN'],
    create: ['ADMIN'],
    restore: ['ADMIN'],
  },
  birthdayWishes: {
    view: ['ADMIN', 'STAFF', 'MANAGER'],
    send: ['ADMIN', 'STAFF', 'MANAGER'],
    manageTemplates: ['ADMIN'],
  },
  donorUpdates: {
    view: ['ADMIN', 'STAFF', 'MANAGER'],
    create: ['ADMIN', 'STAFF', 'MANAGER'],
    send: ['ADMIN', 'STAFF', 'MANAGER'],
    delete: ['ADMIN'],
  },
  donorReports: {
    view: ['ADMIN', 'ACCOUNTANT', 'MANAGER'],
    generate: ['ADMIN', 'MANAGER'],
    share: ['ADMIN', 'MANAGER'],
    delete: ['ADMIN'],
    manageTemplates: ['ADMIN'],
  },
  progressReports: {
    view: ['ADMIN', 'STAFF', 'MANAGER', 'CARETAKER'],
    generate: ['ADMIN', 'STAFF', 'MANAGER'],
    share: ['ADMIN', 'STAFF', 'MANAGER'],
    delete: ['ADMIN'],
  },
  homeSummary: {
    view: ['ADMIN', 'STAFF', 'MANAGER', 'CARETAKER'],
    export: ['ADMIN', 'STAFF', 'MANAGER'],
  },
  ngoDocuments: {
    view: ['ADMIN', 'STAFF', 'MANAGER'],
    upload: ['ADMIN', 'STAFF', 'MANAGER'],
    edit: ['ADMIN', 'STAFF', 'MANAGER'],
    delete: ['ADMIN'],
    accessLog: ['ADMIN'],
  },
  permissions: {
    view: ['ADMIN'],
    manage: ['ADMIN'],
  },
  impact: {
    view: ['ADMIN', 'STAFF', 'MANAGER'],
  },
  retention: {
    view: ['ADMIN', 'STAFF', 'MANAGER'],
  },
  staffTasks: {
    view: ['ADMIN', 'MANAGER', 'STAFF', 'TELECALLER'],
    create: ['ADMIN', 'MANAGER'],
    update: ['ADMIN', 'MANAGER', 'STAFF', 'TELECALLER'],
    delete: ['ADMIN', 'MANAGER'],
  },
  dashboard: {
    view: ['ADMIN', 'STAFF', 'TELECALLER', 'ACCOUNTANT', 'MANAGER', 'CARETAKER', 'VIEWER'],
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
  if (userRole === 'ADMIN') return true;

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

export const ALL_ROLES: Role[] = ['ADMIN', 'STAFF', 'TELECALLER', 'ACCOUNTANT', 'MANAGER', 'CARETAKER', 'VIEWER'];

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  STAFF: 'Staff',
  TELECALLER: 'Telecaller',
  ACCOUNTANT: 'Accountant',
  MANAGER: 'Manager',
  CARETAKER: 'Caretaker',
  VIEWER: 'Viewer',
};
