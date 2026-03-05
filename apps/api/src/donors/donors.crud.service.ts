import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "@prisma/client";
import { UserContext, DonorQueryOptions } from "./donors.types";
import { maskDonorData } from "../common/utils/masking.util";

@Injectable()
export class DonorsCrudService {
  constructor(private prisma: PrismaService) {}

  private getAccessFilter(user: UserContext): any {
    if (user.role === Role.TELECALLER) return { assignedToUserId: user.id };
    return {};
  }

  private shouldMaskData(user: UserContext): boolean {
    return user.role === Role.TELECALLER || user.role === Role.VIEWER;
  }

  async findAll(user: UserContext, options: DonorQueryOptions = {}) {
    // (PASTE your full findAll logic here)
  }
}
