import { Module } from '@nestjs/common';
import { ReportCampaignsController } from './report-campaigns.controller';
import { ReportCampaignsService } from './report-campaigns.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailJobsModule } from '../email-jobs/email-jobs.module';

@Module({
  imports: [PrismaModule, EmailJobsModule],
  controllers: [ReportCampaignsController],
  providers: [ReportCampaignsService],
})
export class ReportCampaignsModule {}
