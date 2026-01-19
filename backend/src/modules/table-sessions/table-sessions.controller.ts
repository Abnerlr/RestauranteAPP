import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TableSessionsService } from './table-sessions.service';
import { OpenSessionDto } from './dto/open-session.dto';
import { RequestCheckoutDto } from './dto/request-checkout.dto';
import { CloseSessionDto } from './dto/close-session.dto';
import { SessionResponseDto } from './dto/session-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReqUser } from '../../common/decorators/current-user.decorator';
import { ReqRestaurantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/types/auth.types';
import { Role } from '@prisma/client';

@Controller('api/v1/table-sessions')
@UseGuards(JwtAuthGuard, TenantGuard)
export class TableSessionsController {
  constructor(private readonly tableSessionsService: TableSessionsService) {}

  @Post('open')
  @UseGuards(RolesGuard)
  @Roles(Role.WAITER, Role.CASHIER)
  @HttpCode(HttpStatus.CREATED)
  async openSession(
    @ReqRestaurantId() restaurantId: string,
    @ReqUser() user: CurrentUser,
    @Body() openSessionDto: OpenSessionDto,
  ): Promise<SessionResponseDto> {
    return this.tableSessionsService.openSession(restaurantId, user.userId, openSessionDto);
  }

  @Post('request-checkout')
  @UseGuards(RolesGuard)
  @Roles(Role.WAITER, Role.CASHIER)
  @HttpCode(HttpStatus.OK)
  async requestCheckout(
    @ReqRestaurantId() restaurantId: string,
    @Body() requestCheckoutDto: RequestCheckoutDto,
  ): Promise<SessionResponseDto> {
    return this.tableSessionsService.requestCheckout(restaurantId, requestCheckoutDto);
  }

  @Post('close')
  @UseGuards(RolesGuard)
  @Roles(Role.CASHIER)
  @HttpCode(HttpStatus.OK)
  async closeSession(
    @ReqRestaurantId() restaurantId: string,
    @Body() closeSessionDto: CloseSessionDto,
  ): Promise<SessionResponseDto> {
    return this.tableSessionsService.closeSession(restaurantId, closeSessionDto);
  }

  @Get('active')
  @UseGuards(RolesGuard)
  @Roles(Role.CASHIER, Role.ADMIN)
  async findActiveSessions(
    @ReqRestaurantId() restaurantId: string,
  ): Promise<SessionResponseDto[]> {
    return this.tableSessionsService.findActiveSessions(restaurantId);
  }
}
