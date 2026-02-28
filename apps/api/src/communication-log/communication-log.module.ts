import { Module } from '@nestjs/common';
import { CommunicationLogService } from './communication-log.service';
import { CommunicationLogController } from './communication-log.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommunicationLogController],
  providers: [CommunicationLogService],
  exports: [CommunicationLogService],
})
export class CommunicationLogModule {}
