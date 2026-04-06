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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
let UsersService = class UsersService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async findAll(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limit,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    role: true,
                    assignedHome: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.user.count(),
        ]);
        return {
            items: users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        return user;
    }
    async updateRole(id, role, currentUserId, ipAddress, userAgent) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        const oldRole = user.role;
        const updated = await this.prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isActive: true,
            },
        });
        await this.auditService.logRoleChange(currentUserId, id, oldRole, role, ipAddress, userAgent);
        return updated;
    }
    async updateUser(id, data) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException("User not found");
        if (data.phone && data.phone !== user.phone) {
            const existing = await this.prisma.user.findUnique({ where: { phone: data.phone } });
            if (existing)
                throw new common_1.ConflictException("Phone number already in use");
        }
        return this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                assignedHome: true,
                isActive: true,
                updatedAt: true,
            },
        });
    }
    async toggleActive(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        return this.prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                isActive: true,
            },
        });
    }
    async listStaffForAssignment() {
        return this.prisma.user.findMany({
            where: {
                isActive: true,
                role: { in: [client_1.Role.FOUNDER, client_1.Role.ADMIN, client_1.Role.STAFF, client_1.Role.TELECALLER, client_1.Role.ACCOUNTANT, client_1.Role.OFFICE_ASSISTANT] },
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
            orderBy: { name: "asc" },
        });
    }
    async createStaff(data) {
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    ...(data.phone ? [{ phone: data.phone }] : []),
                ],
            },
        });
        if (existing) {
            if (existing.email === data.email) {
                throw new common_1.ConflictException("A user with this email already exists");
            }
            throw new common_1.ConflictException("A user with this phone number already exists");
        }
        const bcrypt = await Promise.resolve().then(() => __importStar(require("bcryptjs")));
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone || null,
                role: data.role,
                password: hashedPassword,
                ...(data.assignedHome ? { assignedHome: data.assignedHome } : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                assignedHome: true,
                isActive: true,
                createdAt: true,
            },
        });
    }
    async resetUserPassword(id, newPassword) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException("User not found");
        const bcrypt = await Promise.resolve().then(() => __importStar(require("bcryptjs")));
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword, refreshToken: null },
        });
        return { message: "Password updated successfully" };
    }
    async reassignPhone(fromUserId, toUserId) {
        const fromUser = await this.prisma.user.findUnique({ where: { id: fromUserId } });
        if (!fromUser)
            throw new common_1.NotFoundException("Source staff member not found");
        if (!fromUser.phone)
            throw new common_1.BadRequestException("Source staff has no phone number");
        const toUser = await this.prisma.user.findUnique({ where: { id: toUserId } });
        if (!toUser)
            throw new common_1.NotFoundException("Target staff member not found");
        const phoneNumber = fromUser.phone;
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: fromUserId },
                data: { phone: null, isActive: false },
            }),
            this.prisma.user.update({
                where: { id: toUserId },
                data: { phone: phoneNumber },
            }),
        ]);
        return {
            success: true,
            message: `Phone ${phoneNumber} transferred from ${fromUser.name} to ${toUser.name}`,
        };
    }
    async listAllStaff() {
        return this.prisma.user.findMany({
            where: {
                role: { in: [client_1.Role.STAFF, client_1.Role.TELECALLER, client_1.Role.ACCOUNTANT, client_1.Role.OFFICE_ASSISTANT, client_1.Role.ADMIN] },
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { name: "asc" },
        });
    }
    async deleteUser(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException("User not found");
        return this.prisma.user.update({
            where: { id },
            data: { isActive: false },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
            },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map