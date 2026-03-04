import ExcelJS from "exceljs";
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { RolePermissionsService } from "../role-permissions/role-permissions.service";
import { EmailService } from "../email/email.service";
import { EmailJobsService, CreateEmailJobDto } from "../email-jobs/email-jobs.service";
import { OrganizationProfileService } from "../organization-profile/organization-profile.service";

import {
  Role,
  HomeType,
  BeneficiaryStatus,
  SponsorshipType,
  SponsorshipFrequency,
  BeneficiaryEventType,
  SponsorshipStatus,
  DonationType,
  DonationPurpose,
  DonationMode,
  DonationHomeType,
  ProgressTerm,
  HealthEventSeverity,
  BeneficiaryHealthStatus,
  DocumentOwnerType,
  DocumentType,
} from "@prisma/client";

import { Decimal } from "@prisma/client/runtime/library";
export interface UserContext {
  id: string;
  role: Role;
  email: string;
}

export interface BeneficiaryQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  homeType?: HomeType;
  status?: BeneficiaryStatus;
  sponsored?: boolean;
  classGrade?: string;
  school?: string;
  academicYear?: string;
}

export interface CreateBeneficiaryDto {
  fullName: string;
  homeType: HomeType;
  gender?: string;
  dobDay?: number;
  dobMonth?: number;
  dobYear?: number;
  approxAge?: number;
  joinDate?: string;
  heightCmAtJoin?: number;
  weightKgAtJoin?: number;
  educationClassOrRole?: string;
  schoolOrCollege?: string;
  healthNotes?: string;
  currentHealthStatus?: string;
  background?: string;
  hobbies?: string;
  dreamCareer?: string;
  favouriteSubject?: string;
  favouriteGame?: string;
  favouriteActivityAtHome?: string;
  bestFriend?: string;
  sourceOfPrideOrHappiness?: string;
  funFact?: string;
  additionalNotes?: string;
  protectPrivacy?: boolean;
  photoUrl?: string;
}

export interface CreateMetricDto {
  recordedOn?: string;
  heightCm?: number;
  weightKg?: number;
  healthStatus?: string;
  notes?: string;
}

export interface CreateProgressCardDto {
  academicYear: string;
  term: ProgressTerm;
  classGrade: string;
  school?: string;
  overallPercentage?: number;
  remarks?: string;
  fileDocumentId?: string;
}

export interface CreateHealthEventDto {
  eventDate: string;
  title: string;
  description: string;
  severity?: HealthEventSeverity;
  requiresDonorUpdate?: boolean;
  shareWithDonor?: boolean;
  documentId?: string;
}

export interface CreateDocumentDto {
  ownerType: DocumentOwnerType;
  ownerId?: string;
  docType: DocumentType;
  title: string;
  description?: string;
  storageBucket: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  isSensitive?: boolean;
  shareWithDonor?: boolean;
}

export interface CreateReportCampaignDto {
  name: string;
  type: 'QUARTERLY' | 'ANNUAL';
  periodStart: string;
  periodEnd: string;
  documentId?: string;
  target?: 'ALL_DONORS' | 'SPONSORS_ONLY' | 'CUSTOM';
}

export interface UpdateBeneficiaryDto extends Partial<CreateBeneficiaryDto> {
  status?: BeneficiaryStatus;
}

export interface CreateSponsorshipDto {
  donorId: string;
  sponsorshipType: SponsorshipType;
  amount?: number;
  currency?: string;
  inKindItem?: string;
  frequency?: SponsorshipFrequency;
  startDate?: string;
  endDate?: string;
  notes?: string;
  dueDayOfMonth?: number;
  status?: string;
}

export interface UpdateSponsorshipDto extends Partial<Omit<CreateSponsorshipDto, 'donorId'>> {
  isActive?: boolean;
  status?: string;
}

export interface CreateBeneficiaryUpdateDto {
  title: string;
  content: string;
  updateType?: 'GENERAL' | 'MILESTONE' | 'ACADEMIC' | 'HEALTH' | 'EDUCATION' | 'ACHIEVEMENT' | 'PHOTO' | 'EVENT' | 'THANK_YOU';
  isPrivate?: boolean;
  mediaUrls?: string[];
  documentIds?: string[];
}

export interface CreateTimelineEventDto {
  eventType: BeneficiaryEventType;
  eventDate: string;
  description: string;
}

@Injectable()
export class BeneficiariesService {
  private readonly logger = new Logger(BeneficiariesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private rolePermissionsService: RolePermissionsService,
    private emailService: EmailService,
    private emailJobsService: EmailJobsService,
    private orgProfileService: OrganizationProfileService,
  ) {}

  private canViewSensitiveBeneficiaryData(user: UserContext): boolean {
    return this.rolePermissionsService.hasPermission(user.role, 'beneficiaries', 'viewSensitive');
  }

