import { Module } from '@nestjs/common';
import { HealthScoreService } from './health-score.service';
import { HealthScoreScheduler } from './health-score.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [HealthScoreService, HealthScoreScheduler],
  exports: [HealthScoreService],
})
export class HealthScoreModule {}
