import { Module } from "@nestjs/common";
import { MealsController } from "./meals.controller";
import { MealsService } from "./meals.service";
import { PrismaModule } from "../prisma/prisma.module";
import { NotificationModule } from "../notifications/notification.module";

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [MealsController],
  providers: [MealsService],
  exports: [MealsService],
})
export class MealsModule {}
