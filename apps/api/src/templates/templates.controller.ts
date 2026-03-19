import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TemplatesService, CreateTemplateDto, UpdateTemplateDto } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async findAll() {
    return this.templatesService.findAll();
  }

  @Get(':id')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post()
  @Roles(Role.FOUNDER, Role.ADMIN)
  async create(@Body() dto: CreateTemplateDto, @Request() req: any) {
    return this.templatesService.create(dto, req.user.userId);
  }

  @Put(':id')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @Request() req: any,
  ) {
    return this.templatesService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async delete(@Param('id') id: string) {
    return this.templatesService.delete(id);
  }

  @Post('seed')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async seed(@Request() req: any) {
    return this.templatesService.seedDefaultTemplates(req.user.userId);
  }

  @Post('resolve')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async resolveTemplate(
    @Body()
    body: {
      template: string;
      data: {
        donorName?: string;
        amount?: string;
        donationDate?: string;
        programName?: string;
        receiptNumber?: string;
      };
    },
  ) {
    const resolved = this.templatesService.resolvePlaceholders(body.template, body.data);
    return { resolved };
  }
}
