import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BeneficiaryDocumentsService {

  constructor(private prisma: PrismaService) {}

  async getDocuments(user: any, ownerType: string, ownerId?: string) {

    const where: any = { ownerType };

    if (ownerId) where.ownerId = ownerId;

    return this.prisma.document.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createDocument(user: any, dto: any) {
    return this.prisma.document.create({
      data: {
        ...dto,
        createdById: user.id,
      },
    });
  }

  async getDocumentById(user: any, docId: string) {
    return this.prisma.document.findUnique({
      where: { id: docId },
    });
  }
}
