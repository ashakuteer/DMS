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
var RemindersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const communication_log_service_1 = require("../communication-log/communication-log.service");
const client_1 = require("@prisma/client");
let RemindersService = RemindersService_1 = class RemindersService {
    constructor(prisma, communicationLogService) {
        this.prisma = prisma;
        this.communicationLogService = communicationLogService;
        this.logger = new common_1.Logger(RemindersService_1.name);
    }
    async getDueReminders() {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return this.prisma.reminder.findMany({
            where: {
                status: 'PENDING',
                dueDate: {
                    lte: today,
                },
            },
            include: {
                donor: {
                    select: {
                        id: true,
                        donorCode: true,
                        firstName: true,
                        lastName: true,
                        primaryPhone: true,
                        personalEmail: true,
                    },
                },
                donation: {
                    select: {
                        id: true,
                        donationAmount: true,
                        receiptNumber: true,
                        donationDate: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { dueDate: 'asc' },
        });
    }
    async markComplete(id, userId, userRole) {
        const reminder = await this.prisma.reminder.findUnique({
            where: { id },
            include: { donor: { select: { id: true, firstName: true, lastName: true } } },
        });
        if (!reminder) {
            throw new Error('Reminder not found');
        }
        const updatedReminder = await this.prisma.reminder.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });
        await this.communicationLogService.create({
            donorId: reminder.donorId,
            donationId: reminder.donationId || undefined,
            channel: client_1.CommunicationChannel.EMAIL,
            type: client_1.CommunicationType.FOLLOW_UP,
            status: client_1.CommunicationStatus.TRIGGERED,
            messagePreview: `Follow-up reminder marked complete (${userRole})`,
            sentById: userId,
            metadata: { action: 'mark_complete', reminderId: id, userRole },
        });
        return updatedReminder;
    }
    async snooze(id, userId, userRole) {
        const reminder = await this.prisma.reminder.findUnique({
            where: { id },
            include: { donor: { select: { id: true, firstName: true, lastName: true } } },
        });
        if (!reminder) {
            throw new Error('Reminder not found');
        }
        const newDueDate = new Date(reminder.dueDate);
        newDueDate.setDate(newDueDate.getDate() + 30);
        const updatedReminder = await this.prisma.reminder.update({
            where: { id },
            data: {
                dueDate: newDueDate,
            },
        });
        await this.communicationLogService.create({
            donorId: reminder.donorId,
            donationId: reminder.donationId || undefined,
            channel: client_1.CommunicationChannel.EMAIL,
            type: client_1.CommunicationType.FOLLOW_UP,
            status: client_1.CommunicationStatus.TRIGGERED,
            messagePreview: `Follow-up reminder snoozed for 30 days (${userRole})`,
            sentById: userId,
            metadata: { action: 'snooze', reminderId: id, userRole, newDueDate: newDueDate.toISOString() },
        });
        return updatedReminder;
    }
    async logReminderAction(params) {
        const actionDescriptions = {
            send_email: 'Follow-up email sent from reminder',
            send_whatsapp: 'Follow-up WhatsApp opened from reminder',
        };
        const channelMap = {
            send_email: client_1.CommunicationChannel.EMAIL,
            send_whatsapp: client_1.CommunicationChannel.WHATSAPP,
        };
        return this.communicationLogService.create({
            donorId: params.donorId,
            donationId: params.donationId,
            channel: channelMap[params.action],
            type: client_1.CommunicationType.FOLLOW_UP,
            status: client_1.CommunicationStatus.TRIGGERED,
            messagePreview: `${actionDescriptions[params.action]} (${params.userRole})`,
            sentById: params.userId,
            metadata: { action: params.action, reminderId: params.reminderId, userRole: params.userRole },
        });
    }
};
exports.RemindersService = RemindersService;
exports.RemindersService = RemindersService = RemindersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        communication_log_service_1.CommunicationLogService])
], RemindersService);
//# sourceMappingURL=reminders.service.js.map