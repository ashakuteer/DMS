import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsQueryService } from './reports.query.service';
import { ReportsExportService } from './reports.export.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationProfileModule } from '../organization-profile/organization-profile.module';

@Module({
  imports: [PrismaModule, OrganizationProfileModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsQueryService, ReportsExportService],
})
export class ReportsModule {}
