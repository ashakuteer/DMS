import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimeMachineStartupService implements OnModuleInit {
  private readonly logger = new Logger(TimeMachineStartupService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.verifyTimeMachineTable();
  }

  private async verifyTimeMachineTable() {
    try {
      await this.prisma.$queryRaw`SELECT 1 FROM "time_machine_entries" LIMIT 1`;
      this.logger.log('time_machine_entries table is ready');
    } catch {
      this.logger.warn('time_machine_entries table not found — it must be created via migration before use');
    }
  }
}
