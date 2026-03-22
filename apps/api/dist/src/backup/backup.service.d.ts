import { PrismaService } from '../prisma/prisma.service';
import { Readable } from 'stream';
export interface BackupMetadata {
    id: string;
    filename: string;
    sizeBytes: number;
    tablesIncluded: string[];
    recordCounts: Record<string, number>;
    createdById: string;
    createdByName: string;
    createdAt: Date;
}
export declare class BackupService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getBackupHistory(): Promise<BackupMetadata[]>;
    createBackup(userId: string): Promise<{
        stream: Readable;
        filename: string;
        backupId: string;
    }>;
    restoreFromBackup(zipBuffer: Buffer, userId: string): Promise<{
        tablesRestored: string[];
        recordCounts: Record<string, number>;
    }>;
}
