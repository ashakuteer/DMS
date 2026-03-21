import { Module } from '@nestjs/common';
import { StaffLeavesController } from './staff-leaves.controller';
import { StaffLeavesService } from './staff-leaves.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StaffLeavesController],
  providers: [StaffLeavesService],
})
export class StaffLeavesModule {}
