type Role = 'FOUNDER' | 'ADMIN' | 'STAFF' | 'TELECALLER' | 'ACCOUNTANT' | 'MANAGER' | 'CARETAKER' | 'VIEWER';

export const DEFAULT_PERMISSIONS: Record<string, Record<string, Role[]>> = {
  donors: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'TELECALLER', 'MANAGER'],
    create: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    delete: ['FOUNDER', 'ADMIN'],
    export: ['FOUNDER', 'ADMIN', 'MANAGER'],
    addNotes: ['FOUNDER', 'ADMIN', 'STAFF', 'TELECALLER', 'MANAGER'],
    viewSensitive: ['FOUNDER', 'ADMIN', 'MANAGER'],
    assign: ['FOUNDER', 'ADMIN', 'MANAGER'],
  },
  donations: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'ACCOUNTANT', 'MANAGER', 'VIEWER'],
    create: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    delete: ['FOUNDER', 'ADMIN'],
    export: ['FOUNDER', 'ADMIN', 'ACCOUNTANT', 'MANAGER'],
  },
  beneficiaries: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER', 'CARETAKER'],
    create: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER', 'CARETAKER'],
    delete: ['FOUNDER', 'ADMIN'],
    export: ['FOUNDER', 'ADMIN', 'MANAGER'],
    viewSensitive: ['FOUNDER', 'ADMIN', 'MANAGER', 'CARETAKER'],
  },
  pledges: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'TELECALLER', 'MANAGER'],
    create: ['FOUNDER', 'ADMIN', 'STAFF', 'TELECALLER', 'MANAGER'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    delete: ['FOUNDER', 'ADMIN'],
  },
  campaigns: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER', 'VIEWER'],
    create: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    delete: ['FOUNDER', 'ADMIN'],
  },
  reports: {
    view: ['FOUNDER', 'ADMIN', 'ACCOUNTANT', 'MANAGER'],
    export: ['FOUNDER', 'ADMIN', 'ACCOUNTANT', 'MANAGER'],
  },
  analytics: {
    view: ['FOUNDER', 'ADMIN', 'MANAGER'],
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
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'TELECALLER', 'MANAGER', 'CARETAKER'],
  },
  reminders: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'TELECALLER', 'MANAGER'],
  },
  followUps: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'TELECALLER', 'MANAGER'],
    create: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    delete: ['FOUNDER', 'ADMIN'],
  },
  templates: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'TELECALLER', 'MANAGER'],
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
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    send: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    manageTemplates: ['FOUNDER', 'ADMIN'],
  },
  donorUpdates: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    create: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    send: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    delete: ['FOUNDER', 'ADMIN'],
  },
  donorReports: {
    view: ['FOUNDER', 'ADMIN', 'ACCOUNTANT', 'MANAGER'],
    generate: ['FOUNDER', 'ADMIN', 'MANAGER'],
    share: ['FOUNDER', 'ADMIN', 'MANAGER'],
    delete: ['FOUNDER', 'ADMIN'],
    manageTemplates: ['FOUNDER', 'ADMIN'],
  },
  progressReports: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER', 'CARETAKER'],
    generate: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    share: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    delete: ['FOUNDER', 'ADMIN'],
  },
  homeSummary: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER', 'CARETAKER'],
    export: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
  },
  ngoDocuments: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    upload: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    delete: ['FOUNDER', 'ADMIN'],
    accessLog: ['FOUNDER', 'ADMIN'],
  },
  timeMachine: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER', 'CARETAKER'],
    create: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    edit: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
    delete: ['FOUNDER', 'ADMIN'],
    uploadPhoto: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
  },
  permissions: {
    view: ['FOUNDER', 'ADMIN'],
    manage: ['FOUNDER', 'ADMIN'],
  },
  impact: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
  },
  retention: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'MANAGER'],
  },
  staffTasks: {
    view: ['FOUNDER', 'ADMIN', 'MANAGER', 'STAFF', 'TELECALLER'],
    create: ['FOUNDER', 'ADMIN', 'MANAGER'],
    update: ['FOUNDER', 'ADMIN', 'MANAGER', 'STAFF', 'TELECALLER'],
    delete: ['FOUNDER', 'ADMIN', 'MANAGER'],
  },
  dashboard: {
    view: ['FOUNDER', 'ADMIN', 'STAFF', 'TELECALLER', 'ACCOUNTANT', 'MANAGER', 'CARETAKER', 'VIEWER'],
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

export const ALL_ROLES: Role[] = ['FOUNDER', 'ADMIN', 'STAFF', 'TELECALLER', 'ACCOUNTANT', 'MANAGER', 'CARETAKER', 'VIEWER'];

export const ROLE_LABELS: Record<string, string> = {
  FOUNDER: 'Founder',
  ADMIN: 'Admin',
  STAFF: 'Staff',
  TELECALLER: 'Telecaller',
  ACCOUNTANT: 'Accountant',
  MANAGER: 'Manager',
  CARETAKER: 'Caretaker',
  VIEWER: 'Viewer',
};
