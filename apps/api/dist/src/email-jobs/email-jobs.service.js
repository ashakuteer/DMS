"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailJobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailJobsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EmailJobsService = EmailJobsService_1 = class EmailJobsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EmailJobsService_1.name);
    }
    async create(dto) {
        try {
            const job = await this.prisma.emailJob.upsert({
                where: {
                    unique_email_job: {
                        donorId: dto.donorId || '',
                        type: dto.type,
                        relatedId: dto.relatedId || '',
                        scheduledAt: dto.scheduledAt,
                    },
                },
                update: {
                    subject: dto.subject,
                    body: dto.body,
                    toEmail: dto.toEmail,
                },
                create: {
                    donorId: dto.donorId,
                    toEmail: dto.toEmail,
                    subject: dto.subject,
                    body: dto.body,
                    type: dto.type,
                    relatedId: dto.relatedId,
                    scheduledAt: dto.scheduledAt,
                    status: 'QUEUED',
                },
            });
            this.logger.log(`Email job created/updated: ${job.id} for ${dto.toEmail}`);
            return job;
        }
        catch (error) {
            this.logger.error(`Failed to create email job: ${error}`);
            throw error;
        }
    }
    async findAll(filters = {}) {
        const { status, type, startDate, endDate, page = 1, limit = 50 } = filters;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        if (startDate || endDate) {
            where.scheduledAt = {};
            if (startDate)
                where.scheduledAt.gte = startDate;
            if (endDate)
                where.scheduledAt.lte = endDate;
        }
        const [jobs, total] = await Promise.all([
            this.prisma.emailJob.findMany({
                where,
                include: {
                    donor: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            donorCode: true,
                        },
                    },
                },
                orderBy: { scheduledAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.emailJob.count({ where }),
        ]);
        return {
            jobs,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findPendingJobs(limit = 50) {
        const now = new Date();
        return this.prisma.emailJob.findMany({
            where: {
                status: 'QUEUED',
                scheduledAt: { lte: now },
                attempts: { lt: 3 },
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { scheduledAt: 'asc' },
            take: limit,
        });
    }
    async markSent(id, messageId) {
        return this.prisma.emailJob.update({
            where: { id },
            data: {
                status: 'SENT',
                sentAt: new Date(),
                lastError: null,
            },
        });
    }
    async markFailed(id, error) {
        const job = await this.prisma.emailJob.findUnique({ where: { id } });
        if (!job)
            return null;
        const newAttempts = job.attempts + 1;
        const newStatus = newAttempts >= 3 ? 'FAILED' : 'QUEUED';
        return this.prisma.emailJob.update({
            where: { id },
            data: {
                attempts: newAttempts,
                status: newStatus,
                lastError: error,
            },
        });
    }
    async getStats() {
        const [queued, sent, failed] = await Promise.all([
            this.prisma.emailJob.count({ where: { status: 'QUEUED' } }),
            this.prisma.emailJob.count({ where: { status: 'SENT' } }),
            this.prisma.emailJob.count({ where: { status: 'FAILED' } }),
        ]);
        return { queued, sent, failed, total: queued + sent + failed };
    }
    async findByRelatedId(relatedId) {
        return this.prisma.emailJob.findFirst({
            where: { relatedId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async retryFailed(id) {
        return this.prisma.emailJob.update({
            where: { id },
            data: {
                status: 'QUEUED',
                attempts: 0,
                lastError: null,
            },
        });
    }
    async delete(id) {
        await this.prisma.emailJob.delete({ where: { id } });
        return { success: true };
    }
};
exports.EmailJobsService = EmailJobsService;
exports.EmailJobsService = EmailJobsService = EmailJobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EmailJobsService);
//# sourceMappingURL=email-jobs.service.js.map