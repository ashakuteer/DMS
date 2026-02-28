import { Module, Global, forwardRef } from '@nestjs/common';
import { OrganizationProfileService } from './organization-profile.service';
import { OrganizationProfileController } from './organization-profile.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Global()
@Module({
  imports: [PrismaModule, forwardRef(() => EmailModule)],
  providers: [OrganizationProfileService],
  controllers: [OrganizationProfileController],
  exports: [OrganizationProfileService],
})
export class OrganizationProfileModule {}
