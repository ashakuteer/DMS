import { Module } from '@nestjs/common';
import { BeneficiaryProgressReportsController } from './beneficiary-progress-reports.controller';
import { BeneficiaryProgressReportsService } from './beneficiary-progress-reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailJobsModule } from '../email-jobs/email-jobs.module';
import { OrganizationProfileModule } from '../organization-profile/organization-profile.module';

@Module({
  imports: [PrismaModule, EmailJobsModule, OrganizationProfileModule],
  controllers: [BeneficiaryProgressReportsController],
  providers: [BeneficiaryProgressReportsService],
})
export class BeneficiaryProgressReportsModule {}
