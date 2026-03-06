import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "@prisma/client";
import { UserContext, DonorQueryOptions } from "./donors.types";
import { maskDonorData } from "../common/utils/masking.util";
import { DonorsEngagementService } from "./donors.engagement.service";

@Injectable()
export class DonorsCrudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engagementService: DonorsEngagementService,
  ) {}

  private getAccessFilter(user: UserContext): any {
    if (user.role === Role.TELECALLER) {
      return { assignedToUserId: user.id };
    }
    return {};
  }

  private shouldMaskData(user: UserContext): boolean {
    return user.role === Role.TELECALLER || user.role === Role.VIEWER;
  }

  async findAll(user: UserContext, options: DonorQueryOptions = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      category,
      city,
      country,
      religion,
      assignedToUserId,
      donationFrequency,
      healthStatus,
      supportPreferences,
    } = options;

    const accessFilter = this.getAccessFilter(user);

    const where: any = {
      isDeleted: false,
      ...accessFilter,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { donorCode: { contains: search, mode: "insensitive" } },
        { primaryPhone: { contains: search, mode: "insensitive" } },
        { personalEmail: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) where.category = category;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (country) where.country = { contains: country, mode: "insensitive" };
    if (religion) where.religion = { contains: religion, mode: "insensitive" };
    if (assignedToUserId) where.assignedToUserId = assignedToUserId;
    if (donationFrequency) where.donationFrequency = donationFrequency;

    if (supportPreferences) {
      const prefs = supportPreferences
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      if (prefs.length > 0) {
        where.supportPreferences = { hasSome: prefs };
      }
    }

    if (healthStatus && ["GREEN", "YELLOW", "RED"].includes(healthStatus)) {
      where.healthStatus = healthStatus;
    }

    const [donors, total] = await Promise.all([
      this.prisma.donor.findMany({
        where,
        include: {
          assignedToUser: {
            select: { id: true, name: true, email: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
          _count: {
            select: { donations: true, pledges: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.donor.count({ where }),
    ]);

    const donorIds = donors.map((d) => d.id);
    const engagementMap =
      await this.engagementService.computeEngagementScores(donorIds);

    const donorsWithHealth = donors.map((donor) => ({
      ...donor,
      healthScore: engagementMap[donor.id]?.score ?? 100,
      healthStatus: engagementMap[donor.id]?.status ?? donor.healthStatus,
      healthReasons: engagementMap[donor.id]?.reasons ?? [],
    }));

    const maskedDonors = this.shouldMaskData(user)
      ? donorsWithHealth.map((donor) => maskDonorData(donor))
      : donorsWithHealth;

    return {
      items: maskedDonors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(user: UserContext, id: string) {
    const donor = await this.prisma.donor.findFirst({
      where: {
        id,
        isDeleted: false,
        ...this.getAccessFilter(user),
      },
      include: {
        assignedToUser: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        specialOccasions: true,
        familyMembers: true,
        donations: {
          where: { isDeleted: false },
          orderBy: { donationDate: "desc" },
          take: 5,
        },
        pledges: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        sponsorships: true,
      },
    });

    if (!donor) {
      throw new NotFoundException("Donor not found");
    }

    if (this.shouldMaskData(user)) {
      return maskDonorData(donor);
    }

    return donor;
  }

  async create(
    user: UserContext,
    data: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.donor.create({
      data: {
        ...data,
        createdById: user.id,
      },
    });
  }

  async update(
    user: UserContext,
    id: string,
    data: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.donor.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException("Donor not found");
    }

    if (
      user.role === Role.TELECALLER &&
      existing.assignedToUserId !== user.id
    ) {
      throw new ForbiddenException(
        "You do not have permission to update this donor",
      );
    }

    return this.prisma.donor.update({
      where: { id },
      data,
    });
  }

  async softDelete(
    user: UserContext,
    id: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException("Only administrators can delete donors");
    }

    const existing = await this.prisma.donor.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException("Donor not found");
    }

    return this.prisma.donor.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async lookupByPhone(phone: string): Promise<{ found: boolean; donor?: any }> {
    const cleaned = phone.replace(/[\s\-\(\)\+\.]/g, "");
    const normalizedPhone = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;

    if (normalizedPhone.length < 10) {
      return { found: false };
    }

    const donor = await this.prisma.donor.findFirst({
      where: {
        isDeleted: false,
        OR: [
          { primaryPhone: { endsWith: normalizedPhone } },
          { whatsappPhone: { endsWith: normalizedPhone } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        donorCode: true,
        primaryPhone: true,
        personalEmail: true,
      },
    });

    if (!donor) {
      return { found: false };
    }

    return {
      found: true,
      donor: {
        id: donor.id,
        firstName: donor.firstName,
        lastName: donor.lastName,
        donorCode: donor.donorCode,
        primaryPhone: donor.primaryPhone,
        personalEmail: donor.personalEmail,
      },
    };
  }

  async assignDonor(id: string, assignedToUserId: string | null) {
    const donor = await this.prisma.donor.findFirst({
      where: { id, isDeleted: false },
    });

    if (!donor) {
      throw new NotFoundException("Donor not found");
    }

    return this.prisma.donor.update({
      where: { id },
      data: { assignedToUserId },
    });
  }

  async countDonorsByAssignee(userId: string) {
    return this.prisma.donor.count({
      where: {
        assignedToUserId: userId,
        isDeleted: false,
      },
    });
  }

  async bulkReassignDonors(fromUserId: string, toUserId: string) {
    const result = await this.prisma.donor.updateMany({
      where: {
        assignedToUserId: fromUserId,
        isDeleted: false,
      },
      data: {
        assignedToUserId: toUserId,
      },
    });

    return { count: result.count };
  }
}
