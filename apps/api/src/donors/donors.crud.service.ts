import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  Prisma,
  Role,
  DonorCategory,
  DonationFrequency,
  SupportPreference,
  HealthStatus,
} from "@prisma/client";
import { UserContext, DonorQueryOptions } from "./donors.types";
import { maskDonorData } from "../common/utils/masking.util";
import { DonorsEngagementService } from "./donors.engagement.service";

@Injectable()
export class DonorsCrudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engagementService: DonorsEngagementService,
  ) {}

  private getAccessFilter(user: UserContext): Prisma.DonorWhereInput {
    if (user.role === Role.TELECALLER) {
      return { assignedToUserId: user.id };
    }
    return {};
  }

  private shouldMaskData(user: UserContext): boolean {
    return user.role === Role.TELECALLER || user.role === Role.VIEWER;
  }

  private async getActiveDonorOrThrow(id: string) {
    const donor = await this.prisma.donor.findFirst({
      where: { id, isDeleted: false },
    });

    if (!donor) {
      throw new NotFoundException("Donor not found");
    }

    return donor;
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

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "firstName",
      "lastName",
      "donorCode",
      "city",
      "healthStatus",
    ] as const;

    const safeSortBy = allowedSortFields.includes(sortBy as any)
      ? (sortBy as (typeof allowedSortFields)[number])
      : "createdAt";

    const safeSortOrder: Prisma.SortOrder =
      sortOrder === "asc" ? "asc" : "desc";

    const where: Prisma.DonorWhereInput = {
      isDeleted: false,
      ...this.getAccessFilter(user),
    };

    if (search?.trim()) {
  const q = search.trim();
  where.OR = [
    { firstName: { contains: q, mode: "insensitive" } },
    { lastName: { contains: q, mode: "insensitive" } },
    { donorCode: { contains: q, mode: "insensitive" } },
    { primaryPhone: { contains: q, mode: "insensitive" } },
    { personalEmail: { contains: q, mode: "insensitive" } },
    { city: { contains: q, mode: "insensitive" } },
  ];
}

if (category) {
  where.category = category as DonorCategory;
}

if (city?.trim()) {
  where.city = {
    contains: city.trim(),
    mode: Prisma.QueryMode.insensitive,
  };
}

if (country?.trim()) {
  where.country = {
    contains: country.trim(),
    mode: Prisma.QueryMode.insensitive,
  };
}

if (religion?.trim()) {
  where.religion = {
    contains: religion.trim(),
    mode: Prisma.QueryMode.insensitive,
  };
}

if (assignedToUserId) {
  where.assignedToUserId = assignedToUserId;
}

    if (donationFrequency) {
      where.donationFrequency = donationFrequency as DonationFrequency;
    }

    if (supportPreferences) {
      const prefs = supportPreferences
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean) as SupportPreference[];

      if (prefs.length > 0) {
        where.supportPreferences = { hasSome: prefs };
      }
    }

    if (healthStatus && ["GREEN", "YELLOW", "RED"].includes(healthStatus)) {
      where.healthStatus = healthStatus as HealthStatus;
    }

    const [donors, total] = await Promise.all([
      this.prisma.donor.findMany({
        where,
        select: {
          id: true,
          donorCode: true,
          firstName: true,
          lastName: true,
          primaryPhone: true,
          whatsappPhone: true,
          personalEmail: true,
          city: true,
          country: true,
          category: true,
          donationFrequency: true,
          healthScore: true,
          healthStatus: true,
          profilePicUrl: true,
          assignedToUserId: true,
          createdAt: true,
          updatedAt: true,
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
        orderBy: { [safeSortBy]: safeSortOrder },
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
      }),
      this.prisma.donor.count({ where }),
    ]);

    const donorIds = donors.map((d) => d.id);

    const engagementMap = donorIds.length
      ? await this.engagementService.computeEngagementScores(donorIds)
      : {};

    const donorsWithHealth = donors.map((donor) => ({
      ...donor,
      healthScore: engagementMap[donor.id]?.score ?? donor.healthScore ?? 100,
      healthStatus: engagementMap[donor.id]?.status ?? donor.healthStatus,
      healthReasons: engagementMap[donor.id]?.reasons ?? [],
    }));

    const items = this.shouldMaskData(user)
      ? donorsWithHealth.map((donor) => maskDonorData(donor))
      : donorsWithHealth;

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
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
  const donorCode = `AKF-DNR-${Date.now()}`;

  return this.prisma.donor.create({
    data: {
      donorCode: donorCode,   // IMPORTANT

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
    const existing = await this.getActiveDonorOrThrow(id);

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
    deleteReason?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException("Only administrators can delete donors");
    }

    await this.getActiveDonorOrThrow(id);

    return this.prisma.donor.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.id,
        deleteReason: deleteReason ?? null,
      },
    });
  }

  async restore(user: UserContext, id: string) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException("Only administrators can restore donors");
    }

    const donor = await this.prisma.donor.findFirst({
      where: { id, isDeleted: true },
    });

    if (!donor) {
      throw new NotFoundException("Archived donor not found");
    }

    return this.prisma.donor.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deleteReason: null,
      },
    });
  }

  async findArchived(
    user: UserContext,
    search?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException("Only administrators can view archived records");
    }

    const where: any = { isDeleted: true };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { donorCode: { contains: search, mode: "insensitive" } },
        { primaryPhone: { contains: search } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.donor.count({ where }),
      this.prisma.donor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { deletedAt: "desc" },
        select: {
          id: true,
          donorCode: true,
          firstName: true,
          lastName: true,
          category: true,
          primaryPhone: true,
          deletedAt: true,
          deletedBy: true,
          deleteReason: true,
        },
      }),
    ]);

    return {
      data,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
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
    await this.getActiveDonorOrThrow(id);

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
