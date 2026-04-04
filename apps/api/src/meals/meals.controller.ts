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
} from "@nestjs/common";
import { MealsService } from "./meals.service";
import {
  CreateMealSponsorshipDto,
  UpdateMealSponsorshipDto,
  MealSponsorshipQueryDto,
} from "./meals.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "@prisma/client";

@Controller("meals")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Post()
  create(@Body() dto: CreateMealSponsorshipDto, @Request() req: any) {
    return this.mealsService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Query() query: MealSponsorshipQueryDto) {
    return this.mealsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.mealsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateMealSponsorshipDto) {
    return this.mealsService.update(id, dto);
  }

  @Delete(":id")
  @Roles(Role.FOUNDER, Role.ADMIN)
  remove(@Param("id") id: string) {
    return this.mealsService.remove(id);
  }
}
