import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignsAnalyticsService } from './campaigns.analytics.service';
import { CampaignsCommunicationsService } from './campaigns.communications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailJobsModule } from '../email-jobs/email-jobs.module';
import { CommunicationLogModule } from '../communication-log/communication-log.module';
import { OrganizationProfileModule } from '../organization-profile/organization-profile.module';

@Module({
  imports: [PrismaModule, EmailJobsModule, CommunicationLogModule, OrganizationProfileModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignsAnalyticsService, CampaignsCommunicationsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
