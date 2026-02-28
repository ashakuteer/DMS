import { Module } from '@nestjs/common';
import { StaffTasksController } from './staff-tasks.controller';
import { StaffTasksService } from './staff-tasks.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StaffTasksController],
  providers: [StaffTasksService],
  exports: [StaffTasksService],
})
export class StaffTasksModule {}
