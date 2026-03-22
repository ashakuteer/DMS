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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AuditService = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(input) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: input.userId,
                    action: input.action,
                    entityType: input.entityType,
                    entityId: input.entityId,
                    oldValue: input.oldValue,
                    newValue: input.newValue,
                    ipAddress: input.ipAddress,
                    userAgent: input.userAgent,
                    metadata: input.metadata,
                },
            });
        }
        catch (error) {
            console.error('Failed to create audit log:', error);
        }
    }
    async logDonorCreate(userId, donorId, donorData, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.DONOR_CREATE,
            entityType: 'Donor',
            entityId: donorId,
            newValue: donorData,
            ipAddress,
            userAgent,
        });
    }
    async logDonorUpdate(userId, donorId, oldData, newData, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.DONOR_UPDATE,
            entityType: 'Donor',
            entityId: donorId,
            oldValue: oldData,
            newValue: newData,
            ipAddress,
            userAgent,
        });
    }
    async logDonorDelete(userId, donorId, donorData, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.DONOR_DELETE,
            entityType: 'Donor',
            entityId: donorId,
            oldValue: donorData,
            ipAddress,
            userAgent,
        });
    }
    async logDonorAssignmentChange(userId, donorId, oldAssigneeId, newAssigneeId, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.DONOR_ASSIGNMENT_CHANGE,
            entityType: 'Donor',
            entityId: donorId,
            oldValue: { assignedToUserId: oldAssigneeId },
            newValue: { assignedToUserId: newAssigneeId },
            ipAddress,
            userAgent,
        });
    }
    async logDonationCreate(userId, donationId, donationData, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.DONATION_CREATE,
            entityType: 'Donation',
            entityId: donationId,
            newValue: donationData,
            ipAddress,
            userAgent,
        });
    }
    async logDonationUpdate(userId, donationId, oldData, newData, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.DONATION_UPDATE,
            entityType: 'Donation',
            entityId: donationId,
            oldValue: oldData,
            newValue: newData,
            ipAddress,
            userAgent,
        });
    }
    async logDonationDelete(userId, donationId, donationData, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.DONATION_DELETE,
            entityType: 'Donation',
            entityId: donationId,
            oldValue: donationData,
            ipAddress,
            userAgent,
        });
    }
    async logReceiptRegenerate(userId, donationId, metadata, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.RECEIPT_REGENERATE,
            entityType: 'Donation',
            entityId: donationId,
            metadata,
            ipAddress,
            userAgent,
        });
    }
    async logDataExport(userId, exportType, filters, recordCount, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.DATA_EXPORT,
            entityType: exportType,
            metadata: {
                filters,
                recordCount,
                exportedAt: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logRoleChange(userId, targetUserId, oldRole, newRole, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.ROLE_CHANGE,
            entityType: 'User',
            entityId: targetUserId,
            oldValue: { role: oldRole },
            newValue: { role: newRole },
            ipAddress,
            userAgent,
        });
    }
    async logFullAccessRequest(userId, donorId, reason, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.FULL_ACCESS_REQUEST,
            entityType: 'Donor',
            entityId: donorId,
            metadata: {
                reason,
                requestedAt: new Date().toISOString(),
            },
            ipAddress,
            userAgent,
        });
    }
    async logPledgeCreate(userId, pledgeId, pledgeData, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.PLEDGE_CREATE,
            entityType: 'Pledge',
            entityId: pledgeId,
            newValue: pledgeData,
            ipAddress,
            userAgent,
        });
    }
    async logPledgeUpdate(userId, pledgeId, oldData, newData, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.PLEDGE_UPDATE,
            entityType: 'Pledge',
            entityId: pledgeId,
            oldValue: oldData,
            newValue: newData,
            ipAddress,
            userAgent,
        });
    }
    async logPledgeDelete(userId, pledgeId, pledgeData, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.PLEDGE_DELETE,
            entityType: 'Pledge',
            entityId: pledgeId,
            oldValue: pledgeData,
            ipAddress,
            userAgent,
        });
    }
    async logPledgeFulfilled(userId, pledgeId, oldData, newData, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.PLEDGE_FULFILLED,
            entityType: 'Pledge',
            entityId: pledgeId,
            oldValue: oldData,
            newValue: newData,
            ipAddress,
            userAgent,
        });
    }
    async logPledgePostponed(userId, pledgeId, oldData, newData, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.PLEDGE_POSTPONED,
            entityType: 'Pledge',
            entityId: pledgeId,
            oldValue: oldData,
            newValue: newData,
            ipAddress,
            userAgent,
        });
    }
    async logPledgeCancelled(userId, pledgeId, oldData, newData, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.PLEDGE_CANCELLED,
            entityType: 'Pledge',
            entityId: pledgeId,
            oldValue: oldData,
            newValue: newData,
            ipAddress,
            userAgent,
        });
    }
    async logBeneficiaryCreate(userId, beneficiaryId, data, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.BENEFICIARY_CREATE,
            entityType: 'Beneficiary',
            entityId: beneficiaryId,
            newValue: data,
            ipAddress,
            userAgent,
        });
    }
    async logBeneficiaryUpdate(userId, beneficiaryId, oldData, newData, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.BENEFICIARY_UPDATE,
            entityType: 'Beneficiary',
            entityId: beneficiaryId,
            oldValue: oldData,
            newValue: newData,
            ipAddress,
            userAgent,
        });
    }
    async logBeneficiaryDelete(userId, beneficiaryId, data, ipAddress, userAgent) {
        await this.log({
            userId,
            action: client_1.AuditAction.BENEFICIARY_DELETE,
            entityType: 'Beneficiary',
            entityId: beneficiaryId,
            oldValue: data,
            ipAddress,
            userAgent,
        });
    }
    async logEmailSend(userId, entityType, entityId, metadata) {
        await this.log({
            userId,
            action: client_1.AuditAction.EMAIL_SEND,
            entityType,
            entityId,
            metadata,
        });
    }
    async logWhatsAppSend(userId, entityType, entityId, metadata) {
        await this.log({
            userId,
            action: client_1.AuditAction.WHATSAPP_SEND,
            entityType,
            entityId,
            metadata,
        });
    }
    async getAuditLogs(filters, page = 1, limit = 50) {
        const where = {};
        if (filters?.userId)
            where.userId = filters.userId;
        if (filters?.action)
            where.action = filters.action;
        if (filters?.entityType)
            where.entityType = filters.entityType;
        if (filters?.entityId)
            where.entityId = filters.entityId;
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate)
                where.createdAt.gte = filters.startDate;
            if (filters.endDate)
                where.createdAt.lte = filters.endDate;
        }
        const [items, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, name: true, email: true, role: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map