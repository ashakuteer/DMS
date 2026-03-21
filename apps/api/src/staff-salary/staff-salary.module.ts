import { Module } from '@nestjs/common';
import { StaffSalaryController } from './staff-salary.controller';
import { StaffSalaryService } from './staff-salary.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StaffSalaryController],
  providers: [StaffSalaryService],
})
export class StaffSalaryModule {}
