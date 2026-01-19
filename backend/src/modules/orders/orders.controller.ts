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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { UpdateItemStatusDto } from './dto/update-item-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderItemResponseDto } from './dto/order-item-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReqUser } from '../../common/decorators/current-user.decorator';
import { ReqRestaurantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/types/auth.types';
import { Role } from '@prisma/client';

@Controller('api/v1/orders')
@UseGuards(JwtAuthGuard, TenantGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.WAITER)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @ReqRestaurantId() restaurantId: string,
    @ReqUser() user: CurrentUser,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.create(restaurantId, user.userId, createOrderDto);
  }

  @Post(':orderId/items')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.WAITER)
  @HttpCode(HttpStatus.CREATED)
  async addItem(
    @ReqRestaurantId() restaurantId: string,
    @Param('orderId') orderId: string,
    @Body() addOrderItemDto: AddOrderItemDto,
  ): Promise<OrderItemResponseDto> {
    return this.ordersService.addItem(restaurantId, orderId, addOrderItemDto);
  }

  @Patch(':orderId/items/:itemId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.WAITER)
  @HttpCode(HttpStatus.OK)
  async updateItem(
    @ReqRestaurantId() restaurantId: string,
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() updateOrderItemDto: UpdateOrderItemDto,
  ): Promise<OrderItemResponseDto> {
    return this.ordersService.updateItem(restaurantId, orderId, itemId, updateOrderItemDto);
  }

  @Delete(':orderId/items/:itemId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.WAITER)
  @HttpCode(HttpStatus.OK)
  async deleteItem(
    @ReqRestaurantId() restaurantId: string,
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
  ): Promise<OrderItemResponseDto> {
    return this.ordersService.deleteItem(restaurantId, orderId, itemId);
  }

  @Post(':orderId/confirm')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.WAITER)
  @HttpCode(HttpStatus.OK)
  async confirm(
    @ReqRestaurantId() restaurantId: string,
    @Param('orderId') orderId: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.confirm(restaurantId, orderId);
  }

  @Get('active')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.WAITER, Role.KITCHEN, Role.CASHIER)
  async findActive(
    @ReqRestaurantId() restaurantId: string,
    @Query('status') status?: string,
    @Query('tableSessionId') tableSessionId?: string,
  ): Promise<OrderResponseDto[]> {
    const statusArray = status ? status.split(',') : undefined;
    return this.ordersService.findActive(restaurantId, statusArray, tableSessionId);
  }

  @Post(':orderId/items/:itemId/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.KITCHEN)
  @HttpCode(HttpStatus.OK)
  async updateItemStatus(
    @ReqRestaurantId() restaurantId: string,
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() updateItemStatusDto: UpdateItemStatusDto,
  ): Promise<OrderItemResponseDto> {
    return this.ordersService.updateItemStatus(
      restaurantId,
      orderId,
      itemId,
      updateItemStatusDto,
    );
  }

  @Post(':orderId/close')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CASHIER)
  @HttpCode(HttpStatus.OK)
  async close(
    @ReqRestaurantId() restaurantId: string,
    @Param('orderId') orderId: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.close(restaurantId, orderId);
  }
}