  private async generateBeneficiaryCode(): Promise<string> {
    const lastBeneficiary = await this.prisma.beneficiary.findFirst({
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    let nextNum = 1;
    if (lastBeneficiary?.code) {
      const match = lastBeneficiary.code.match(/AKF-BEN-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }

    return `AKF-BEN-${String(nextNum).padStart(6, '0')}`;
  }

  async findAll(user: UserContext, options: BeneficiaryQueryOptions = {}) {
    const { 
      page = 1, 
      limit = 20, 
      search,
      homeType,
      status,
      sponsored,
      classGrade,
      school,
      academicYear,
    } = options;

    const where: any = {
      isDeleted: false,
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (homeType) {
      where.homeType = homeType;
    }

    if (status) {
      where.status = status;
    }

    if (sponsored !== undefined) {
      if (sponsored) {
        where.sponsorships = { some: { isActive: true, status: 'ACTIVE' } };
      } else {
        where.sponsorships = { none: { isActive: true, status: 'ACTIVE' } };
      }
    }

    if (classGrade) {
      where.educationClassOrRole = { contains: classGrade, mode: 'insensitive' };
    }

    if (school) {
      where.schoolOrCollege = { contains: school, mode: 'insensitive' };
    }

    if (academicYear) {
      where.progressCards = { some: { academicYear: { contains: academicYear, mode: 'insensitive' } } };
    }

    const [beneficiaries, total] = await Promise.all([
      this.prisma.beneficiary.findMany({
        where,
        include: {
          sponsorships: {
            where: { isActive: true, status: 'ACTIVE' },
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.beneficiary.count({ where }),
    ]);

    const formatted = beneficiaries.map(b => ({
      id: b.id,
      code: b.code,
      fullName: b.fullName,
      homeType: b.homeType,
      gender: b.gender,
      dobDay: b.dobDay,
      dobMonth: b.dobMonth,
      approxAge: b.approxAge,
      educationClassOrRole: b.educationClassOrRole,
      schoolOrCollege: b.schoolOrCollege,
      photoUrl: b.photoUrl,
      status: b.status,
      protectPrivacy: b.protectPrivacy,
      activeSponsorsCount: b.sponsorships.length,
      createdAt: b.createdAt,
    }));

    return {
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: { id, isDeleted: false },
      include: {
        sponsorships: {
          where: { isActive: true, status: 'ACTIVE' },
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
          },
          orderBy: { createdAt: 'desc' },
        },
        updates: {
          include: {
            createdBy: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        timelineEvents: {
          orderBy: { eventDate: 'desc' },
          take: 20,
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    return {
      ...beneficiary,
      activeSponsorsCount: beneficiary.sponsorships.length,
      updatesCount: await this.prisma.beneficiaryUpdate.count({
        where: { beneficiaryId: id },
      }),
    };
  }

  async create(user: UserContext, dto: CreateBeneficiaryDto) {
    if (!dto.fullName || !dto.homeType) {
      throw new BadRequestException('Full name and home type are required');
    }

    const code = await this.generateBeneficiaryCode();

    const beneficiary = await this.prisma.beneficiary.create({
      data: {
        code,
        fullName: dto.fullName,
        homeType: dto.homeType as HomeType,
        gender: dto.gender as any,
        dobDay: dto.dobDay,
        dobMonth: dto.dobMonth,
        dobYear: dto.dobYear,
        approxAge: dto.approxAge,
        joinDate: dto.joinDate ? new Date(dto.joinDate) : undefined,
        heightCmAtJoin: dto.heightCmAtJoin,
        weightKgAtJoin: dto.weightKgAtJoin,
        educationClassOrRole: dto.educationClassOrRole,
        schoolOrCollege: dto.schoolOrCollege,
        healthNotes: dto.healthNotes,
        currentHealthStatus: dto.currentHealthStatus,
        background: dto.background,
        hobbies: dto.hobbies,
        dreamCareer: dto.dreamCareer,
        favouriteSubject: dto.favouriteSubject,
        favouriteGame: dto.favouriteGame,
        favouriteActivityAtHome: dto.favouriteActivityAtHome,
        bestFriend: dto.bestFriend,
        sourceOfPrideOrHappiness: dto.sourceOfPrideOrHappiness,
        funFact: dto.funFact,
        additionalNotes: dto.additionalNotes,
        protectPrivacy: dto.protectPrivacy ?? false,
        photoUrl: dto.photoUrl,
        createdById: user.id,
      },
    });

    // Auto-create timeline event for profile creation
    await this.prisma.beneficiaryTimelineEvent.create({
      data: {
        beneficiaryId: beneficiary.id,
        eventType: BeneficiaryEventType.PROFILE_CREATED,
        eventDate: new Date(),
        description: `Profile created for ${beneficiary.fullName}`,
      },
    });

    await this.auditService.logBeneficiaryCreate(
      user.id,
      beneficiary.id,
      beneficiary as any,
    );

    return beneficiary;
  }

  async update(user: UserContext, id: string, dto: UpdateBeneficiaryDto) {
    const existing = await this.prisma.beneficiary.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Beneficiary not found');
    }

    const updateData: any = {};

    if (dto.fullName !== undefined) updateData.fullName = dto.fullName;
    if (dto.homeType !== undefined) updateData.homeType = dto.homeType as HomeType;
    if (dto.gender !== undefined) updateData.gender = dto.gender as any;
    if (dto.dobDay !== undefined) updateData.dobDay = dto.dobDay;
    if (dto.dobMonth !== undefined) updateData.dobMonth = dto.dobMonth;
    if (dto.dobYear !== undefined) updateData.dobYear = dto.dobYear;
    if (dto.approxAge !== undefined) updateData.approxAge = dto.approxAge;
    if (dto.joinDate !== undefined) updateData.joinDate = dto.joinDate ? new Date(dto.joinDate) : null;
    if (dto.heightCmAtJoin !== undefined) updateData.heightCmAtJoin = dto.heightCmAtJoin;
    if (dto.weightKgAtJoin !== undefined) updateData.weightKgAtJoin = dto.weightKgAtJoin;
    if (dto.educationClassOrRole !== undefined) updateData.educationClassOrRole = dto.educationClassOrRole;
    if (dto.schoolOrCollege !== undefined) updateData.schoolOrCollege = dto.schoolOrCollege;
    if (dto.healthNotes !== undefined) updateData.healthNotes = dto.healthNotes;
    if (dto.currentHealthStatus !== undefined) updateData.currentHealthStatus = dto.currentHealthStatus;
    if (dto.background !== undefined) updateData.background = dto.background;
    if (dto.hobbies !== undefined) updateData.hobbies = dto.hobbies;
    if (dto.dreamCareer !== undefined) updateData.dreamCareer = dto.dreamCareer;
    if (dto.favouriteSubject !== undefined) updateData.favouriteSubject = dto.favouriteSubject;
    if (dto.favouriteGame !== undefined) updateData.favouriteGame = dto.favouriteGame;
    if (dto.favouriteActivityAtHome !== undefined) updateData.favouriteActivityAtHome = dto.favouriteActivityAtHome;
    if (dto.bestFriend !== undefined) updateData.bestFriend = dto.bestFriend;
    if (dto.sourceOfPrideOrHappiness !== undefined) updateData.sourceOfPrideOrHappiness = dto.sourceOfPrideOrHappiness;
    if (dto.funFact !== undefined) updateData.funFact = dto.funFact;
    if (dto.additionalNotes !== undefined) updateData.additionalNotes = dto.additionalNotes;
    if (dto.protectPrivacy !== undefined) updateData.protectPrivacy = dto.protectPrivacy;
    if (dto.photoUrl !== undefined) updateData.photoUrl = dto.photoUrl;
    if (dto.status !== undefined) updateData.status = dto.status as BeneficiaryStatus;

    const beneficiary = await this.prisma.beneficiary.update({
      where: { id },
      data: updateData,
    });

    // Auto-create timeline event for profile update
    const changedFields = Object.keys(updateData);
    if (changedFields.length > 0) {
      const fieldDescriptions = changedFields.map(field => {
        switch (field) {
          case 'fullName': return 'name';
          case 'homeType': return 'home assignment';
          case 'gender': return 'gender';
          case 'dobMonth':
          case 'dobDay':
          case 'dobYear': return 'date of birth';
          case 'approxAge': return 'age';
          case 'joinDate': return 'join date';
          case 'educationClassOrRole': return 'education status';
          case 'schoolOrCollege': return 'school/college';
          case 'healthNotes': return 'health notes';
          case 'currentHealthStatus': return 'health status';
          case 'background': return 'background';
          case 'hobbies': return 'hobbies';
          case 'dreamCareer': return 'dream career';
          case 'favouriteSubject': return 'favourite subject';
          case 'favouriteGame': return 'favourite game';
          case 'favouriteActivityAtHome': return 'favourite activity';
          case 'bestFriend': return 'best friend';
          case 'sourceOfPrideOrHappiness': return 'pride/happiness';
          case 'funFact': return 'fun fact';
          case 'additionalNotes': return 'notes';
          case 'protectPrivacy': return 'privacy settings';
          case 'status': return 'status';
          default: return field;
        }
      });
      
      const uniqueFields = [...new Set(fieldDescriptions)];
      const description = `Profile updated: ${uniqueFields.slice(0, 3).join(', ')}${uniqueFields.length > 3 ? ` and ${uniqueFields.length - 3} more` : ''}`;
      
      await this.prisma.beneficiaryTimelineEvent.create({
        data: {
          beneficiaryId: id,
          eventType: BeneficiaryEventType.PROFILE_UPDATED,
          eventDate: new Date(),
          description,
        },
      });
    }

    await this.auditService.logBeneficiaryUpdate(
      user.id,
      id,
      existing as any,
      beneficiary as any,
    );

    return beneficiary;
  }

  async delete(user: UserContext, id: string) {
    const existing = await this.prisma.beneficiary.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Beneficiary not found');
    }

    await this.prisma.beneficiary.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await this.auditService.logBeneficiaryDelete(
      user.id,
      id,
      existing as any,
    );

    return { success: true };
  }

  async updatePhoto(id: string, photoUrl: string | null, photoPath?: string | null) {
    const existing = await this.prisma.beneficiary.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Beneficiary not found');
    }

    const updateData: any = { photoUrl };
    if (photoPath !== undefined) updateData.photoPath = photoPath;

    const beneficiary = await this.prisma.beneficiary.update({
      where: { id },
      data: updateData,
    });

    // Auto-create timeline event for photo update
    await this.prisma.beneficiaryTimelineEvent.create({
      data: {
        beneficiaryId: id,
        eventType: BeneficiaryEventType.PHOTO_UPDATED,
        eventDate: new Date(),
        description: 'Profile photo updated',
      },
    });

    return beneficiary;
  }

  async getSponsors(beneficiaryId: string) {
    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: { id: beneficiaryId, isDeleted: false },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    return this.prisma.sponsorship.findMany({
      where: { beneficiaryId },
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addSponsor(user: UserContext, beneficiaryId: string, dto: CreateSponsorshipDto) {
    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: { id: beneficiaryId, isDeleted: false },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    const donor = await this.prisma.donor.findFirst({
      where: { id: dto.donorId, isDeleted: false },
    });

    if (!donor) {
      throw new NotFoundException('Donor not found');
    }

    const existingActive = await this.prisma.sponsorship.findFirst({
      where: {
        donorId: dto.donorId,
        beneficiaryId,
        sponsorshipType: dto.sponsorshipType,
        isActive: true,
        status: 'ACTIVE',
      },
    });

    if (existingActive) {
      throw new BadRequestException('An active sponsorship of this type already exists for this donor-beneficiary pair');
    }

    const resolvedStatus = dto.status === 'PAUSED' ? SponsorshipStatus.PAUSED :
                           dto.status === 'STOPPED' ? SponsorshipStatus.STOPPED :
                           SponsorshipStatus.ACTIVE;
    const resolvedIsActive = resolvedStatus === SponsorshipStatus.ACTIVE;
    const resolvedDueDay = dto.dueDayOfMonth ?? (dto.startDate ? new Date(dto.startDate).getDate() : null);

    const sponsorship = await this.prisma.sponsorship.create({
      data: {
        donorId: dto.donorId,
        beneficiaryId,
        sponsorshipType: dto.sponsorshipType,
        amount: dto.amount ? new Decimal(dto.amount) : undefined,
        currency: dto.currency ?? 'INR',
        inKindItem: dto.inKindItem,
        frequency: dto.frequency ?? SponsorshipFrequency.ADHOC,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        notes: dto.notes,
        isActive: resolvedIsActive,
        status: resolvedStatus,
        dueDayOfMonth: resolvedDueDay,
      },
      include: {
        donor: {
          select: {
            id: true,
            donorCode: true,
            firstName: true,
            lastName: true,
          },
        },
        beneficiary: {
          select: {
            id: true,
            code: true,
            fullName: true,
          },
        },
      },
    });

    // Auto-create timeline event for sponsorship added
    await this.prisma.beneficiaryTimelineEvent.create({
      data: {
        beneficiaryId,
        eventType: BeneficiaryEventType.SPONSORSHIP_ADDED,
        eventDate: new Date(),
        description: `New sponsorship added by ${donor.firstName} ${donor.lastName || ''} (${dto.sponsorshipType})`,
      },
    });

    return sponsorship;
  }

  async updateSponsorship(user: UserContext, sponsorshipId: string, dto: UpdateSponsorshipDto) {
    const existing = await this.prisma.sponsorship.findUnique({
      where: { id: sponsorshipId },
    });

    if (!existing) {
      throw new NotFoundException('Sponsorship not found');
    }

    const updateData: any = {};

    if (dto.sponsorshipType !== undefined) updateData.sponsorshipType = dto.sponsorshipType;
    if (dto.amount !== undefined) updateData.amount = dto.amount ? new Decimal(dto.amount) : null;
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.inKindItem !== undefined) updateData.inKindItem = dto.inKindItem;
    if (dto.frequency !== undefined) updateData.frequency = dto.frequency;
    if (dto.startDate !== undefined) updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.dueDayOfMonth !== undefined) updateData.dueDayOfMonth = dto.dueDayOfMonth;
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
      updateData.status = dto.isActive ? SponsorshipStatus.ACTIVE : SponsorshipStatus.STOPPED;
    }
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      updateData.isActive = dto.status === 'ACTIVE';
      if ((dto.status === 'COMPLETED' || dto.status === 'STOPPED') && !dto.endDate && !existing.endDate) {
        updateData.endDate = new Date();
      }
    }

    const statusChanged = updateData.status && updateData.status !== existing.status;
    const amountChanged = updateData.amount !== undefined && (
      (existing.amount === null && updateData.amount !== null) ||
      (existing.amount !== null && updateData.amount === null) ||
      (existing.amount !== null && updateData.amount !== null && !existing.amount.equals(updateData.amount))
    );

    const updated = await this.prisma.sponsorship.update({
      where: { id: sponsorshipId },
      data: updateData,
      include: {
        donor: {
          select: { id: true, donorCode: true, firstName: true, lastName: true },
        },
        beneficiary: {
          select: { id: true, code: true, fullName: true },
        },
      },
    });

    if (statusChanged || amountChanged) {
      await this.prisma.sponsorshipStatusHistory.create({
        data: {
          sponsorshipId,
          oldStatus: existing.status,
          newStatus: updateData.status || existing.status,
          oldAmount: existing.amount,
          newAmount: updateData.amount !== undefined ? updateData.amount : existing.amount,
          note: dto.notes || (statusChanged ? `Status changed from ${existing.status} to ${updateData.status}` : `Amount updated`),
          changedById: user.id,
        },
      });
    }

    return updated;
  }

  async deleteSponsorship(sponsorshipId: string) {
    const existing = await this.prisma.sponsorship.findUnique({
      where: { id: sponsorshipId },
    });

    if (!existing) {
      throw new NotFoundException('Sponsorship not found');
    }

    await this.prisma.sponsorship.delete({
      where: { id: sponsorshipId },
    });

    return { success: true };
  }

  async getSponsorshipHistory(sponsorshipId: string) {
    const existing = await this.prisma.sponsorship.findUnique({
      where: { id: sponsorshipId },
    });

    if (!existing) {
      throw new NotFoundException('Sponsorship not found');
    }

    return this.prisma.sponsorshipStatusHistory.findMany({
      where: { sponsorshipId },
      include: {
        changedBy: { select: { id: true, name: true } },
      },
      orderBy: { changedAt: 'desc' },
    });
  }

  async getUpdates(beneficiaryId: string) {
    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: { id: beneficiaryId, isDeleted: false },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    return this.prisma.beneficiaryUpdate.findMany({
      where: { beneficiaryId },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
        attachments: {
          include: {
            document: {
              select: { id: true, title: true, docType: true, storagePath: true, mimeType: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addUpdate(user: UserContext, beneficiaryId: string, dto: CreateBeneficiaryUpdateDto) {
    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: { id: beneficiaryId, isDeleted: false },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    const update = await this.prisma.beneficiaryUpdate.create({
      data: {
        beneficiaryId,
        title: dto.title,
        content: dto.content,
        updateType: (dto.updateType as any) ?? 'GENERAL',
        isPrivate: dto.isPrivate ?? false,
        mediaUrls: dto.mediaUrls ?? [],
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (dto.documentIds && dto.documentIds.length > 0) {
      const validDocs = await this.prisma.document.findMany({
        where: {
          id: { in: dto.documentIds },
          ownerId: beneficiaryId,
          ownerType: 'BENEFICIARY',
          isSensitive: false,
        },
        select: { id: true },
      });
      const validDocIds = validDocs.map((d) => d.id);
      if (validDocIds.length > 0) {
        await this.prisma.updateAttachment.createMany({
          data: validDocIds.map((documentId) => ({
            updateId: update.id,
            documentId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Auto-create timeline event for update added
    await this.prisma.beneficiaryTimelineEvent.create({
      data: {
        beneficiaryId,
        eventType: BeneficiaryEventType.UPDATE_ADDED,
        eventDate: new Date(),
        description: `New update: ${dto.title}`,
      },
    });

    const result = await this.prisma.beneficiaryUpdate.findUnique({
      where: { id: update.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        attachments: { include: { document: true } },
      },
    });

    return result;
  }

  async sendUpdateToSponsors(
    user: UserContext,
    updateId: string,
    donorIds: string[] | undefined,
    channel: 'EMAIL' | 'WHATSAPP',
  ) {
    const update = await this.prisma.beneficiaryUpdate.findUnique({
      where: { id: updateId },
      include: {
        beneficiary: {
          select: {
            id: true,
            fullName: true,
            homeType: true,
            photoUrl: true,
          },
        },
      },
    });

    if (!update) {
      throw new NotFoundException('Update not found');
    }

    // Privacy enforcement: Don't allow sending private updates to sponsors
    if (update.isPrivate) {
      throw new BadRequestException('Cannot send private updates to sponsors');
    }

    // If no donorIds provided, get all active sponsors for this beneficiary
    let targetDonorIds = donorIds;
    if (!targetDonorIds || targetDonorIds.length === 0) {
      const sponsors = await this.prisma.sponsorship.findMany({
        where: {
          beneficiaryId: update.beneficiaryId,
          isActive: true,
          status: 'ACTIVE',
        },
        select: { donorId: true },
      });
      targetDonorIds = sponsors.map((s) => s.donorId);
    }

    if (targetDonorIds.length === 0) {
      return {
        updateId,
        dispatchCount: 0,
        channel,
        message: 'No sponsors to send to',
      };
    }

    // Create dispatch records for each donor
    const dispatches = await Promise.all(
      targetDonorIds.map(async (donorId) => {
        // Check if dispatch already exists
        const existing = await this.prisma.sponsorUpdateDispatch.findFirst({
          where: {
            updateId,
            donorId,
            channel: channel as any,
          },
        });

        if (existing) {
          return existing;
        }

        return this.prisma.sponsorUpdateDispatch.create({
          data: {
            updateId,
            donorId,
            channel: channel as any,
            status: channel === 'EMAIL' ? 'QUEUED' : 'QUEUED',
          },
        });
      }),
    );

    return {
      updateId,
      dispatchCount: dispatches.length,
      channel,
    };
  }

  async markDispatchCopied(dispatchId: string) {
    const dispatch = await this.prisma.sponsorUpdateDispatch.findUnique({
      where: { id: dispatchId },
    });

    if (!dispatch) {
      throw new NotFoundException('Dispatch not found');
    }

    return this.prisma.sponsorUpdateDispatch.update({
      where: { id: dispatchId },
      data: {
        status: 'COPIED',
        sentAt: new Date(),
      },
    });
  }

  async getSponsorsForUpdate(beneficiaryId: string) {
    const sponsors = await this.prisma.sponsorship.findMany({
      where: {
        beneficiaryId,
        isActive: true,
        status: 'ACTIVE',
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
            prefEmail: true,
            prefWhatsapp: true,
          },
        },
      },
    });

    return sponsors.map((s) => ({
      donorId: s.donorId,
      donorCode: s.donor.donorCode,
      donorName: `${s.donor.firstName} ${s.donor.lastName || ''}`.trim(),
      phone: s.donor.primaryPhone,
      email: s.donor.personalEmail,
      prefEmail: s.donor.prefEmail,
      prefWhatsapp: s.donor.prefWhatsapp,
    }));
  }

  async getUpdateWithBeneficiary(updateId: string) {
    const update = await this.prisma.beneficiaryUpdate.findUnique({
      where: { id: updateId },
      include: {
        beneficiary: {
          select: {
            id: true,
            fullName: true,
            homeType: true,
          },
        },
      },
    });

    if (!update) {
      throw new NotFoundException('Update not found');
    }

    return update;
  }

  async deleteUpdate(updateId: string) {
    const existing = await this.prisma.beneficiaryUpdate.findUnique({
      where: { id: updateId },
    });

    if (!existing) {
      throw new NotFoundException('Update not found');
    }

    await this.prisma.beneficiaryUpdate.delete({
      where: { id: updateId },
    });

    return { success: true };
  }

  async getTimelineEvents(beneficiaryId: string) {
    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: { id: beneficiaryId, isDeleted: false },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    return this.prisma.beneficiaryTimelineEvent.findMany({
      where: { beneficiaryId },
      orderBy: { eventDate: 'desc' },
    });
  }

  async addTimelineEvent(beneficiaryId: string, dto: CreateTimelineEventDto) {
    const beneficiary = await this.prisma.beneficiary.findFirst({
      where: { id: beneficiaryId, isDeleted: false },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    return this.prisma.beneficiaryTimelineEvent.create({
      data: {
        beneficiaryId,
        eventType: dto.eventType,
        eventDate: new Date(dto.eventDate),
        description: dto.description,
      },
    });
  }

  async getDonorSponsorships(donorId: string) {
    const donor = await this.prisma.donor.findFirst({
      where: { id: donorId, isDeleted: false },
    });

    if (!donor) {
      throw new NotFoundException('Donor not found');
    }

    const sponsorships = await this.prisma.sponsorship.findMany({
      where: { donorId },
      include: {
        beneficiary: {
          select: {
            id: true,
            code: true,
            fullName: true,
            homeType: true,
            photoUrl: true,
            status: true,
            updates: {
              where: { isPrivate: false },
              orderBy: { createdAt: 'desc' },
              take: 2,
              select: {
                id: true,
                title: true,
                content: true,
                updateType: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sponsorships;
  }

  async exportToExcel(user: UserContext) {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Beneficiaries');

    // Define columns
    worksheet.columns = [
      { header: 'Code', key: 'code', width: 18 },
      { header: 'Full Name', key: 'fullName', width: 25 },
      { header: 'Home', key: 'home', width: 25 },
      { header: 'DOB (MM/DD)', key: 'dob', width: 12 },
      { header: 'Age Approx', key: 'ageApprox', width: 12 },
      { header: 'Join Date', key: 'joinDate', width: 12 },
      { header: 'School/College', key: 'schoolOrCollege', width: 25 },
      { header: 'Class/Status', key: 'classOrStatus', width: 20 },
      { header: 'Health Notes', key: 'healthNotes', width: 30 },
      { header: 'Hobbies', key: 'hobbies', width: 20 },
      { header: 'Dream Career', key: 'dreamCareer', width: 20 },
      { header: 'Notes', key: 'notes', width: 30 },
      { header: 'Sponsors Count', key: 'sponsorsCount', width: 15 },
      { header: 'Sponsor Donor Codes', key: 'sponsorDonorCodes', width: 30 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const beneficiaries = await this.prisma.beneficiary.findMany({
      where: { isDeleted: false },
      include: {
        sponsorships: {
          where: { isActive: true, status: 'ACTIVE' },
          include: {
            donor: {
              select: { donorCode: true },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    for (const b of beneficiaries) {
      const isPrivate = b.protectPrivacy;
      const sponsorDonorCodes = b.sponsorships.map(s => s.donor.donorCode).join(', ');
      
      worksheet.addRow({
        code: b.code,
        fullName: isPrivate ? this.maskName(b.fullName) : b.fullName,
        home: this.getHomeTypeName(b.homeType),
        dob: b.dobMonth && b.dobDay ? `${String(b.dobMonth).padStart(2, '0')}/${String(b.dobDay).padStart(2, '0')}` : '',
        ageApprox: b.approxAge || '',
        joinDate: b.joinDate ? new Date(b.joinDate).toLocaleDateString() : '',
        schoolOrCollege: b.schoolOrCollege || '',
        classOrStatus: b.educationClassOrRole || '',
        healthNotes: isPrivate ? '[Protected]' : (b.healthNotes || ''),
        hobbies: b.hobbies || '',
        dreamCareer: b.dreamCareer || '',
        notes: isPrivate ? '[Protected]' : (b.additionalNotes || ''),
        sponsorsCount: b.sponsorships.length,
        sponsorDonorCodes,
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    return {
      buffer: Buffer.from(buffer).toString('base64'),
      filename: `beneficiaries_${new Date().toISOString().split('T')[0]}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private maskName(name: string): string {
    const parts = name.split(' ');
    return parts.map(p => p.charAt(0) + '.').join(' ');
  }

  private getHomeTypeName(homeType: HomeType): string {
    switch (homeType) {
      case HomeType.ORPHAN_GIRLS: return 'Orphan Girls Home';
      case HomeType.BLIND_BOYS: return 'Visually Challenged Boys Home';
      case HomeType.OLD_AGE: return 'Old Age Home';
      default: return homeType;
    }
  }

  private computeNextDueDate(dueDay: number, fromDate?: Date): Date {
    const safeDay = Math.min(dueDay, 28);
    const now = fromDate || new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), safeDay);
    if (thisMonth > now) return thisMonth;
    return new Date(now.getFullYear(), now.getMonth() + 1, safeDay);
  }

  private advanceNextDueDate(currentDue: Date, dueDay: number): Date {
    const safeDay = Math.min(dueDay, 28);
    return new Date(currentDue.getFullYear(), currentDue.getMonth() + 1, safeDay);
  }

  private advanceToFutureDueDate(currentDue: Date, dueDay: number): Date {
    const safeDay = Math.min(dueDay, 28);
    const now = new Date();
    let next = new Date(currentDue.getFullYear(), currentDue.getMonth() + 1, safeDay);
    while (next <= now) {
      next = new Date(next.getFullYear(), next.getMonth() + 1, safeDay);
    }
    return next;
  }

  async markSponsorshipPaid(
    user: UserContext,
    sponsorshipId: string,
    body: { paymentMode?: string; notes?: string },
  ) {
    const sponsorship = await this.prisma.sponsorship.findUnique({
      where: { id: sponsorshipId },
      include: {
        donor: { select: { id: true, donorCode: true, firstName: true, lastName: true } },
        beneficiary: { select: { id: true, code: true, fullName: true, homeType: true } },
      },
    });

    if (!sponsorship) throw new NotFoundException('Sponsorship not found');
    if (!sponsorship.isActive || sponsorship.status !== 'ACTIVE') {
      throw new BadRequestException('Sponsorship is not active');
    }

    const amount = sponsorship.amount ? Number(sponsorship.amount) : 0;
    if (amount <= 0) throw new BadRequestException('Sponsorship has no amount set');

    const homeTypeMap: Record<string, string> = {
      ORPHAN_GIRLS: 'GIRLS_HOME',
      BLIND_BOYS: 'BLIND_BOYS_HOME',
      OLD_AGE: 'OLD_AGE_HOME',
    };

    const dueDay = sponsorship.dueDayOfMonth || (sponsorship.startDate ? new Date(sponsorship.startDate).getDate() : 1);
    const currentNextDue = sponsorship.nextDueDate || this.computeNextDueDate(dueDay);
    const newNextDue = this.advanceToFutureDueDate(currentNextDue, dueDay);

    const result = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const financialYear = currentMonth >= 4
        ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
        : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;

      const lastReceipt = await tx.donation.findFirst({
        where: { financialYear, receiptNumber: { not: null } },
        orderBy: { receiptNumber: 'desc' },
        select: { receiptNumber: true },
      });
      let nextNum = 1;
      if (lastReceipt?.receiptNumber) {
        const match = lastReceipt.receiptNumber.match(/(\d+)$/);
        if (match) nextNum = parseInt(match[1], 10) + 1;
      }
      const receiptNumber = `AKF-${financialYear}-${String(nextNum).padStart(5, '0')}`;

      const donation = await tx.donation.create({
        data: {
          donorId: sponsorship.donorId,
          donationDate: now,
          donationAmount: new Decimal(amount),
          currency: sponsorship.currency || 'INR',
          donationType: DonationType.CASH,
          donationPurpose: DonationPurpose.SPONSORSHIP,
          donationMode: (body.paymentMode as DonationMode) || DonationMode.CASH,
          donationHomeType: (homeTypeMap[sponsorship.beneficiary.homeType] as DonationHomeType) || DonationHomeType.GENERAL,
          remarks: `Monthly sponsorship for ${sponsorship.beneficiary.fullName} (${sponsorship.beneficiary.code})${body.notes ? ' - ' + body.notes : ''}`,
          financialYear,
          receiptNumber,
          createdById: user.id,
        },
      });

      await tx.sponsorshipPayment.upsert({
        where: {
          unique_sponsorship_month_year: {
            sponsorshipId: sponsorship.id,
            month: currentMonth,
            year: currentYear,
          },
        },
        update: {
          paidOn: now,
          amount: new Decimal(amount),
          paymentMode: body.paymentMode || 'CASH',
          status: 'PAID',
          donationId: donation.id,
          notes: body.notes || null,
        },
        create: {
          sponsorshipId: sponsorship.id,
          month: currentMonth,
          year: currentYear,
          paidOn: now,
          amount: new Decimal(amount),
          paymentMode: body.paymentMode || 'CASH',
          status: 'PAID',
          donationId: donation.id,
          notes: body.notes || null,
        },
      });

      await tx.sponsorship.update({
        where: { id: sponsorshipId },
        data: { nextDueDate: newNextDue },
      });

      return { donationId: donation.id };
    });

    return {
      success: true,
      message: 'Sponsorship marked paid and next due updated.',
      donationId: result.donationId,
      nextDueDate: newNextDue.toISOString().split('T')[0],
    };
  }

  async getMetrics(beneficiaryId: string) {
    await this.ensureBeneficiaryExists(beneficiaryId);
    return this.prisma.beneficiaryMetric.findMany({
      where: { beneficiaryId },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { recordedOn: 'desc' },
    });
  }

  async addMetric(user: UserContext, beneficiaryId: string, dto: CreateMetricDto) {
    await this.ensureBeneficiaryExists(beneficiaryId);
    if (!dto.heightCm && !dto.weightKg) {
      throw new BadRequestException('At least height or weight is required');
    }
    const healthStatus = (dto.healthStatus as BeneficiaryHealthStatus) || BeneficiaryHealthStatus.NORMAL;
    const metric = await this.prisma.beneficiaryMetric.create({
      data: {
        beneficiaryId,
        recordedOn: dto.recordedOn ? new Date(dto.recordedOn) : new Date(),
        heightCm: dto.heightCm,
        weightKg: dto.weightKg,
        healthStatus,
        notes: dto.notes,
        createdById: user.id,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    await this.prisma.beneficiary.update({
      where: { id: beneficiaryId },
      data: { currentHealthStatus: healthStatus },
    });
    const statusLabel = healthStatus.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());

    await this.prisma.beneficiaryTimelineEvent.create({
      data: {
        beneficiaryId,
        eventType: BeneficiaryEventType.HEALTH_UPDATE,
        eventDate: new Date(),
        description: `Health check recorded – Status: ${statusLabel}${dto.heightCm ? `, Height: ${dto.heightCm}cm` : ''}${dto.weightKg ? `, Weight: ${dto.weightKg}kg` : ''}`,
      },
    });
    return metric;
  }

  async getProgressCards(beneficiaryId: string) {
    await this.ensureBeneficiaryExists(beneficiaryId);
    return this.prisma.progressCard.findMany({
      where: { beneficiaryId },
      include: {
        createdBy: { select: { id: true, name: true } },
        fileDocument: { select: { id: true, title: true, storagePath: true, mimeType: true } },
      },
      orderBy: [{ academicYear: 'desc' }, { term: 'desc' }],
    });
  }

  async addProgressCard(user: UserContext, beneficiaryId: string, dto: CreateProgressCardDto) {
    await this.ensureBeneficiaryExists(beneficiaryId);
    if (!dto.academicYear || !dto.term || !dto.classGrade) {
      throw new BadRequestException('Academic year, term, and class/grade are required');
    }
    const card = await this.prisma.progressCard.create({
      data: {
        beneficiaryId,
        academicYear: dto.academicYear,
        term: dto.term as ProgressTerm,
        classGrade: dto.classGrade,
        school: dto.school,
        overallPercentage: dto.overallPercentage,
        remarks: dto.remarks,
        fileDocumentId: dto.fileDocumentId,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        fileDocument: { select: { id: true, title: true, storagePath: true, mimeType: true } },
      },
    });
    await this.prisma.beneficiaryTimelineEvent.create({
      data: {
        beneficiaryId,
        eventType: BeneficiaryEventType.EDUCATION,
        eventDate: new Date(),
        description: `Progress card added for ${dto.academicYear} ${dto.term} – ${dto.classGrade}${dto.overallPercentage ? ` (${dto.overallPercentage}%)` : ''}`,
      },
    });
    return card;
  }

  async getEducationTimeline(beneficiaryId: string) {
    await this.ensureBeneficiaryExists(beneficiaryId);

    const [progressCards, timelineEvents] = await Promise.all([
      this.prisma.progressCard.findMany({
        where: { beneficiaryId },
        include: {
          createdBy: { select: { id: true, name: true } },
          fileDocument: { select: { id: true, title: true, storagePath: true, mimeType: true } },
        },
        orderBy: [{ academicYear: 'desc' }, { term: 'desc' }],
      }),
      this.prisma.beneficiaryTimelineEvent.findMany({
        where: { beneficiaryId, eventType: BeneficiaryEventType.EDUCATION },
        orderBy: { eventDate: 'desc' },
      }),
    ]);

    const timeline: any[] = [];

    for (const card of progressCards) {
      const termLabels: Record<string, string> = { TERM_1: 'Term 1', TERM_2: 'Term 2', TERM_3: 'Term 3', ANNUAL: 'Annual' };
      const termLabel = termLabels[card.term] || card.term;
      timeline.push({
        id: card.id,
        type: 'PROGRESS_CARD',
        date: card.createdAt,
        title: `${card.academicYear} - ${termLabel}`,
        summary: `${card.classGrade}${card.school ? ` at ${card.school}` : ''}${card.overallPercentage ? ` - ${Number(card.overallPercentage)}%` : ''}`,
        academicYear: card.academicYear,
        term: card.term,
        classGrade: card.classGrade,
        school: card.school,
        overallPercentage: card.overallPercentage ? Number(card.overallPercentage) : null,
        remarks: card.remarks,
        fileDocument: card.fileDocument,
        createdBy: card.createdBy,
        createdAt: card.createdAt,
      });
    }

    for (const event of timelineEvents) {
      const alreadyLinked = progressCards.some(c => {
        const cardDate = new Date(c.createdAt);
        const eventDate = new Date(event.eventDate);
        return Math.abs(cardDate.getTime() - eventDate.getTime()) < 60000;
      });
      if (!alreadyLinked) {
        timeline.push({
          id: event.id,
          type: 'TIMELINE_EVENT',
          date: event.eventDate,
          title: 'Education Event',
          summary: event.description || '',
          createdBy: { id: '', name: 'System' },
          createdAt: event.eventDate,
        });
      }
    }

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return timeline;
  }

  async exportEducationSummaryPdf(beneficiaryId: string) {
    const beneficiary = await this.prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
      select: {
        id: true, code: true, fullName: true, homeType: true, approxAge: true,
        educationClassOrRole: true, schoolOrCollege: true, dreamCareer: true,
        favouriteSubject: true,
      },
    });
    if (!beneficiary) throw new NotFoundException('Beneficiary not found');

    const progressCards = await this.prisma.progressCard.findMany({
      where: { beneficiaryId },
      include: { createdBy: { select: { name: true } } },
      orderBy: [{ academicYear: 'asc' }, { term: 'asc' }],
    });

    const educationEvents = await this.prisma.beneficiaryTimelineEvent.findMany({
      where: { beneficiaryId, eventType: BeneficiaryEventType.EDUCATION },
      orderBy: { eventDate: 'asc' },
    });

    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    doc.fontSize(18).font('Helvetica-Bold').text('Education Progress Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`${beneficiary.fullName} (${beneficiary.code})`, { align: 'center' });
    doc.fontSize(10).text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica');
    const homeLabels: Record<string, string> = { ORPHAN_GIRLS: 'Orphan Girls Home', BLIND_BOYS: 'Visually Challenged Boys Home', OLD_AGE: 'Old Age Home' };
    doc.text(`Home: ${homeLabels[beneficiary.homeType] || beneficiary.homeType}`);
    if (beneficiary.approxAge) doc.text(`Approximate Age: ${beneficiary.approxAge}`);
    if (beneficiary.educationClassOrRole) doc.text(`Current Class/Grade: ${beneficiary.educationClassOrRole}`);
    if (beneficiary.schoolOrCollege) doc.text(`School/College: ${beneficiary.schoolOrCollege}`);
    if (beneficiary.dreamCareer) doc.text(`Dream Career: ${beneficiary.dreamCareer}`);
    if (beneficiary.favouriteSubject) doc.text(`Favourite Subject: ${beneficiary.favouriteSubject}`);
    doc.moveDown(1);

    if (progressCards.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Academic Progress Cards');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');

      const tableTop = doc.y;
      const colWidths = [80, 60, 80, 90, 60, 120];
      const headers = ['Academic Year', 'Term', 'Class/Grade', 'School', 'Score %', 'Remarks'];
      let x = 50;
      doc.font('Helvetica-Bold');
      headers.forEach((h, i) => {
        doc.text(h, x, tableTop, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });
      doc.moveDown(0.5);

      doc.font('Helvetica');
      const termLabels: Record<string, string> = { TERM_1: 'Term 1', TERM_2: 'Term 2', TERM_3: 'Term 3', ANNUAL: 'Annual' };
      for (const card of progressCards) {
        if (doc.y > 700) { doc.addPage(); }
        const y = doc.y;
        x = 50;
        const values = [
          card.academicYear,
          termLabels[card.term] || card.term,
          card.classGrade,
          card.school || '-',
          card.overallPercentage ? `${card.overallPercentage}` : '-',
          (card.remarks || '-').substring(0, 30),
        ];
        values.forEach((v, i) => {
          doc.text(v, x, y, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });
        doc.moveDown(0.3);
      }
      doc.moveDown(1);
    }

    if (educationEvents.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Education Milestones');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');

      for (const event of educationEvents) {
        if (doc.y > 700) { doc.addPage(); }
        doc.text(`${new Date(event.eventDate).toLocaleDateString('en-IN')} - ${event.description}`);
        doc.moveDown(0.2);
      }
    }

    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async getHealthEvents(beneficiaryId: string) {
    await this.ensureBeneficiaryExists(beneficiaryId);
    return this.prisma.beneficiaryHealthEvent.findMany({
      where: { beneficiaryId },
      include: {
        createdBy: { select: { id: true, name: true } },
        document: { select: { id: true, title: true, storagePath: true, mimeType: true, sizeBytes: true } },
      },
      orderBy: { eventDate: 'desc' },
    });
  }

  async addHealthEvent(user: UserContext, beneficiaryId: string, dto: CreateHealthEventDto) {
    await this.ensureBeneficiaryExists(beneficiaryId);
    if (!dto.title || !dto.description || !dto.eventDate) {
      throw new BadRequestException('Title, description, and event date are required');
    }
    const event = await this.prisma.beneficiaryHealthEvent.create({
      data: {
        beneficiaryId,
        eventDate: new Date(dto.eventDate),
        title: dto.title,
        description: dto.description,
        severity: (dto.severity as HealthEventSeverity) || 'LOW',
        requiresDonorUpdate: dto.requiresDonorUpdate ?? false,
        shareWithDonor: dto.shareWithDonor ?? false,
        documentId: dto.documentId || null,
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        document: { select: { id: true, title: true, storagePath: true, mimeType: true, sizeBytes: true } },
      },
    });
    await this.prisma.beneficiaryTimelineEvent.create({
      data: {
        beneficiaryId,
        eventType: BeneficiaryEventType.HEALTH_UPDATE,
        eventDate: new Date(dto.eventDate),
        description: `Health event: ${dto.title} (${dto.severity || 'LOW'})`,
      },
    });
    return event;
  }

  async sendHealthEventToSponsors(user: UserContext, healthEventId: string) {
    const event = await this.prisma.beneficiaryHealthEvent.findUnique({
      where: { id: healthEventId },
      include: {
        beneficiary: {
          include: {
            sponsorships: {
              where: { isActive: true, status: 'ACTIVE' },
              include: {
                donor: { select: { id: true, firstName: true, lastName: true, personalEmail: true, officialEmail: true } },
              },
            },
          },
        },
      },
    });
    if (!event) throw new NotFoundException('Health event not found');
    if (!event.shareWithDonor) throw new BadRequestException('This event is not marked for sharing with donors');

    const sponsors = event.beneficiary.sponsorships;
    if (sponsors.length === 0) throw new BadRequestException('No active sponsors for this beneficiary');

    const healthOrgName = (await this.orgProfileService.getProfile()).name;
    let emailsSent = 0;
    for (const sp of sponsors) {
      const email = sp.donor.personalEmail || sp.donor.officialEmail;
      if (!email) continue;
      const donorName = `${sp.donor.firstName} ${sp.donor.lastName || ''}`.trim();
      const subject = `Health Update – ${event.beneficiary.fullName}`;
      const html = `
        <p>Dear ${donorName},</p>
        <p>We wanted to keep you informed about ${event.beneficiary.fullName}'s health.</p>
        <h3>${event.title}</h3>
        <p>${event.description}</p>
        <p><strong>Date:</strong> ${new Date(event.eventDate).toLocaleDateString('en-IN')}</p>
        <p><strong>Severity:</strong> ${event.severity}</p>
        <p>Thank you for your continued support and concern.</p>
        <p>Warm regards,<br/>${healthOrgName}</p>
      `;
      try {
        await this.emailService.sendEmail({ to: email, subject, html, featureType: 'MANUAL' });
        emailsSent++;
      } catch (e) {
        this.logger.warn(`Failed to send health update email to ${email}: ${e}`);
      }
    }
    return { success: true, message: `Email queued to ${emailsSent} sponsor(s)` };
  }

  async getHealthTimeline(beneficiaryId: string) {
    await this.ensureBeneficiaryExists(beneficiaryId);

    const [metrics, events] = await Promise.all([
      this.prisma.beneficiaryMetric.findMany({
        where: { beneficiaryId },
        include: { createdBy: { select: { id: true, name: true } } },
        orderBy: { recordedOn: 'desc' },
      }),
      this.prisma.beneficiaryHealthEvent.findMany({
        where: { beneficiaryId },
        include: {
          createdBy: { select: { id: true, name: true } },
          document: { select: { id: true, title: true, storagePath: true, mimeType: true, sizeBytes: true } },
        },
        orderBy: { eventDate: 'desc' },
      }),
    ]);

    const timeline: any[] = [];

    for (const m of metrics) {
      const statusLabel = (m.healthStatus || 'NORMAL').replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
      timeline.push({
        id: m.id,
        type: 'METRIC',
        date: m.recordedOn,
        title: `Health Check – ${statusLabel}`,
        summary: `${m.heightCm ? `Height: ${m.heightCm}cm` : ''}${m.heightCm && m.weightKg ? ', ' : ''}${m.weightKg ? `Weight: ${m.weightKg}kg` : ''}`,
        healthStatus: m.healthStatus,
        heightCm: m.heightCm,
        weightKg: m.weightKg,
        notes: m.notes,
        createdBy: m.createdBy,
        createdAt: m.createdAt,
      });
    }

    for (const e of events) {
      timeline.push({
        id: e.id,
        type: 'EVENT',
        date: e.eventDate,
        title: e.title,
        summary: e.description,
        severity: e.severity,
        shareWithDonor: e.shareWithDonor,
        document: e.document,
        createdBy: e.createdBy,
        createdAt: e.createdAt,
      });
    }

    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return timeline;
  }

  async exportHealthHistoryPdf(beneficiaryId: string) {
    const beneficiary = await this.prisma.beneficiary.findUnique({
      where: { id: beneficiaryId },
      select: { id: true, code: true, fullName: true, homeType: true, approxAge: true, currentHealthStatus: true, healthNotes: true, heightCmAtJoin: true, weightKgAtJoin: true },
    });
    if (!beneficiary) throw new NotFoundException('Beneficiary not found');

    const [metrics, events] = await Promise.all([
      this.prisma.beneficiaryMetric.findMany({
        where: { beneficiaryId },
        include: { createdBy: { select: { name: true } } },
        orderBy: { recordedOn: 'asc' },
      }),
      this.prisma.beneficiaryHealthEvent.findMany({
        where: { beneficiaryId },
        include: { createdBy: { select: { name: true } } },
        orderBy: { eventDate: 'asc' },
      }),
    ]);

    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    doc.fontSize(18).font('Helvetica-Bold').text('Health History Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`${beneficiary.fullName} (${beneficiary.code})`, { align: 'center' });
    doc.fontSize(10).text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica');
    const homeLabels: Record<string, string> = { ORPHAN_GIRLS: 'Orphan Girls Home', BLIND_BOYS: 'Visually Challenged Boys Home', OLD_AGE: 'Old Age Home' };
    doc.text(`Home: ${homeLabels[beneficiary.homeType] || beneficiary.homeType}`);
    if (beneficiary.approxAge) doc.text(`Approximate Age: ${beneficiary.approxAge}`);
    if (beneficiary.currentHealthStatus) doc.text(`Current Health Status: ${beneficiary.currentHealthStatus}`);
    if (beneficiary.healthNotes) doc.text(`Health Notes: ${beneficiary.healthNotes}`);
    if (beneficiary.heightCmAtJoin || beneficiary.weightKgAtJoin) {
      doc.text(`At Join: ${beneficiary.heightCmAtJoin ? `Height ${beneficiary.heightCmAtJoin}cm` : ''}${beneficiary.heightCmAtJoin && beneficiary.weightKgAtJoin ? ', ' : ''}${beneficiary.weightKgAtJoin ? `Weight ${beneficiary.weightKgAtJoin}kg` : ''}`);
    }
    doc.moveDown(1);

    if (metrics.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Growth & Health Measurements');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');

      const tableTop = doc.y;
      const colWidths = [80, 70, 70, 90, 120, 80];
      const headers = ['Date', 'Height (cm)', 'Weight (kg)', 'Status', 'Notes', 'Recorded By'];
      let x = 50;
      doc.font('Helvetica-Bold');
      headers.forEach((h, i) => {
        doc.text(h, x, tableTop, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });
      doc.moveDown(0.5);

      doc.font('Helvetica');
      for (const m of metrics) {
        if (doc.y > 700) { doc.addPage(); }
        const y = doc.y;
        x = 50;
        const statusLabel = (m.healthStatus || 'NORMAL').replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
        const values = [
          new Date(m.recordedOn).toLocaleDateString('en-IN'),
          m.heightCm ? `${m.heightCm}` : '-',
          m.weightKg ? `${m.weightKg}` : '-',
          statusLabel,
          (m.notes || '-').substring(0, 30),
          m.createdBy.name,
        ];
        values.forEach((v, i) => {
          doc.text(v, x, y, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });
        doc.moveDown(0.3);
      }
      doc.moveDown(1);
    }

    if (events.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Health Events');
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');

      for (const e of events) {
        if (doc.y > 700) { doc.addPage(); }
        doc.font('Helvetica-Bold').text(`${new Date(e.eventDate).toLocaleDateString('en-IN')} – ${e.title} [${e.severity}]`);
        doc.font('Helvetica').text(e.description);
        doc.text(`Recorded by: ${e.createdBy.name}`, { align: 'right' });
        doc.moveDown(0.5);
      }
    }

    doc.end();

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  async getDocuments(user: UserContext, ownerType: string, ownerId?: string) {
    const where: any = { ownerType };
    if (ownerId) where.ownerId = ownerId;
    if (!this.canViewSensitiveBeneficiaryData(user)) {
      where.isSensitive = false;
    }
    return this.prisma.document.findMany({
      where,
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDocument(user: UserContext, dto: CreateDocumentDto) {
    const sensitiveTypes: DocumentType[] = ['AADHAAR', 'GOVT_ID', 'PRESCRIPTION'];
    const isSensitive = dto.isSensitive ?? sensitiveTypes.includes(dto.docType as DocumentType);
    if (isSensitive && !this.canViewSensitiveBeneficiaryData(user)) {
      throw new ForbiddenException('You do not have permission to upload sensitive documents');
    }
    if (isSensitive && dto.shareWithDonor) {
      throw new BadRequestException('Sensitive documents cannot be shared with donors');
    }
    return this.prisma.document.create({
      data: {
        ownerType: dto.ownerType as DocumentOwnerType,
        ownerId: dto.ownerId,
        docType: dto.docType as DocumentType,
        title: dto.title,
        description: dto.description,
        storageBucket: dto.storageBucket,
        storagePath: dto.storagePath,
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes,
        isSensitive,
        shareWithDonor: dto.shareWithDonor ?? false,
        createdById: user.id,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });
  }

  async logDocumentAccess(userId: string, documentId: string, action: string) {
    return this.prisma.documentAccessLog.create({
      data: { documentId, userId, action },
    });
  }

  async getDocumentById(user: UserContext, documentId: string) {
    const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.isSensitive && !this.canViewSensitiveBeneficiaryData(user)) {
      throw new ForbiddenException('You do not have permission to view this document');
    }
    await this.logDocumentAccess(user.id, documentId, 'VIEW');
    return doc;
  }

  async getReportCampaigns() {
    return this.prisma.reportCampaign.findMany({
      include: {
        createdBy: { select: { id: true, name: true } },
        document: { select: { id: true, title: true, storagePath: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReportCampaign(user: UserContext, dto: CreateReportCampaignDto) {
    if (!dto.name || !dto.periodStart || !dto.periodEnd) {
      throw new BadRequestException('Name, period start, and period end are required');
    }
    return this.prisma.reportCampaign.create({
      data: {
        name: dto.name,
        type: dto.type as any,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        documentId: dto.documentId,
        target: (dto.target as any) || 'ALL_DONORS',
        status: 'DRAFT',
        createdById: user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        document: { select: { id: true, title: true, storagePath: true } },
      },
    });
  }

  async queueReportCampaignEmails(user: UserContext, campaignId: string) {
    const campaign = await this.prisma.reportCampaign.findUnique({
      where: { id: campaignId },
      include: { document: true },
    });
    if (!campaign) throw new NotFoundException('Report campaign not found');
    if (campaign.status === 'SENT') throw new BadRequestException('Campaign emails already sent');

    let donorsWhere: any = { isDeleted: false };
    if (campaign.target === 'SPONSORS_ONLY') {
      donorsWhere.sponsorships = { some: { isActive: true, status: 'ACTIVE' } };
    }
    const donors = await this.prisma.donor.findMany({
      where: donorsWhere,
      select: { id: true, firstName: true, lastName: true, personalEmail: true, officialEmail: true },
    });

    const orgName = (await this.orgProfileService.getProfile()).name;
    let emailsSent = 0;
    for (const donor of donors) {
      const email = donor.personalEmail || donor.officialEmail;
      if (!email) continue;
      const donorName = `${donor.firstName} ${donor.lastName || ''}`.trim();
      const subject = campaign.name;
      const html = `
        <p>Dear ${donorName},</p>
        <p>We are pleased to share our ${campaign.type.toLowerCase()} report: <strong>${campaign.name}</strong></p>
        <p>Period: ${new Date(campaign.periodStart).toLocaleDateString('en-IN')} to ${new Date(campaign.periodEnd).toLocaleDateString('en-IN')}</p>
        <p>Thank you for your continued support of ${orgName}.</p>
        <p>Warm regards,<br/>${orgName}</p>
      `;
      try {
        await this.emailService.sendEmail({ to: email, subject, html, featureType: 'MANUAL' });
        emailsSent++;
      } catch (e) {
        this.logger.warn(`Failed to send report email to ${email}: ${e}`);
      }
    }

    await this.prisma.reportCampaign.update({
      where: { id: campaignId },
      data: { status: 'SENT', emailsSent, sentAt: new Date() },
    });

    return { success: true, message: `Report emailed to ${emailsSent} donor(s)`, emailsSent };
  }

  private async ensureBeneficiaryExists(id: string) {
    const b = await this.prisma.beneficiary.findFirst({ where: { id, isDeleted: false } });
    if (!b) throw new NotFoundException('Beneficiary not found');
    return b;
  }

  async sendSponsorshipReminderEmail(sponsorshipId: string) {
    if (!this.emailService.isConfigured()) {
      throw new BadRequestException('Email is not configured. Please set up SMTP settings first.');
    }

    const sponsorship = await this.prisma.sponsorship.findUnique({
      where: { id: sponsorshipId },
      include: {
        donor: { select: { id: true, firstName: true, lastName: true, personalEmail: true, officialEmail: true } },
        beneficiary: { select: { id: true, fullName: true, homeType: true, protectPrivacy: true } },
      },
    });

    if (!sponsorship) throw new NotFoundException('Sponsorship not found');

    const donorEmail = sponsorship.donor.personalEmail || sponsorship.donor.officialEmail;
    if (!donorEmail) {
      throw new BadRequestException('Donor has no email address on file.');
    }

    const { subject, html, donorName } = await this.buildSponsorshipReminderContent(sponsorship);

    const result = await this.emailService.sendEmail({
      to: donorEmail,
      subject,
      html,
      featureType: 'MANUAL',
    });

    if (!result.success) {
      throw new BadRequestException(`Failed to send email: ${result.error}`);
    }

    return {
      success: true,
      message: `Email queued for ${donorName}`,
    };
  }

  async queueSponsorshipReminderEmail(sponsorshipId: string) {
    const sponsorship = await this.prisma.sponsorship.findUnique({
      where: { id: sponsorshipId },
      include: {
        donor: { select: { id: true, firstName: true, lastName: true, personalEmail: true, officialEmail: true } },
        beneficiary: { select: { id: true, fullName: true, homeType: true, protectPrivacy: true } },
      },
    });

    if (!sponsorship) throw new NotFoundException('Sponsorship not found');

    const donorEmail = sponsorship.donor.personalEmail || sponsorship.donor.officialEmail;
    if (!donorEmail) {
      throw new BadRequestException('Donor has no email address on file.');
    }

    const { subject, html, donorName } = await this.buildSponsorshipReminderContent(sponsorship);

    const now = new Date();
    const jobDto: CreateEmailJobDto = {
      donorId: sponsorship.donor.id,
      toEmail: donorEmail,
      subject,
      body: html,
      type: 'SPONSORSHIP_REMINDER',
      relatedId: `sponsorship-${sponsorshipId}-${now.getFullYear()}-${now.getMonth() + 1}`,
      scheduledAt: now,
    };

    await this.emailJobsService.create(jobDto);

    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    await this.prisma.sponsorshipPayment.upsert({
      where: {
        unique_sponsorship_month_year: {
          sponsorshipId,
          month: currentMonth,
          year: currentYear,
        },
      },
      update: {},
      create: {
        sponsorshipId,
        month: currentMonth,
        year: currentYear,
        status: 'DUE',
      },
    });

    return {
      success: true,
      message: `Reminder email queued for ${donorName}`,
    };
  }

  private async buildSponsorshipReminderContent(sponsorship: any): Promise<{ subject: string; html: string; donorName: string }> {
    const donorName = `${sponsorship.donor.firstName} ${sponsorship.donor.lastName || ''}`.trim();
    const isPrivacyProtected = sponsorship.beneficiary.protectPrivacy;
    const beneficiaryLabel = isPrivacyProtected ? 'one of our children/elders' : sponsorship.beneficiary.fullName;
    const homeName = this.getHomeTypeName(sponsorship.beneficiary.homeType);

    const isInKind = sponsorship.sponsorshipType === 'FOOD' || sponsorship.sponsorshipType === 'GROCERIES' || sponsorship.inKindItem;
    const amountLine = isInKind
      ? 'monthly support item(s)'
      : sponsorship.amount ? `Rs. ${Number(sponsorship.amount).toLocaleString('en-IN')}` : '(unspecified)';

    const dueDay = sponsorship.dueDayOfMonth || (sponsorship.startDate ? new Date(sponsorship.startDate).getDate() : null);
    const ordinalSuffix = (n: number) => n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';

    const subject = isPrivacyProtected
      ? `Monthly Sponsorship Reminder – ${homeName}`
      : `Monthly Sponsorship Reminder – ${sponsorship.beneficiary.fullName}`;

    const html = `
      <p>Dear ${donorName},</p>
      <p>We hope you are doing well! This is a gentle reminder about your monthly sponsorship.</p>
      <table style="border-collapse:collapse; margin:16px 0;">
        <tr><td style="padding:4px 12px 4px 0; font-weight:bold;">Beneficiary:</td><td>${beneficiaryLabel}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; font-weight:bold;">Home:</td><td>${homeName}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; font-weight:bold;">Amount:</td><td>${amountLine}</td></tr>
        ${dueDay ? `<tr><td style="padding:4px 12px 4px 0; font-weight:bold;">Due Date:</td><td>${dueDay}${ordinalSuffix(dueDay)} of this month</td></tr>` : ''}
      </table>
      <p>Your continued support makes a meaningful difference in ${beneficiaryLabel}'s life. Thank you for your generosity!</p>
      <p>If you have already supported this month, please ignore this reminder.</p>
      <p>Warm regards,<br/>${(await this.orgProfileService.getProfile()).name}</p>
    `;

    return { subject, html, donorName };
  }

  async getDueSponsorships(windowDays: number = 7) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    const sponsorships = await this.prisma.sponsorship.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
        frequency: 'MONTHLY',
        donor: { isDeleted: false },
        beneficiary: { isDeleted: false },
      },
      include: {
        donor: {
          select: {
            id: true, donorCode: true, firstName: true, lastName: true,
            primaryPhone: true, whatsappPhone: true,
            personalEmail: true, officialEmail: true,
          },
        },
        beneficiary: {
          select: {
            id: true, code: true, fullName: true, homeType: true,
            protectPrivacy: true, photoUrl: true,
          },
        },
        payments: {
          where: { month: currentMonth, year: currentYear },
          select: { status: true },
        },
      },
    });

    const result: any[] = [];
    for (const s of sponsorships) {
      const dueDay = s.dueDayOfMonth || (s.startDate ? new Date(s.startDate).getDate() : 5);
      const existingPayment = s.payments[0];
      if (existingPayment && (existingPayment.status === 'PAID' || existingPayment.status === 'SKIPPED')) {
        continue;
      }

      const isOverdue = currentDay > dueDay;
      const daysUntilDue = dueDay - currentDay;

      if (isOverdue || daysUntilDue <= windowDays) {
        const donorName = [s.donor.firstName, s.donor.lastName].filter(Boolean).join(' ');
        result.push({
          id: s.id,
          sponsorshipId: s.id,
          donorId: s.donor.id,
          donorCode: s.donor.donorCode,
          donorName,
          beneficiaryId: s.beneficiary.id,
          beneficiaryCode: s.beneficiary.code,
          beneficiaryName: s.beneficiary.protectPrivacy ? '[Privacy Protected]' : s.beneficiary.fullName,
          homeType: s.beneficiary.homeType,
          amount: s.amount ? Number(s.amount) : null,
          currency: s.currency || 'INR',
          frequency: s.frequency,
          sponsorshipType: s.sponsorshipType,
          dueDay,
          daysUntil: isOverdue ? -Math.abs(currentDay - dueDay) : daysUntilDue,
          isOverdue,
          status: isOverdue ? 'OVERDUE' : 'DUE',
          protectPrivacy: s.beneficiary.protectPrivacy,
          donor: s.donor,
          beneficiary: {
            id: s.beneficiary.id,
            code: s.beneficiary.code,
            fullName: s.beneficiary.fullName,
            homeType: s.beneficiary.homeType,
            photoUrl: s.beneficiary.photoUrl,
          },
        });
      }
    }

    result.sort((a, b) => a.daysUntil - b.daysUntil);
    return result;
  }

  async skipSponsorshipMonth(user: UserContext, sponsorshipId: string) {
    const sponsorship = await this.prisma.sponsorship.findUnique({
      where: { id: sponsorshipId },
      include: {
        donor: { select: { id: true, firstName: true, lastName: true } },
        beneficiary: { select: { id: true, fullName: true } },
      },
    });

    if (!sponsorship) throw new NotFoundException('Sponsorship not found');
    if (!sponsorship.isActive || sponsorship.status !== 'ACTIVE') {
      throw new BadRequestException('Sponsorship is not active');
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    await this.prisma.sponsorshipPayment.upsert({
      where: {
        unique_sponsorship_month_year: {
          sponsorshipId,
          month: currentMonth,
          year: currentYear,
        },
      },
      update: {
        status: 'SKIPPED',
        notes: `Skipped by ${user.email}`,
      },
      create: {
        sponsorshipId,
        month: currentMonth,
        year: currentYear,
        status: 'SKIPPED',
        notes: `Skipped by ${user.email}`,
      },
    });

    const dueDay = sponsorship.dueDayOfMonth || (sponsorship.startDate ? new Date(sponsorship.startDate).getDate() : 5);
    const newNextDue = this.advanceToFutureDueDate(now, dueDay);
    await this.prisma.sponsorship.update({
      where: { id: sponsorshipId },
      data: { nextDueDate: newNextDue },
    });

    const donorName = [sponsorship.donor.firstName, sponsorship.donor.lastName].filter(Boolean).join(' ');
    return {
      success: true,
      message: `Sponsorship for ${donorName} skipped for ${currentMonth}/${currentYear}`,
      nextDueDate: newNextDue.toISOString().split('T')[0],
    };
  }

  async getSponsorshipSummary() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();

    const activeSponsors = await this.prisma.sponsorship.findMany({
      where: {
        isActive: true,
        status: 'ACTIVE',
        frequency: 'MONTHLY',
        donor: { isDeleted: false },
        beneficiary: { isDeleted: false },
      },
      select: {
        id: true,
        amount: true,
        dueDayOfMonth: true,
        startDate: true,
        payments: {
          where: { month: currentMonth, year: currentYear },
          select: { status: true },
        },
      },
    });

    let totalMonthlyValue = 0;
    let dueCount = 0;
    let overdueCount = 0;
    let paidThisMonth = 0;

    for (const s of activeSponsors) {
      const amount = s.amount ? Number(s.amount) : 0;
      totalMonthlyValue += amount;

      const existingPayment = s.payments[0];
      if (existingPayment?.status === 'PAID') {
        paidThisMonth++;
      } else if (existingPayment?.status === 'SKIPPED') {
        continue;
      } else {
        const dueDay = s.dueDayOfMonth || (s.startDate ? new Date(s.startDate).getDate() : 5);
        if (currentDay > dueDay) {
          overdueCount++;
        } else {
          dueCount++;
        }
      }
    }

    return {
      activeSponsors: activeSponsors.length,
      totalMonthlyValue,
      dueCount,
      overdueCount,
      paidThisMonth,
    };
  }
async buildWhatsAppReminderText(sponsorship: any): Promise<string> {
  const donorName = [sponsorship.donor?.firstName, sponsorship.donor?.lastName]
    .filter(Boolean)
    .join(" ");

  const isPrivacyProtected =
    sponsorship.beneficiary?.protectPrivacy || sponsorship.protectPrivacy;

  const beneficiaryLabel = isPrivacyProtected
    ? "one of our children/elders"
    : (sponsorship.beneficiary?.fullName || sponsorship.beneficiaryName);

  const homeName = this.getHomeTypeName(
    sponsorship.beneficiary?.homeType || sponsorship.homeType,
  );

  const isInKind =
    sponsorship.sponsorshipType === "FOOD" ||
    sponsorship.sponsorshipType === "GROCERIES" ||
    sponsorship.inKindItem;

  const amountLine = isInKind
    ? "monthly in-kind sponsorship"
    : sponsorship.amount
      ? `monthly sponsorship of Rs. ${Number(sponsorship.amount).toLocaleString("en-IN")}`
      : "monthly sponsorship";

  const org = await this.orgProfileService.getProfile();

  return `Dear ${donorName},\n\nThis is a gentle reminder about your ${amountLine} for ${beneficiaryLabel} at ${homeName}.\n\nYour continued support makes a meaningful difference. Thank you for your generosity!\n\nIf you have already supported this month, please ignore this message.\n\nWarm regards,\n${org.name}`;
} // ✅ IMPORTANT: this closing brace was missing

// ==============================
// Bulk import template + upload
// ==============================

async generateBulkTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Beneficiaries");

  // headers
  sheet.addRow(["name", "phone"]);

  // sample row
  sheet.addRow(["Sample Beneficiary", "+919999999999"]);

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

async bulkUpload(
  user: UserContext,
  fileBuffer: Buffer,
  uploadMode: "upsert" | "insert_only" = "upsert",
) {
  if (!fileBuffer) throw new BadRequestException("File is missing");

  const workbook = new ExcelJS.Workbook();

  // ✅ load buffer safely
  await workbook.xlsx.load(Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer as any));

  const sheet = workbook.getWorksheet("Beneficiaries") || workbook.worksheets[0];
  if (!sheet) throw new BadRequestException("No worksheet found in file");

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col - 1] = String(cell.value || "").trim().toLowerCase();
  });

  const nameIdx = headers.findIndex((h) => ["name", "full name"].includes(h));
  const phoneIdx = headers.findIndex((h) =>
    ["phone", "mobile", "contact", "phone number"].includes(h),
  );

  if (nameIdx === -1 || phoneIdx === -1) {
    throw new BadRequestException("Excel must contain minimum columns: name and phone");
  }

  const rows: Array<{ name: string; phone: string }> = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const name = String(row.getCell(nameIdx + 1).value || "").trim();
    const phone = String(row.getCell(phoneIdx + 1).value || "").trim();

    if (!name && !phone) continue;
    if (!name || !phone) continue;

    rows.push({ name, phone });
  }

  return {
    uploadMode,
    total: rows.length,
    preview: rows.slice(0, 5),
    message: "Parsed successfully. Next: save to database.",
  };
}
