import { Module } from '@nestjs/common';
import { NgoDocumentsController } from './ngo-documents.controller';
import { NgoDocumentsService } from './ngo-documents.service';
import { NgoDocumentsScheduler } from './ngo-documents.scheduler';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NgoDocumentsController],
  providers: [NgoDocumentsService, NgoDocumentsScheduler],
  exports: [NgoDocumentsService],
})
export class NgoDocumentsModule {}
