import { Module } from '@nestjs/common';
import { HomeSummaryService } from './home-summary.service';
import { HomeSummaryController } from './home-summary.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationProfileModule } from '../organization-profile/organization-profile.module';

@Module({
  imports: [PrismaModule, OrganizationProfileModule],
  controllers: [HomeSummaryController],
  providers: [HomeSummaryService],
})
export class HomeSummaryModule {}
