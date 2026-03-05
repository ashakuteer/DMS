import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "@prisma/client";
import { UserContext, DonorQueryOptions } from "./donors.types";
import { maskDonorData } from "../common/utils/masking.util";

@Injectable()
export class DonorsCrudService {
  constructor(private prisma: PrismaService) {}

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

  // continue the rest of your original findAll logic here...
}

  }

  async findOne(user: UserContext, id: string) {
    const donor = await this.prisma.donor.findFirst({
      where: {
        id,
        isDeleted: false,
        ...this.getAccessFilter(user),
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

  async create(data: any) {
    return this.prisma.donor.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.donor.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return this.prisma.donor.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async lookupByPhone(phone: string) {
    return this.prisma.donor.findFirst({
      where: {
        OR: [
          { primaryPhone: phone },
          { whatsappPhone: phone },
        ],
        isDeleted: false,
      },
    });
  }

  async assignDonor(id: string, assignedToUserId: string | null) {
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
