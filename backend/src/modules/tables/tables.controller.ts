import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { TableResponseDto } from './dto/table-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReqRestaurantId } from '../../common/decorators/tenant.decorator';
import { Role } from '@prisma/client';

@Controller('tables')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.WAITER, Role.CASHIER, Role.ADMIN)
  async findAll(@ReqRestaurantId() restaurantId: string): Promise<TableResponseDto[]> {
    return this.tablesService.findAll(restaurantId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @ReqRestaurantId() restaurantId: string,
    @Body() createTableDto: CreateTableDto,
  ): Promise<TableResponseDto> {
    return this.tablesService.create(restaurantId, createTableDto);
  }
}
