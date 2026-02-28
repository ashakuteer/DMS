import { Module } from '@nestjs/common';
import { BirthdayWishController } from './birthday-wishes.controller';
import { BirthdayWishService } from './birthday-wishes.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailJobsModule } from '../email-jobs/email-jobs.module';
import { CommunicationLogModule } from '../communication-log/communication-log.module';

@Module({
  imports: [PrismaModule, EmailJobsModule, CommunicationLogModule],
  controllers: [BirthdayWishController],
  providers: [BirthdayWishService],
  exports: [BirthdayWishService],
})
export class BirthdayWishModule {}
