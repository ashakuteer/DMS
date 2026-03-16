import { Module } from '@nestjs/common';
import { BirthdayWishController } from './birthday-wishes.controller';
import { BirthdayWishService } from './birthday-wishes.service';
import { BirthdayWishBeneficiaryService } from './birthday-wishes.beneficiary.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailJobsModule } from '../email-jobs/email-jobs.module';
import { CommunicationLogModule } from '../communication-log/communication-log.module';
import { OrganizationProfileModule } from '../organization-profile/organization-profile.module';

@Module({
  imports: [PrismaModule, EmailJobsModule, CommunicationLogModule, OrganizationProfileModule],
  controllers: [BirthdayWishController],
  providers: [BirthdayWishService, BirthdayWishBeneficiaryService],
  exports: [BirthdayWishService],
})
export class BirthdayWishModule {}
