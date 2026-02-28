"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchWithAuth, authStorage } from "./auth";
import { setApiPermissions, clearApiPermissions, hasPermission, canAccessModule } from "./permissions";

interface PermissionContextValue {
  permissions: Record<string, string[]> | null;
  loading: boolean;
  hasPermission: (module: string, action: string) => boolean;
  canAccessModule: (module: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextValue>({
  permissions: null,
  loading: true,
  hasPermission: () => false,
  canAccessModule: () => false,
  refreshPermissions: async () => {},
});

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    const user = authStorage.getUser();
    if (!user) {
      clearApiPermissions();
      setPermissions(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetchWithAuth("/api/role-permissions/my");
      if (res.ok) {
        const data = await res.json();
        setApiPermissions(data);
        setPermissions(data);
      }
    } catch {
      clearApiPermissions();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const checkPermission = useCallback(
    (module: string, action: string) => {
      const user = authStorage.getUser();
      return hasPermission(user?.role, module, action);
    },
    [permissions]
  );

  const checkModule = useCallback(
    (module: string) => {
      const user = authStorage.getUser();
      return canAccessModule(user?.role, module);
    },
    [permissions]
  );

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        loading,
        hasPermission: checkPermission,
        canAccessModule: checkModule,
        refreshPermissions: loadPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionContext);
}
