import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NgoDocCategory, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class NgoDocumentsService {
  private readonly logger = new Logger(NgoDocumentsService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'ngo-documents');

  constructor(private prisma: PrismaService) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async findAll(params: {
    category?: string;
    search?: string;
    expiryStatus?: string;
    page: number;
    limit: number;
  }) {
    const { category, search, expiryStatus, page, limit } = params;
    const where: Prisma.NgoDocumentWhereInput = { isActive: true };

    if (category && category !== 'ALL') {
      where.category = category as NgoDocCategory;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (expiryStatus === 'EXPIRED') {
      where.expiryDate = { lt: new Date() };
    } else if (expiryStatus === 'EXPIRING_SOON') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.expiryDate = { gte: new Date(), lte: thirtyDaysFromNow };
    } else if (expiryStatus === 'VALID') {
      where.OR = [
        { expiryDate: null },
        { expiryDate: { gt: new Date() } },
      ];
      if (search) {
        where.AND = [
          {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              { fileName: { contains: search, mode: 'insensitive' } },
            ],
          },
          {
            OR: [
              { expiryDate: null },
              { expiryDate: { gt: new Date() } },
            ],
          },
        ];
        delete where.OR;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.ngoDocument.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          uploadedBy: { select: { id: true, name: true } },
          _count: { select: { versions: true } },
        },
      }),
      this.prisma.ngoDocument.count({ where }),
    ]);

    const stats = await this.getStats();

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
    };
  }

  async getStats() {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [totalDocs, expiredCount, expiringSoonCount, categoryBreakdown] = await Promise.all([
      this.prisma.ngoDocument.count({ where: { isActive: true } }),
      this.prisma.ngoDocument.count({
        where: { isActive: true, expiryDate: { lt: now } },
      }),
      this.prisma.ngoDocument.count({
        where: {
          isActive: true,
          expiryDate: { gte: now, lte: thirtyDaysFromNow },
        },
      }),
      this.prisma.ngoDocument.groupBy({
        by: ['category'],
        where: { isActive: true },
        _count: true,
      }),
    ]);

    return {
      totalDocs,
      expiredCount,
      expiringSoonCount,
      validCount: totalDocs - expiredCount - expiringSoonCount,
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.category,
        count: c._count,
      })),
    };
  }

  async findOne(id: string, userId: string) {
    const doc = await this.prisma.ngoDocument.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: { id: true, name: true } },
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
        },
        _count: { select: { versions: true } },
      },
    });

    if (!doc || !doc.isActive) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.ngoDocumentAccessLog.create({
      data: { documentId: id, userId, action: 'VIEW' },
    });

    return doc;
  }

  async upload(
    file: Express.Multer.File,
    data: {
      title: string;
      description?: string;
      category: string;
      expiryDate?: string;
    },
    userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 25MB limit');
    }

    const timestamp = Date.now();
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageName = `${timestamp}-${safeFileName}`;
    const filePath = path.join(this.uploadDir, storageName);

    fs.writeFileSync(filePath, file.buffer);

    const doc = await this.prisma.ngoDocument.create({
      data: {
        title: data.title,
        description: data.description || null,
        category: data.category as NgoDocCategory,
        fileName: file.originalname,
        filePath: storageName,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        uploadedById: userId,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    await this.prisma.ngoDocumentVersion.create({
      data: {
        documentId: doc.id,
        versionNumber: 1,
        fileName: file.originalname,
        filePath: storageName,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        changeNote: 'Initial upload',
        uploadedById: userId,
      },
    });

    await this.prisma.ngoDocumentAccessLog.create({
      data: { documentId: doc.id, userId, action: 'UPLOAD' },
    });

    return doc;
  }

  async uploadNewVersion(
    id: string,
    file: Express.Multer.File,
    changeNote: string | undefined,
    userId: string,
  ) {
    const doc = await this.prisma.ngoDocument.findUnique({ where: { id } });
    if (!doc || !doc.isActive) {
      throw new NotFoundException('Document not found');
    }

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 25MB limit');
    }

    const newVersion = doc.currentVersion + 1;
    const timestamp = Date.now();
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageName = `${timestamp}-${safeFileName}`;
    const filePath = path.join(this.uploadDir, storageName);

    fs.writeFileSync(filePath, file.buffer);

    const [updatedDoc] = await this.prisma.$transaction([
      this.prisma.ngoDocument.update({
        where: { id },
        data: {
          fileName: file.originalname,
          filePath: storageName,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          currentVersion: newVersion,
        },
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.ngoDocumentVersion.create({
        data: {
          documentId: id,
          versionNumber: newVersion,
          fileName: file.originalname,
          filePath: storageName,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          changeNote: changeNote || `Version ${newVersion}`,
          uploadedById: userId,
        },
      }),
      this.prisma.ngoDocumentAccessLog.create({
        data: { documentId: id, userId, action: 'VERSION_UPLOAD' },
      }),
    ]);

    return updatedDoc;
  }

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      expiryDate?: string | null;
    },
    userId: string,
  ) {
    const doc = await this.prisma.ngoDocument.findUnique({ where: { id } });
    if (!doc || !doc.isActive) {
      throw new NotFoundException('Document not found');
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category as NgoDocCategory;
    if (data.expiryDate !== undefined) {
      updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    }

    const updated = await this.prisma.ngoDocument.update({
      where: { id },
      data: updateData,
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    await this.prisma.ngoDocumentAccessLog.create({
      data: { documentId: id, userId, action: 'UPDATE' },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const doc = await this.prisma.ngoDocument.findUnique({ where: { id } });
    if (!doc || !doc.isActive) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.ngoDocument.update({
      where: { id },
      data: { isActive: false },
    });

    await this.prisma.ngoDocumentAccessLog.create({
      data: { documentId: id, userId, action: 'DELETE' },
    });

    return { message: 'Document deleted' };
  }

  async getFilePath(id: string, userId: string, versionId?: string) {
    let filePath: string;
    let fileName: string;
    let mimeType: string;

    if (versionId) {
      const version = await this.prisma.ngoDocumentVersion.findUnique({
        where: { id: versionId },
        include: { document: true },
      });
      if (!version || !version.document.isActive) {
        throw new NotFoundException('Version not found');
      }
      filePath = version.filePath;
      fileName = version.fileName;
      mimeType = version.mimeType;
    } else {
      const doc = await this.prisma.ngoDocument.findUnique({ where: { id } });
      if (!doc || !doc.isActive) {
        throw new NotFoundException('Document not found');
      }
      filePath = doc.filePath;
      fileName = doc.fileName;
      mimeType = doc.mimeType;
    }

    const fullPath = path.join(this.uploadDir, filePath);
    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('File not found on server');
    }

    await this.prisma.ngoDocumentAccessLog.create({
      data: { documentId: id, userId, action: 'DOWNLOAD' },
    });

    return { fullPath, fileName, mimeType };
  }

  async getAccessLog(id: string) {
    const doc = await this.prisma.ngoDocument.findUnique({ where: { id } });
    if (!doc || !doc.isActive) {
      throw new NotFoundException('Document not found');
    }

    return this.prisma.ngoDocumentAccessLog.findMany({
      where: { documentId: id },
      orderBy: { accessedAt: 'desc' },
      take: 50,
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  async getExpiringDocuments(daysAhead: number = 30) {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + daysAhead);

    return this.prisma.ngoDocument.findMany({
      where: {
        isActive: true,
        expiryDate: { gte: now, lte: future },
      },
      orderBy: { expiryDate: 'asc' },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getExpiredDocuments() {
    return this.prisma.ngoDocument.findMany({
      where: {
        isActive: true,
        expiryDate: { lt: new Date() },
      },
      orderBy: { expiryDate: 'asc' },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
