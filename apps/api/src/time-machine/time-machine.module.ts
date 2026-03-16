import { Module } from '@nestjs/common';
import { TimeMachineController } from './time-machine.controller';
import { TimeMachineService } from './time-machine.service';
import { TimeMachineStartupService } from './time-machine-startup.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [TimeMachineController],
  providers: [TimeMachineService, TimeMachineStartupService],
  exports: [TimeMachineService],
})
export class TimeMachineModule {}
