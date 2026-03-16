import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateTimeMachineEntryDto, UpdateTimeMachineEntryDto } from './time-machine.dto';

@Injectable()
export class TimeMachineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    category?: string;
    home?: string;
    search?: string;
    year?: number;
  }) {
    const { page = 1, limit = 20, category, home, search, year } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) where.category = category;
    if (home) where.home = home;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (year) {
      where.eventDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      };
    }

    const [entries, total] = await Promise.all([
      this.prisma.timeMachineEntry.findMany({
        where,
        orderBy: { eventDate: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.timeMachineEntry.count({ where }),
    ]);

    return {
      entries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const entry = await this.prisma.timeMachineEntry.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });
    if (!entry) {
      throw new NotFoundException(`Time Machine entry ${id} not found`);
    }
    return entry;
  }

  async create(userId: string, dto: CreateTimeMachineEntryDto) {
    return this.prisma.timeMachineEntry.create({
      data: {
        title: dto.title,
        eventDate: new Date(dto.eventDate),
        description: dto.description,
        category: dto.category,
        home: dto.home,
        isPublic: dto.isPublic ?? false,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateTimeMachineEntryDto) {
    await this.findOne(id);
    return this.prisma.timeMachineEntry.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.eventDate !== undefined && { eventDate: new Date(dto.eventDate) }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.home !== undefined && { home: dto.home }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async remove(id: string) {
    const entry = await this.findOne(id);
    if (entry.photos && entry.photos.length > 0) {
      for (const photoUrl of entry.photos) {
        await this.storageService.deleteTimeMachinePhoto(photoUrl).catch(() => {});
      }
    }
    await this.prisma.timeMachineEntry.delete({ where: { id } });
    return { success: true };
  }

  async uploadPhoto(
    id: string,
    file: Express.Multer.File,
  ) {
    await this.findOne(id);

    const { url } = await this.storageService.uploadTimeMachinePhoto(
      id,
      file.buffer,
      file.mimetype,
      file.originalname,
    );

    const entry = await this.prisma.timeMachineEntry.update({
      where: { id },
      data: {
        photos: {
          push: url,
        },
      },
    });

    return { url, photos: entry.photos };
  }

  async deletePhoto(id: string, photoUrl: string) {
    const entry = await this.findOne(id);
    const photos = entry.photos.filter((p) => p !== photoUrl);

    await this.storageService.deleteTimeMachinePhoto(photoUrl).catch(() => {});

    await this.prisma.timeMachineEntry.update({
      where: { id },
      data: { photos },
    });

    return { success: true, photos };
  }

  async getAvailableYears() {
    const entries = await this.prisma.timeMachineEntry.findMany({
      select: { eventDate: true },
      orderBy: { eventDate: 'desc' },
    });

    const years = [...new Set(entries.map((e) => e.eventDate.getFullYear()))];
    return years.sort((a, b) => b - a);
  }
}
