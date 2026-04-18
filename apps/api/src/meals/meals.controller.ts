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
      const assigned = req.user.assignedHome as string | null | undefined;
      if (!assigned) {
        throw new ForbiddenException("No assigned home configured for this account");
      }
      // Enforce: every slotHomes entry and the legacy `homes` array must
      // contain ONLY the in-charge's assigned home. This is the backend
      // guarantee — the mobile UI also locks the field.
      const slotHomes = (dto as any).slotHomes as Record<string, string[]> | undefined | null;
      if (slotHomes && typeof slotHomes === "object") {
        for (const slot of Object.keys(slotHomes)) {
          const homes = slotHomes[slot] ?? [];
          for (const h of homes) {
            if (h !== assigned) {
              throw new ForbiddenException(
                `Home In-charge can only create meals for ${assigned}`,
              );
            }
          }
        }
      }
      const legacyHomes = (dto as any).homes as string[] | undefined | null;
      if (Array.isArray(legacyHomes)) {
        for (const h of legacyHomes) {
          if (h !== assigned) {
            throw new ForbiddenException(
              `Home In-charge can only create meals for ${assigned}`,
            );
          }
        }
      }
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
  findOne(@Param("id") id: string, @Request() req: any) {
    return this.mealsService.findOne(id, req.user);
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
