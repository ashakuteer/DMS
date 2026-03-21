import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { StaffRoleType, StaffStatus, StaffDocumentType } from '@prisma/client';

@Injectable()
export class StaffProfilesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async findAll(params: { roleType?: string; homeId?: string; designation?: string; status?: string }) {
    const where: any = {};
    if (params.roleType) where.roleType = params.roleType as StaffRoleType;
    if (params.homeId) where.homeId = params.homeId;
    if (params.status) where.status = params.status as StaffStatus;
    if (params.designation) {
      where.designation = { contains: params.designation, mode: 'insensitive' };
    }
    return this.prisma.staff.findMany({
      where,
      include: { home: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        home: true,
        documents: { orderBy: { createdAt: 'desc' } },
        bankDetails: true,
      },
    });
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  async create(data: {
    name: string;
    phone?: string;
    email?: string;
    roleType: StaffRoleType;
    designation?: string;
    homeId?: string;
    status?: StaffStatus;
    profilePhotoUrl?: string;
    bloodGroup?: string;
    emergencyContact1Name?: string;
    emergencyContact1Phone?: string;
    emergencyContact2Name?: string;
    emergencyContact2Phone?: string;
  }) {
    return this.prisma.staff.create({
      data,
      include: { home: true },
    });
  }

  async update(id: string, data: Partial<{
    name: string;
    phone: string;
    email: string;
    roleType: StaffRoleType;
    designation: string;
    homeId: string;
    status: StaffStatus;
    profilePhotoUrl: string;
    bloodGroup: string;
    emergencyContact1Name: string;
    emergencyContact1Phone: string;
    emergencyContact2Name: string;
    emergencyContact2Phone: string;
  }>) {
    await this.findOne(id);
    return this.prisma.staff.update({
      where: { id },
      data,
      include: { home: true, bankDetails: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.staff.delete({ where: { id } });
  }

  async uploadPhoto(staffId: string, file: Express.Multer.File) {
    await this.findOne(staffId);
    const { url } = await this.storage.uploadStaffPhoto(
      staffId,
      file.buffer,
      file.mimetype,
      file.originalname,
    );
    return this.prisma.staff.update({
      where: { id: staffId },
      data: { profilePhotoUrl: url },
      select: { id: true, profilePhotoUrl: true },
    });
  }

  async uploadDocument(staffId: string, file: Express.Multer.File, docType: string) {
    await this.findOne(staffId);
    const { url } = await this.storage.uploadStaffDocument(
      staffId,
      file.buffer,
      file.mimetype,
      file.originalname,
      docType,
    );
    return this.prisma.staffDocument.create({
      data: {
        staffId,
        type: docType as StaffDocumentType,
        fileUrl: url,
      },
    });
  }

  async getDocuments(staffId: string) {
    return this.prisma.staffDocument.findMany({
      where: { staffId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteDocument(docId: string) {
    return this.prisma.staffDocument.delete({ where: { id: docId } });
  }

  async getBankDetails(staffId: string) {
    return this.prisma.staffBankDetails.findUnique({ where: { staffId } });
  }

  async upsertBankDetails(
    staffId: string,
    data: {
      bankName?: string;
      accountHolderName?: string;
      accountNumber?: string;
      ifsc?: string;
      branch?: string;
    },
  ) {
    await this.findOne(staffId);
    return this.prisma.staffBankDetails.upsert({
      where: { staffId },
      create: { staffId, ...data },
      update: data,
    });
  }

  async findAllHomes() {
    return this.prisma.home.findMany({ orderBy: { name: 'asc' } });
  }

  async createHome(data: { name: string; address?: string }) {
    return this.prisma.home.create({ data });
  }
}
