import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  Prisma,
  Role,
  DonorCategory,
  DonationFrequency,
  SupportPreference,
  HealthStatus,
  PersonRole,
} from "@prisma/client";
import { UserContext, DonorQueryOptions } from "./donors.types";
import { maskDonorData } from "../common/utils/masking.util";
import { DonorsEngagementService } from "./donors.engagement.service";

@Injectable()
export class DonorsCrudService {
  private readonly logger = new Logger(DonorsCrudService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly engagementService: DonorsEngagementService,
  ) {}

  private getAccessFilter(_user: UserContext): Prisma.DonorWhereInput {
    return {};
  }

  private computeLocationCategory(donor: { city?: string | null; state?: string | null; country?: string | null }): string {
    const city = (donor.city || "").trim().toLowerCase();
    const state = (donor.state || "").trim().toLowerCase();
    const country = (donor.country || "").trim().toLowerCase();
    if (city === "hyderabad") return "HYDERABAD";
    if (state === "telangana") return "TELANGANA_OTHER";
    if (country === "india" || !country) return "INDIA_OTHER";
    return "INTERNATIONAL";
  }

  private shouldMaskData(user: UserContext): boolean {
    return user.role !== Role.FOUNDER;
  }

  private readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private isValidUUID(id: string): boolean {
    return !!id && this.UUID_REGEX.test(id);
  }

