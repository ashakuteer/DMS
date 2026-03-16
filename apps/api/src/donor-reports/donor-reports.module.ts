import { Module } from '@nestjs/common';
import { DonorReportsController } from './donor-reports.controller';
import { DonorReportsService } from './donor-reports.service';
import { DonorReportsExportService } from './donor-reports.export.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailJobsModule } from '../email-jobs/email-jobs.module';
import { OrganizationProfileModule } from '../organization-profile/organization-profile.module';

@Module({
  imports: [PrismaModule, EmailJobsModule, OrganizationProfileModule],
  controllers: [DonorReportsController],
  providers: [DonorReportsService, DonorReportsExportService],
})
export class DonorReportsModule {}
