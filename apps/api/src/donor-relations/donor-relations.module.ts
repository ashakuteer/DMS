import { Module } from '@nestjs/common';
import { DonorRelationsController } from './donor-relations.controller';
import { DonorRelationsService } from './donor-relations.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [DonorRelationsController],
  providers: [DonorRelationsService],
  exports: [DonorRelationsService],
})
export class DonorRelationsModule {}
