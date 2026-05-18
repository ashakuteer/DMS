"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var BackupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const archiver_1 = __importDefault(require("archiver"));
const stream_1 = require("stream");
let BackupService = BackupService_1 = class BackupService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(BackupService_1.name);
    }
    async getBackupHistory() {
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
            recordCounts: b.recordCounts,
            createdById: b.createdById,
            createdByName: b.createdBy.name,
            createdAt: b.createdAt,
        }));
    }
    async createBackup(userId) {
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
        const data = {};
        const recordCounts = {};
        for (const table of tables) {
            try {
                const records = await this.prisma[table].findMany();
                data[table] = records;
                recordCounts[table] = records.length;
            }
            catch (err) {
                this.logger.warn(`Failed to export table ${table}: ${err.message}`);
                data[table] = [];
                recordCounts[table] = 0;
            }
        }
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        const chunks = [];
        const streamPromise = new Promise((resolve, reject) => {
            archive.on('data', (chunk) => chunks.push(chunk));
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
        const readable = new stream_1.Readable();
        readable.push(buffer);
        readable.push(null);
        return { stream: readable, filename, backupId: backup.id };
    }
    async restoreFromBackup(zipBuffer, userId) {
        const AdmZip = (await Promise.resolve().then(() => __importStar(require('adm-zip')))).default;
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
        const tablesRestored = [];
        const recordCounts = {};
        await this.prisma.$transaction(async (tx) => {
            for (const table of deleteOrder) {
                try {
                    await tx[table].deleteMany();
                }
                catch {
                }
            }
            for (const table of restoreOrder) {
                const entry = entries.find((e) => e.entryName === `${table}.json`);
                if (!entry)
                    continue;
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
                            await tx[table].create({ data: record });
                        }
                        catch (err) {
                            this.logger.warn(`Failed to restore record in ${table}: ${err.message}`);
                        }
                    }
                    tablesRestored.push(table);
                    recordCounts[table] = records.length;
                }
                catch (err) {
                    this.logger.warn(`Failed to restore table ${table}: ${err.message}`);
                }
            }
        }, { timeout: 120000 });
        return { tablesRestored, recordCounts };
    }
};
exports.BackupService = BackupService;
exports.BackupService = BackupService = BackupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BackupService);
//# sourceMappingURL=backup.service.js.map