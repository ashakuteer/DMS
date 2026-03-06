import { Module } from '@nestjs/common';
import { ReportCampaignsController } from './report-campaigns.controller';
import { ReportCampaignsService } from './report-campaigns.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { EmailJobsModule } from '../email-jobs/email-jobs.module'; // This line
import { OrganizationProfileModule } from '../organization-profile/organization-profile.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    EmailJobsModule, // This line
    OrganizationProfileModule,
  ],
  controllers: [ReportCampaignsController],
  providers: [ReportCampaignsService],
  exports: [ReportCampaignsService],
})
export class ReportCampaignsModule {}
