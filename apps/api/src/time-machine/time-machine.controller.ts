import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TimeMachineService } from './time-machine.service';
import { CreateTimeMachineEntryDto, UpdateTimeMachineEntryDto } from './time-machine.dto';
import { Role } from '@prisma/client';

@Controller('time-machine')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimeMachineController {
  constructor(private readonly timeMachineService: TimeMachineService) {}

  @Get()
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('home') home?: string,
    @Query('search') search?: string,
    @Query('year') year?: string,
  ) {
    return this.timeMachineService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      category,
      home,
      search,
      year: year ? parseInt(year, 10) : undefined,
    });
  }

  @Get('years')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async getAvailableYears() {
    return this.timeMachineService.getAvailableYears();
  }

  @Get(':id')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async findOne(@Param('id') id: string) {
    return this.timeMachineService.findOne(id);
  }

  @Post()
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async create(
    @CurrentUser() user: any,
    @Body() dto: CreateTimeMachineEntryDto,
  ) {
    return this.timeMachineService.create(user.id, dto);
  }

  @Patch(':id')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTimeMachineEntryDto,
  ) {
    return this.timeMachineService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.FOUNDER, Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.timeMachineService.remove(id);
  }

  @Post(':id/photos')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/^image\/(jpeg|jpg|png|webp)$/)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Only jpg, jpeg, png, webp files are allowed'),
            false,
          );
        }
      },
    }),
  )
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No photo uploaded');
    }
    return this.timeMachineService.uploadPhoto(id, file);
  }

  @Delete(':id/photos')
  @Roles(Role.FOUNDER, Role.ADMIN, Role.STAFF)
  async deletePhoto(
    @Param('id') id: string,
    @Body() body: { photoUrl: string },
  ) {
    if (!body.photoUrl) {
      throw new BadRequestException('photoUrl is required');
    }
    return this.timeMachineService.deletePhoto(id, body.photoUrl);
  }
}
