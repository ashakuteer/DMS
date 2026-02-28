import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { Role } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
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

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updateRole(
    id: string,
    role: Role,
    currentUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const oldRole = user.role;

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    await this.auditService.logRoleChange(
      currentUserId,
      id,
      oldRole,
      role,
      ipAddress,
      userAgent,
    );

    return updated;
  }

  async toggleActive(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  }

  // ✅ ADD THIS INSIDE THE CLASS (NOT OUTSIDE)
  async listStaffForAssignment() {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: [Role.ADMIN, Role.STAFF, Role.TELECALLER, Role.MANAGER] },
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

  async createStaff(data: { name: string; email: string; phone: string; role: string; password: string }) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] },
    });
    if (existing) {
      if (existing.email === data.email) {
        throw new ConflictException("A user with this email already exists");
      }
      throw new ConflictException("A user with this phone number already exists");
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role as any,
        password: hashedPassword,
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
    });
  }

  async reassignPhone(fromUserId: string, toUserId: string) {
    const fromUser = await this.prisma.user.findUnique({ where: { id: fromUserId } });
    if (!fromUser) throw new NotFoundException("Source staff member not found");
    if (!fromUser.phone) throw new BadRequestException("Source staff has no phone number");

    const toUser = await this.prisma.user.findUnique({ where: { id: toUserId } });
    if (!toUser) throw new NotFoundException("Target staff member not found");

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
      fromUser: { id: fromUser.id, name: fromUser.name, isActive: false },
      toUser: { id: toUser.id, name: toUser.name, phone: phoneNumber },
    };
  }

  async listAllStaff() {
    return this.prisma.user.findMany({
      where: {
        role: { in: [Role.STAFF, Role.TELECALLER, Role.MANAGER] },
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
}
