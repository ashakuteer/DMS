import { Module } from '@nestjs/common';
import { StaffProfilesController } from './staff-profiles.controller';
import { StaffProfilesService } from './staff-profiles.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [StaffProfilesController],
  providers: [StaffProfilesService],
})
export class StaffProfilesModule {}
