import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimeMachineStartupService implements OnModuleInit {
  private readonly logger = new Logger(TimeMachineStartupService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureTimeMachineTable();
  }

  private async ensureTimeMachineTable() {
    try {
      await this.prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "TimeMachineCategory" AS ENUM (
            'SUCCESS_STORY',
            'INSPIRING_STORY',
            'RECOGNITION',
            'DONOR_SUPPORT',
            'EVENT_BY_KIDS',
            'VISITOR_VISIT',
            'CHALLENGE_PROBLEM',
            'GENERAL_UPDATE'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$
      `);

      await this.prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          CREATE TYPE "TimeMachineHome" AS ENUM (
            'ALL_HOMES',
            'GIRLS_HOME_UPPAL',
            'BLIND_HOME_BEGUMPET',
            'OLD_AGE_HOME_PEERZADIGUDA'
          );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "time_machine_entries" (
          "id"          TEXT                   NOT NULL,
          "title"       TEXT                   NOT NULL,
          "eventDate"   TIMESTAMP(3)           NOT NULL,
          "description" TEXT,
          "category"    "TimeMachineCategory"  NOT NULL,
          "home"        "TimeMachineHome"      NOT NULL,
          "photos"      TEXT[]                 NOT NULL DEFAULT ARRAY[]::TEXT[],
          "isPublic"    BOOLEAN                NOT NULL DEFAULT false,
          "createdById" TEXT                   NOT NULL,
          "createdAt"   TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt"   TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "time_machine_entries_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "time_machine_entries_createdById_fkey"
            FOREIGN KEY ("createdById") REFERENCES "users"("id")
            ON UPDATE CASCADE ON DELETE RESTRICT
        )
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "time_machine_entries_eventDate_idx"
          ON "time_machine_entries"("eventDate")
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "time_machine_entries_category_idx"
          ON "time_machine_entries"("category")
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "time_machine_entries_home_idx"
          ON "time_machine_entries"("home")
      `);

      this.logger.log('time_machine_entries table is ready');
    } catch (error) {
      this.logger.error('Failed to ensure time_machine_entries table:', error);
    }
  }
}
