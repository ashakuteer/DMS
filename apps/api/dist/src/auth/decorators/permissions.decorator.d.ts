export declare const PERMISSION_KEY = "permission";
export interface PermissionMetadata {
    module: string;
    action: string;
}
export declare const RequirePermission: (module: string, action: string) => import("@nestjs/common").CustomDecorator<string>;
