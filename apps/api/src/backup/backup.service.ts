import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import archiver from 'archiver';
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

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private prisma: PrismaService) {}

  async getBackupHistory(): Promise<BackupMetadata[]> {
    const backups = await this.prisma.dataBackup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { createdBy: { select: { name: true } } },
    });
    return backups.map((b) => ({
      id: b.id,
      filename: b.filename,
      sizeBytes: b.sizeBytes,
      tablesIncluded: b.tablesIncluded,
      recordCounts: b.recordCounts as Record<string, number>,
      createdById: b.createdById,
      createdByName: b.createdBy.name,
      createdAt: b.createdAt,
    }));
  }

  async createBackup(userId: string): Promise<{ stream: Readable; filename: string; backupId: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.zip`;

    const tables = [
      'organizationProfile',
      'donors',
      'donations',
      'beneficiaries',
      'sponsorships',
      'sponsorshipPayments',
      'sponsorshipReminders',
      'pledges',
      'campaigns',
      'donorFamilyMembers',
      'donorSpecialOccasions',
      'beneficiaryUpdates',
      'sponsorUpdateDispatches',
      'beneficiaryTimelineEvents',
      'beneficiaryMetrics',
      'progressCards',
      'beneficiaryHealthEvents',
      'documents',
      'documentAccessLogs',
      'updateAttachments',
      'communicationLogs',
      'communicationTemplates',
      'emailLogs',
      'emailJobs',
      'reminders',
      'reminderTasks',
      'reportCampaigns',
      'milestones',
      'messageTemplates',
      'outboundMessageLogs',
    ];

    const data: Record<string, any[]> = {};
    const recordCounts: Record<string, number> = {};

    for (const table of tables) {
      try {
        const records = await (this.prisma as any)[table].findMany();
        data[table] = records;
        recordCounts[table] = records.length;
      } catch (err) {
        this.logger.warn(`Failed to export table ${table}: ${err.message}`);
        data[table] = [];
        recordCounts[table] = 0;
      }
    }

    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    const streamPromise = new Promise<Buffer>((resolve, reject) => {
      archive.on('data', (chunk: Buffer) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);
    });

    const manifest = {
      version: '1.0',
      createdAt: new Date().toISOString(),
      tables: Object.keys(recordCounts),
      recordCounts,
      totalRecords: Object.values(recordCounts).reduce((a, b) => a + b, 0),
    };
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

    for (const [table, records] of Object.entries(data)) {
      archive.append(JSON.stringify(records, null, 2), { name: `${table}.json` });
    }

    archive.finalize();
    const buffer = await streamPromise;

    const backup = await this.prisma.dataBackup.create({
      data: {
        filename,
        sizeBytes: buffer.length,
        tablesIncluded: Object.keys(recordCounts),
        recordCounts,
        createdById: userId,
      },
    });

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);

    return { stream: readable, filename, backupId: backup.id };
  }

  async restoreFromBackup(zipBuffer: Buffer, userId: string): Promise<{ tablesRestored: string[]; recordCounts: Record<string, number> }> {
    const AdmZip = (await import('adm-zip')).default;
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();

    const manifestEntry = entries.find((e) => e.entryName === 'manifest.json');
    if (!manifestEntry) {
      throw new Error('Invalid backup file: manifest.json not found');
    }
    const manifest = JSON.parse(manifestEntry.getData().toString('utf-8'));
    if (!manifest.version || !manifest.tables) {
      throw new Error('Invalid backup manifest format');
    }

    const restoreOrder = [
      'organizationProfile',
      'donors',
      'campaigns',
      'beneficiaries',
      'donorFamilyMembers',
      'donorSpecialOccasions',
      'donations',
      'pledges',
      'sponsorships',
      'sponsorshipPayments',
      'sponsorshipReminders',
      'beneficiaryUpdates',
      'sponsorUpdateDispatches',
      'beneficiaryTimelineEvents',
      'beneficiaryMetrics',
      'progressCards',
      'beneficiaryHealthEvents',
      'documents',
      'documentAccessLogs',
      'updateAttachments',
      'communicationLogs',
      'communicationTemplates',
      'emailLogs',
      'emailJobs',
      'reminders',
      'reminderTasks',
      'reportCampaigns',
      'milestones',
      'messageTemplates',
      'outboundMessageLogs',
    ];

    const deleteOrder = [...restoreOrder].reverse();

    const tablesRestored: string[] = [];
    const recordCounts: Record<string, number> = {};

    await this.prisma.$transaction(async (tx) => {
      for (const table of deleteOrder) {
        try {
          await (tx as any)[table].deleteMany();
        } catch {
          // table might not exist
        }
      }

      for (const table of restoreOrder) {
        const entry = entries.find((e) => e.entryName === `${table}.json`);
        if (!entry) continue;

        try {
          const records = JSON.parse(entry.getData().toString('utf-8'));
          if (!Array.isArray(records) || records.length === 0) {
            recordCounts[table] = 0;
            continue;
          }

          for (const record of records) {
            for (const [key, value] of Object.entries(record)) {
              if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                record[key] = new Date(value);
              }
            }
          }

          for (const record of records) {
            try {
              await (tx as any)[table].create({ data: record });
            } catch (err) {
              this.logger.warn(`Failed to restore record in ${table}: ${err.message}`);
            }
          }

          tablesRestored.push(table);
          recordCounts[table] = records.length;
        } catch (err) {
          this.logger.warn(`Failed to restore table ${table}: ${err.message}`);
        }
      }
    }, { timeout: 120000 });

    return { tablesRestored, recordCounts };
  }
}
