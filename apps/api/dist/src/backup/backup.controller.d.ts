import { BackupService } from './backup.service';
import { AuditService } from '../audit/audit.service';
import { Request, Response } from 'express';
export declare class BackupController {
    private backupService;
    private auditService;
    constructor(backupService: BackupService, auditService: AuditService);
    getBackupHistory(): Promise<import("./backup.service").BackupMetadata[]>;
    createBackup(req: Request, res: Response): Promise<void>;
    restoreFromBackup(file: Express.Multer.File, req: Request): Promise<{
        tablesRestored: string[];
        recordCounts: Record<string, number>;
    }>;
}