  private async getActiveDonorOrThrow(id: string) {
    if (!this.isValidUUID(id)) {
      throw new NotFoundException("Donor not found");
    }

    const donor = await this.prisma.donor.findFirst({
      where: { id, isDeleted: false },
      select: { id: true, assignedToUserId: true },
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
      locationCategory,
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

    if (locationCategory) {
      if (locationCategory === "HYDERABAD") {
        where.city = { equals: "Hyderabad", mode: Prisma.QueryMode.insensitive };
      } else if (locationCategory === "TELANGANA_OTHER") {
        where.AND = [
          { state: { equals: "Telangana", mode: Prisma.QueryMode.insensitive } },
          { NOT: { city: { equals: "Hyderabad", mode: Prisma.QueryMode.insensitive } } },
        ];
      } else if (locationCategory === "INDIA_OTHER") {
        where.AND = [
          {
            OR: [
              { country: { equals: "India", mode: Prisma.QueryMode.insensitive } },
              { country: null },
              { country: "" },
            ],
          },
          { NOT: { state: { equals: "Telangana", mode: Prisma.QueryMode.insensitive } } },
        ];
      } else if (locationCategory === "INTERNATIONAL") {
        where.AND = [
          { country: { not: null } },
          { NOT: { country: { equals: "India", mode: Prisma.QueryMode.insensitive } } },
          { NOT: { country: "" } },
        ];
      }
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
          primaryRole: true,
          additionalRoles: true,
          donorTags: true,
          languages: true,
          preferredHomes: true,
          primaryHomeInterest: true,
          communicationChannels: true,
          donationFrequency: true,
          healthScore: true,
          healthStatus: true,
          profilePicUrl: true,
          assignedToUserId: true,
          donorSince: true,
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

    console.log('Total donors:', total);

    const donorIds = donors.map((d) => d.id);

    const engagementMap = donorIds.length
      ? await this.engagementService.computeEngagementScores(donorIds)
      : {};

    const donorsWithHealth = donors.map((donor) => ({
      ...donor,
      languages: (donor as any).languages ?? [],
      preferredHomes: (donor as any).preferredHomes ?? [],
      donorTags: (donor as any).donorTags ?? [],
      additionalRoles: (donor as any).additionalRoles ?? [],
      communicationChannels: (donor as any).communicationChannels ?? [],
      donationMethods: (donor as any).donationMethods ?? [],
      supportPreferences: (donor as any).supportPreferences ?? [],
      healthScore: engagementMap[donor.id]?.score ?? donor.healthScore ?? 100,
      healthStatus: engagementMap[donor.id]?.status ?? donor.healthStatus,
      healthReasons: engagementMap[donor.id]?.reasons ?? [],
      locationCategory: this.computeLocationCategory(donor),
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
    this.logger.log(`API received ID: "${id}"`);

    if (!id || !id.trim()) {
      this.logger.warn(`Empty donor ID received`);
      throw new NotFoundException("Donor not found");
    }

    try {
    const donor = await this.prisma.donor.findFirst({
      where: {
        id,
        isDeleted: false,
        ...this.getAccessFilter(user),
      },
      select: {
        id: true,
        donorCode: true,
        firstName: true,
        middleName: true,
        lastName: true,
        primaryPhone: true,
        primaryPhoneCode: true,
        alternatePhone: true,
        alternatePhoneCode: true,
        whatsappPhone: true,
        whatsappPhoneCode: true,
        personalEmail: true,
        officialEmail: true,
        address: true,
        city: true,
        state: true,
        country: true,
        pincode: true,
        profession: true,
        approximateAge: true,
        gender: true,
        incomeSpectrum: true,
        religion: true,
        donationMethods: true,
        donationFrequency: true,
        notes: true,
        prefEmail: true,
        prefWhatsapp: true,
        prefSms: true,
        prefReminders: true,
        timezone: true,
        category: true,
        isUnder18Helper: true,
        isSeniorCitizen: true,
        isSingleParent: true,
        isDisabled: true,
        sourceOfDonor: true,
        sourceDetails: true,
        pan: true,
        profilePicUrl: true,
        supportPreferences: true,
        engagementLevel: true,
        referredByDonorId: true,
        createdById: true,
        isDeleted: true,
        deletedAt: true,
        donorSince: true,
        createdAt: true,
        updatedAt: true,
        dobDay: true,
        dobMonth: true,
        healthScore: true,
        healthStatus: true,
        lastHealthCheck: true,
        assignedToUserId: true,
        primaryRole: true,
        additionalRoles: true,
        donorTags: true,
        languages: true,
        preferredHomes: true,
        primaryHomeInterest: true,
        communicationChannels: true,
        preferredCommunicationMethod: true,
        communicationNotes: true,
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
        individualProfile: true,
        volunteerProfile: true,
        influencerProfile: true,
        csrProfile: true,
        // ngoProfile excluded: table may not exist in all environments
      },
    });

    if (!donor) {
      throw new NotFoundException("Donor not found");
    }

    const donorWithComputed = {
      ...donor,
      locationCategory: this.computeLocationCategory(donor),
    };

    if (this.shouldMaskData(user)) {
      return maskDonorData(donorWithComputed);
    }

    return donorWithComputed;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error fetching donor ${id}: ${error instanceof Error ? error.message : String(error)}`);
      throw new InternalServerErrorException("Failed to fetch donor");
    }
  }

 async create(
  user: UserContext,
  data: any,
  ipAddress?: string,
  userAgent?: string,
) {
  const donorCode = `AKF-DNR-${Date.now()}`;

  const {
    individualProfile,
    volunteerProfile,
    influencerProfile,
    csrProfile,
    ngoProfile,
    ...donorData
  } = data;

  try {
    const donor = await this.prisma.donor.create({
      data: {
        donorCode: donorCode,
        donorSince: new Date(),
        ...donorData,
        createdById: user.id,
      },
    });

    if (individualProfile) {
      await this.prisma.individualDonorProfile.create({
        data: { donorId: donor.id, ...individualProfile },
      });
    }
    if (volunteerProfile) {
      await this.prisma.volunteerProfile.create({
        data: { donorId: donor.id, ...volunteerProfile },
      });
    }
    if (influencerProfile) {
      await this.prisma.influencerProfile.create({
        data: { donorId: donor.id, ...influencerProfile },
      });
    }
    if (csrProfile) {
      await this.prisma.cSRProfile.create({
        data: { donorId: donor.id, ...csrProfile },
      });
    }
    if (ngoProfile) {
      try {
        await this.prisma.ngoProfile.create({
          data: { donorId: donor.id, ...ngoProfile },
        });
      } catch (ngoErr) {
        this.logger.warn(`[DonorCreate] ngoProfile save skipped (table may not exist): ${ngoErr instanceof Error ? ngoErr.message : ngoErr}`);
      }
    }

    return donor;
  } catch (err) {
    this.logger.error(
      `[DonorCreate] Failed for user=${user.id} payload=${JSON.stringify({ ...donorData, primaryRole: data.primaryRole })} error=${err instanceof Error ? err.message : err}`,
      err instanceof Error ? err.stack : undefined,
    );
    throw err;
  }
}
async update(
  user: any,
  id: string,
  data: any,
  ipAddress?: string,
  userAgent?: string,
) {
  await this.getActiveDonorOrThrow(id);

  const {
    individualProfile,
    volunteerProfile,
    influencerProfile,
    csrProfile,
    ngoProfile,

    // ❌ REMOVE THESE FROM REST
    visited,
    visitedHome,
    professionType,

    ...rest
  } = data;

  const donorData: any = {
    ...rest,
    profession: rest.profession || professionType || null,
  };

  const donor = await this.prisma.donor.update({
    where: { id },
    data: donorData,
  });

  if (ngoProfile) {
    try {
      await this.prisma.ngoProfile.upsert({
        where: { donorId: id },
        create: { donorId: id, ...ngoProfile },
        update: { ...ngoProfile },
      });
    } catch (ngoErr) {
      this.logger.warn(`[DonorUpdate] ngoProfile save skipped (table may not exist): ${ngoErr instanceof Error ? ngoErr.message : ngoErr}`);
    }
  }

  return donor;
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
      select: { id: true },
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
