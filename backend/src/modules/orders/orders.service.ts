import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { UpdateItemStatusDto } from './dto/update-item-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderItemResponseDto } from './dto/order-item-response.dto';
import { EventsEmitterService } from './services/events-emitter.service';
import { OrderStatus, OrderItemStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventsEmitter: EventsEmitterService,
  ) {}

  private mapOrderToResponse(order: any): OrderResponseDto {
    return {
      id: order.id,
      restaurantId: order.restaurantId,
      tableSessionId: order.tableSessionId,
      createdByUserId: order.createdByUserId,
      status: order.status,
      notes: order.notes,
      confirmedAt: order.confirmedAt,
      closedAt: order.closedAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item: any) => this.mapOrderItemToResponse(item)),
    };
  }

  private mapOrderItemToResponse(item: any): OrderItemResponseDto {
    return {
      id: item.id,
      orderId: item.orderId,
      name: item.name,
      qty: item.qty,
      unitPrice: item.unitPrice ? item.unitPrice.toString() : null,
      status: item.status,
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async create(
    restaurantId: string,
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    // Validate table session exists and belongs to restaurant
    const tableSession = await this.prisma.tableSession.findFirst({
      where: {
        id: createOrderDto.tableSessionId,
        restaurantId,
      },
    });

    if (!tableSession) {
      throw new NotFoundException('Table session not found');
    }

    if (tableSession.status === 'CLOSED') {
      throw new BadRequestException('Cannot create order for closed table session');
    }

    // Create order in DRAFT status
    const order = await this.prisma.order.create({
      data: {
        restaurantId,
        tableSessionId: createOrderDto.tableSessionId,
        createdByUserId: userId,
        status: 'DRAFT',
        notes: createOrderDto.notes || null,
      },
      include: {
        items: true,
      },
    });

    return this.mapOrderToResponse(order);
  }

  async addItem(
    restaurantId: string,
    orderId: string,
    addOrderItemDto: AddOrderItemDto,
  ): Promise<OrderItemResponseDto> {
    // Validate order exists and belongs to restaurant
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'DRAFT') {
      throw new ConflictException('Cannot add items to order that is not in DRAFT status');
    }

    // Create order item
    const item = await this.prisma.orderItem.create({
      data: {
        restaurantId,
        orderId,
        name: addOrderItemDto.name,
        qty: addOrderItemDto.qty,
        unitPrice: addOrderItemDto.unitPrice
          ? new Decimal(addOrderItemDto.unitPrice)
          : null,
        status: 'PENDING',
        notes: addOrderItemDto.notes || null,
      },
    });

    return this.mapOrderItemToResponse(item);
  }

  async updateItem(
    restaurantId: string,
    orderId: string,
    itemId: string,
    updateOrderItemDto: UpdateOrderItemDto,
  ): Promise<OrderItemResponseDto> {
    // Validate order and item exist and belong to restaurant
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'DRAFT') {
      throw new ConflictException('Cannot update items in order that is not in DRAFT status');
    }

    const item = await this.prisma.orderItem.findFirst({
      where: {
        id: itemId,
        orderId,
        restaurantId,
      },
    });

    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    if (item.status === 'CANCELLED') {
      throw new ConflictException('Cannot update cancelled item');
    }

    // Update item
    const updateData: any = {};
    if (updateOrderItemDto.name !== undefined) updateData.name = updateOrderItemDto.name;
    if (updateOrderItemDto.qty !== undefined) updateData.qty = updateOrderItemDto.qty;
    if (updateOrderItemDto.unitPrice !== undefined) {
      updateData.unitPrice = updateOrderItemDto.unitPrice
        ? new Decimal(updateOrderItemDto.unitPrice)
        : null;
    }
    if (updateOrderItemDto.notes !== undefined) {
      updateData.notes = updateOrderItemDto.notes || null;
    }

    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return this.mapOrderItemToResponse(updatedItem);
  }

  async deleteItem(
    restaurantId: string,
    orderId: string,
    itemId: string,
  ): Promise<OrderItemResponseDto> {
    // Validate order and item exist and belong to restaurant
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'DRAFT') {
      throw new ConflictException('Cannot delete items from order that is not in DRAFT status');
    }

    const item = await this.prisma.orderItem.findFirst({
      where: {
        id: itemId,
        orderId,
        restaurantId,
      },
    });

    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    if (item.status === 'CANCELLED') {
      throw new ConflictException('Item is already cancelled');
    }

    // Soft cancel: set status to CANCELLED
    const cancelledItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status: 'CANCELLED' },
    });

    return this.mapOrderItemToResponse(cancelledItem);
  }

  async confirm(restaurantId: string, orderId: string): Promise<OrderResponseDto> {
    // Validate order exists and belongs to restaurant
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // a) Validate order.status === DRAFT
    if (order.status !== 'DRAFT') {
      throw new ConflictException('Order is not in DRAFT status');
    }

    // b) Validate order.items.length >= 1
    if (order.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    // c) NO permitir confirmar si existe algún item.status === CANCELLED
    const hasCancelledItems = order.items.some((item) => item.status === 'CANCELLED');
    if (hasCancelledItems) {
      throw new ConflictException('Cannot confirm order with cancelled items');
    }

    // d) NO permitir confirmar si existe algún item.status !== PENDING
    const hasNonPendingItems = order.items.some((item) => item.status !== 'PENDING');
    if (hasNonPendingItems) {
      throw new ConflictException('All items must be in PENDING status to confirm order');
    }

    // Confirm order in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const confirmedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
        include: {
          items: true,
        },
      });

      return confirmedOrder;
    });

    // Emit WebSocket event with complete payload
    const mappedItems = result.items.map((item: any) => this.mapOrderItemToResponse(item));
    await this.eventsEmitter.emitOrderNew({
      orderId: result.id,
      restaurantId: result.restaurantId,
      tableSessionId: result.tableSessionId,
      status: result.status,
      items: mappedItems,
      createdAt: result.createdAt,
    });

    return this.mapOrderToResponse(result);
  }

  async findActive(
    restaurantId: string,
    status?: string[],
    tableSessionId?: string,
  ): Promise<OrderResponseDto[]> {
    const where: any = {
      restaurantId,
    };

    // Default status filter: DRAFT, CONFIRMED, IN_PROGRESS, READY
    if (status && status.length > 0) {
      where.status = { in: status as OrderStatus[] };
    } else {
      where.status = {
        in: ['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'READY'],
      };
    }

    if (tableSessionId) {
      where.tableSessionId = tableSessionId;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map((order) => this.mapOrderToResponse(order));
  }

  private isValidStatusTransition(
    currentStatus: OrderItemStatus,
    newStatus: OrderItemStatus,
  ): boolean {
    // PENDING -> IN_PROGRESS, CANCELLED
    if (currentStatus === 'PENDING') {
      return newStatus === 'IN_PROGRESS' || newStatus === 'CANCELLED';
    }

    // IN_PROGRESS -> READY, CANCELLED
    if (currentStatus === 'IN_PROGRESS') {
      return newStatus === 'READY' || newStatus === 'CANCELLED';
    }

    // READY -> no changes allowed
    if (currentStatus === 'READY') {
      return false;
    }

    // CANCELLED -> no changes allowed
    if (currentStatus === 'CANCELLED') {
      return false;
    }

    return false;
  }

  async updateItemStatus(
    restaurantId: string,
    orderId: string,
    itemId: string,
    updateItemStatusDto: UpdateItemStatusDto,
  ): Promise<OrderItemResponseDto> {
    // Validate order and item exist and belong to restaurant
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Reject if order.status is not in ['CONFIRMED','IN_PROGRESS']
    if (order.status !== 'CONFIRMED' && order.status !== 'IN_PROGRESS') {
      throw new ConflictException(
        `Cannot update item status when order is in ${order.status} status. Order must be CONFIRMED or IN_PROGRESS.`,
      );
    }

    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Order item not found');
    }

    // Capture previousStatus before updating
    const previousStatus = item.status;

    // Validate status transition
    if (!this.isValidStatusTransition(item.status, updateItemStatusDto.status)) {
      throw new ConflictException(
        `Invalid status transition from ${item.status} to ${updateItemStatusDto.status}`,
      );
    }

    // Update item status and auto-update order status in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update item status
      const updatedItem = await tx.orderItem.update({
        where: { id: itemId },
        data: { status: updateItemStatusDto.status },
      });

      const previousOrderStatus = order.status;
      let orderStatusChanged = false;
      let newOrderStatus: OrderStatus | null = null;

      // Auto-update order status based on item status changes
      // si newStatus=IN_PROGRESS y order.status=CONFIRMED => order->IN_PROGRESS
      if (updateItemStatusDto.status === 'IN_PROGRESS' && order.status === 'CONFIRMED') {
        newOrderStatus = 'IN_PROGRESS';
        orderStatusChanged = true;
      } else if (updateItemStatusDto.status === 'READY' && order.status === 'IN_PROGRESS') {
        // si newStatus=READY y order.status=IN_PROGRESS y todos los items no CANCELLED están READY => order->READY
        const allItems = await tx.orderItem.findMany({
          where: {
            orderId,
            status: { not: 'CANCELLED' },
          },
        });

        const allReady = allItems.every((i) => i.status === 'READY');
        if (allReady) {
          newOrderStatus = 'READY';
          orderStatusChanged = true;
        }
      }

      // Update order status if needed
      if (orderStatusChanged && newOrderStatus) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: newOrderStatus },
        });
      }

      // Get updated order with items
      const updatedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      return {
        item: updatedItem,
        order: updatedOrder!,
        orderStatusChanged,
        newOrderStatus,
        previousOrderStatus,
      };
    });

    // Emit WebSocket events with complete payloads
    await this.eventsEmitter.emitOrderItemStatusChanged({
      orderId,
      itemId,
      restaurantId,
      previousStatus,
      newStatus: result.item.status,
      updatedAt: result.item.updatedAt,
    });

    if (result.orderStatusChanged && result.newOrderStatus) {
      await this.eventsEmitter.emitOrderStatusChanged({
        orderId,
        restaurantId,
        previousStatus: result.previousOrderStatus,
        newStatus: result.newOrderStatus,
        updatedAt: result.order.updatedAt,
      });
    }

    return this.mapOrderItemToResponse(result.item);
  }

  async close(restaurantId: string, orderId: string): Promise<OrderResponseDto> {
    // Validate order exists and belongs to restaurant
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        restaurantId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'READY') {
      throw new ConflictException('Order is not in READY status');
    }

    // Validate that all non-cancelled items are READY
    const activeItems = order.items.filter((item) => item.status !== 'CANCELLED');
    const allReady = activeItems.every((item) => item.status === 'READY');

    if (!allReady) {
      throw new BadRequestException('All items must be READY before closing order');
    }

    const previousStatus = order.status;

    // Close order in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const closedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
        include: {
          items: true,
        },
      });

      return closedOrder;
    });

    // Emit WebSocket event with complete payload
    await this.eventsEmitter.emitOrderStatusChanged({
      orderId: result.id,
      restaurantId: result.restaurantId,
      previousStatus,
      newStatus: result.status,
      updatedAt: result.updatedAt,
    });

    return this.mapOrderToResponse(result);
  }
}
