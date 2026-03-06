import { Module } from '@nestjs/common';
import { ReportCampaignsController } from './report-campaigns.controller';
import { ReportCampaignsService } from './report-campaigns.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module'; // Add this line

@Module({
  imports: [
    PrismaModule,
    StorageModule, // Add this line
  ],
  controllers: [ReportCampaignsController],
  providers: [ReportCampaignsService],
  exports: [ReportCampaignsService],
})
export class ReportCampaignsModule {}
