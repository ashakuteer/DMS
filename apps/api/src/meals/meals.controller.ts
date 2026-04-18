import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from "@nestjs/common";
import { MealsService } from "./meals.service";
import {
  CreateMealSponsorshipDto,
  UpdateMealSponsorshipDto,
  MealSponsorshipQueryDto,
  PostMealUpdateDto,
} from "./meals.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "@prisma/client";

@Controller("meals")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.FOUNDER,
  Role.ADMIN,
  Role.STAFF,
  Role.OFFICE_INCHARGE,
  Role.HOME_INCHARGE,
)
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Post()
  create(@Body() dto: CreateMealSponsorshipDto, @Request() req: any) {
    if (req.user.role === Role.HOME_INCHARGE) {
      throw new ForbiddenException("Home Incharges cannot create meal sponsorships");
    }
    return this.mealsService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query() query: MealSponsorshipQueryDto, @Request() req: any) {
    return this.mealsService.findAll(query, req.user);
  }

  @Get("pending-actions")
  findPendingActions(@Request() req: any) {
    return this.mealsService.findPendingActions(req.user);
  }

  @Post("quick-donor")
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF, Role.OFFICE_INCHARGE)
  quickCreateDonor(
    @Body() body: { firstName: string; lastName?: string; phone: string },
    @Request() req: any,
  ) {
    return this.mealsService.quickCreateDonor(body, req.user.id);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.mealsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateMealSponsorshipDto,
    @Request() req: any,
  ) {
    if (req.user.role === Role.HOME_INCHARGE) {
      throw new ForbiddenException("Home Incharges cannot edit meal sponsorship details; use the post-meal update instead");
    }
    return this.mealsService.update(id, dto);
  }

  @Patch(":id/post-meal")
  updatePostMeal(
    @Param("id") id: string,
    @Body() dto: PostMealUpdateDto,
    @Request() req: any,
  ) {
    return this.mealsService.updatePostMeal(id, dto, req.user.id, req.user);
  }

  @Post(":id/resend-whatsapp")
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF, Role.OFFICE_INCHARGE)
  resendWhatsApp(@Param("id") id: string, @Request() req: any) {
    return this.mealsService.resendWhatsApp(id, req.user.id);
  }

  @Delete(":id")
  @Roles(Role.FOUNDER, Role.ADMIN)
  remove(@Param("id") id: string) {
    return this.mealsService.remove(id);
  }
}
