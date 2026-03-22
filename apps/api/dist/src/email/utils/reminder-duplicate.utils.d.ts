import { PrismaService } from '../../prisma/prisma.service';
export declare function checkDuplicate(prisma: PrismaService, donorId: string, type: string, relatedId: string, offsetDays: number): Promise<boolean>;
