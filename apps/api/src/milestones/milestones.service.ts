import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationProfileService } from '../organization-profile/organization-profile.service';
import { CreateMilestoneDto, UpdateMilestoneDto } from './milestones.dto';

interface UserContext {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class MilestonesService {
  private readonly logger = new Logger(MilestonesService.name);

  constructor(
    private prisma: PrismaService,
    private orgProfileService: OrganizationProfileService,
  ) {}

  async findAll(includePrivate: boolean = true) {
    const where = includePrivate ? {} : { isPublic: true };
    return this.prisma.milestone.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { date: 'asc' }],
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }
    return milestone;
  }

  async create(user: UserContext, dto: CreateMilestoneDto) {
    const milestone = await this.prisma.milestone.create({
      data: {
        title: dto.title,
        date: new Date(dto.date),
        description: dto.description,
        homeType: dto.homeType || null,
        photos: dto.photos || [],
        isPublic: dto.isPublic ?? false,
        sortOrder: dto.sortOrder ?? 0,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });
    this.logger.log(`Milestone created: "${milestone.title}" by ${user.email}`);
    return milestone;
  }

  async update(id: string, dto: UpdateMilestoneDto) {
    const existing = await this.prisma.milestone.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Milestone not found');
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.homeType !== undefined) data.homeType = dto.homeType || null;
    if (dto.photos !== undefined) data.photos = dto.photos;
    if (dto.isPublic !== undefined) data.isPublic = dto.isPublic;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;

    return this.prisma.milestone.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.milestone.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Milestone not found');
    }
    await this.prisma.milestone.delete({ where: { id } });
    return { success: true, message: 'Milestone deleted' };
  }

  async getForCommunication() {
    const milestones = await this.prisma.milestone.findMany({
      orderBy: [{ date: 'asc' }],
      select: {
        id: true,
        title: true,
        date: true,
        description: true,
        homeType: true,
        photos: true,
      },
    });
    return milestones.map((m) => ({
      ...m,
      year: m.date.getFullYear(),
      formattedDate: m.date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
      }),
      snippet: m.description
        ? m.description.length > 120
          ? m.description.substring(0, 120) + '...'
          : m.description
        : '',
    }));
  }

  async seed(userId: string) {
    const count = await this.prisma.milestone.count();
    if (count > 0) {
      return { message: 'Milestones already exist', seeded: 0 };
    }

    const orgName = (await this.orgProfileService.getProfile()).name;
    const milestones = [
      {
        title: 'Girls Home Started',
        date: new Date('2013-01-01'),
        description:
          `${orgName} established its first home dedicated to providing shelter, education, and care for orphan girls. This marked the beginning of our mission to uplift vulnerable children and give them a safe and nurturing environment.`,
        homeType: 'ORPHAN_GIRLS' as const,
        isPublic: true,
        sortOrder: 1,
        createdById: userId,
      },
      {
        title: 'Blind Boys Home Started',
        date: new Date('2021-01-01'),
        description:
          'Expanding our reach, the Blind Boys Home was inaugurated to support visually impaired boys with specialized care, education, and skill development. This home provides a loving community and opportunities for these children to thrive.',
        homeType: 'BLIND_BOYS' as const,
        isPublic: true,
        sortOrder: 2,
        createdById: userId,
      },
      {
        title: 'Old Age Home Started',
        date: new Date('2022-01-01'),
        description:
          'The Old Age Home was opened to provide dignity, care, and companionship to elderly individuals who have been abandoned or have no family support. Our dedicated staff ensures their comfort and well-being.',
        homeType: 'OLD_AGE' as const,
        isPublic: true,
        sortOrder: 3,
        createdById: userId,
      },
    ];

    await this.prisma.milestone.createMany({ data: milestones });
    return { message: 'Seeded 3 milestones', seeded: 3 };
  }
}
