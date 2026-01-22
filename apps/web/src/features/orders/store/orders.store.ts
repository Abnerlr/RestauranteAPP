'use client';

import { create } from 'zustand';
import {
  OrderResponseDto,
  OrderStatus,
  OrderItemStatus,
  OrderNewEvent,
  OrderStatusChangedEvent,
  OrderItemStatusChangedEvent,
  WS_EVENTS,
} from '@restaurante-app/contracts';

// Tipo para Order normalizado (sin items anidados)
interface NormalizedOrder {
  id: string;
  restaurantId: string;
  tableSessionId: string;
  createdByUserId: string;
  status: OrderStatus;
  notes?: string;
  confirmedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Tipo para OrderItem normalizado
interface NormalizedOrderItem {
  id: string;
  orderId: string;
  name: string;
  qty: number;
  unitPrice?: string;
  status: OrderItemStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrdersState {
  // Entidades normalizadas
  entities: Record<string, NormalizedOrder>;
  items: Record<string, NormalizedOrderItem>;
  
  // Índices
  itemsByOrder: Record<string, string[]>; // orderId -> itemIds[]
  indexByStatus: Record<OrderStatus, string[]>; // status -> orderIds[]
  
  // Dedupe: IDs de eventos ya procesados
  seenEventIds: Record<string, true>;
  
  // Acciones
  hydrateSnapshot: (orders: OrderResponseDto[]) => void;
  applyOrderNew: (payload: OrderNewEvent) => void;
  applyItemStatusChanged: (payload: OrderItemStatusChangedEvent) => void;
  applyOrderStatusChanged: (payload: OrderStatusChangedEvent) => void;
  
  // Optimistic update para item status
  setItemStatusOptimistic: (orderId: string, itemId: string, newStatus: OrderItemStatus) => {
    previousStatus: OrderItemStatus;
    rollback: () => void;
  };
  
  // Helpers
  getOrder: (orderId: string) => NormalizedOrder | undefined;
  getOrderWithItems: (orderId: string) => (NormalizedOrder & { items: NormalizedOrderItem[] }) | undefined;
  getOrdersByStatus: (status: OrderStatus) => NormalizedOrder[];
  getAllOrderIds: () => string[];
}

/**
 * Genera un ID determinístico para un evento (para dedupe)
 */
function generateEventId(
  eventName: string,
  payload: OrderNewEvent | OrderStatusChangedEvent | OrderItemStatusChangedEvent
): string {
  if ('eventId' in payload && payload.eventId) {
    return payload.eventId as string;
  }

  // Generar ID determinístico basado en el tipo de evento
  if (eventName === WS_EVENTS.ORDER_NEW) {
    const p = payload as OrderNewEvent;
    return `${eventName}:${p.orderId}:${p.createdAt}`;
  } else if (eventName === WS_EVENTS.ORDER_STATUS_CHANGED) {
    const p = payload as OrderStatusChangedEvent;
    return `${eventName}:${p.orderId}:${p.newStatus}:${p.updatedAt}`;
  } else if (eventName === WS_EVENTS.ORDER_ITEM_STATUS_CHANGED) {
    const p = payload as OrderItemStatusChangedEvent;
    return `${eventName}:${p.orderId}:${p.itemId}:${p.newStatus}:${p.updatedAt}`;
  }

  // Fallback
  return `${eventName}:${Date.now()}:${Math.random()}`;
}

/**
 * Remueve un orderId de un índice de status
 */
function removeFromStatusIndex(
  index: Record<OrderStatus, string[]>,
  status: OrderStatus,
  orderId: string
): void {
  const arr = index[status];
  const idx = arr.indexOf(orderId);
  if (idx > -1) {
    arr.splice(idx, 1);
  }
}

/**
 * Agrega un orderId a un índice de status (sin duplicados)
 */
function addToStatusIndex(
  index: Record<OrderStatus, string[]>,
  status: OrderStatus,
  orderId: string
): void {
  const arr = index[status];
  if (!arr.includes(orderId)) {
    arr.push(orderId);
  }
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  entities: {},
  items: {},
  itemsByOrder: {},
  indexByStatus: {
    [OrderStatus.DRAFT]: [],
    [OrderStatus.CONFIRMED]: [],
    [OrderStatus.IN_PROGRESS]: [],
    [OrderStatus.READY]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.CLOSED]: [],
  },
  seenEventIds: {},

  hydrateSnapshot: (orders: OrderResponseDto[]) => {
    const entities: Record<string, NormalizedOrder> = {};
    const items: Record<string, NormalizedOrderItem> = {};
    const itemsByOrder: Record<string, string[]> = {};
    const indexByStatus: Record<OrderStatus, string[]> = {
      [OrderStatus.DRAFT]: [],
      [OrderStatus.CONFIRMED]: [],
      [OrderStatus.IN_PROGRESS]: [],
      [OrderStatus.READY]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.CLOSED]: [],
    };

    // Normalizar órdenes
    for (const order of orders) {
      // Extraer items
      const itemIds: string[] = [];
      for (const item of order.items) {
        items[item.id] = {
          id: item.id,
          orderId: item.orderId,
          name: item.name,
          qty: item.qty,
          unitPrice: item.unitPrice,
          status: item.status,
          notes: item.notes,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
        itemIds.push(item.id);
      }

      // Crear entidad normalizada
      entities[order.id] = {
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
      };

      itemsByOrder[order.id] = itemIds;
      addToStatusIndex(indexByStatus, order.status, order.id);
    }

    set({ entities, items, itemsByOrder, indexByStatus });
  },

  applyOrderNew: (payload: OrderNewEvent) => {
    const eventId = generateEventId(WS_EVENTS.ORDER_NEW, payload);
    const state = get();

    // Dedupe: verificar si ya procesamos este evento
    if (state.seenEventIds[eventId]) {
      console.debug('[OrdersStore] Duplicate event ignored:', eventId);
      return;
    }

    // Verificar si la orden ya existe (por version/updatedAt)
    const existing = state.entities[payload.orderId];
    if (existing) {
      const existingTime = new Date(existing.createdAt).getTime();
      const payloadTime = new Date(payload.createdAt).getTime();
      if (payloadTime <= existingTime) {
        console.debug('[OrdersStore] Stale event ignored:', eventId);
        return;
      }
    }

    // Normalizar items
    const itemIds: string[] = [];
    const items: Record<string, NormalizedOrderItem> = { ...state.items };
    for (const item of payload.items) {
      items[item.id] = {
        id: item.id,
        orderId: item.orderId,
        name: item.name,
        qty: item.qty,
        unitPrice: item.unitPrice,
        status: item.status,
        notes: item.notes,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
      itemIds.push(item.id);
    }

    // Crear/actualizar orden
    const entities = { ...state.entities };
    const indexByStatus = { ...state.indexByStatus };
    const itemsByOrder = { ...state.itemsByOrder };

    // Si ya existe, remover del índice anterior
    if (existing) {
      removeFromStatusIndex(indexByStatus, existing.status, existing.id);
    }

    entities[payload.orderId] = {
      id: payload.orderId,
      restaurantId: payload.restaurantId,
      tableSessionId: payload.tableSessionId,
      createdByUserId: '', // No viene en el evento
      status: payload.status,
      notes: undefined,
      confirmedAt: payload.status === OrderStatus.CONFIRMED ? payload.createdAt : undefined,
      closedAt: undefined,
      createdAt: payload.createdAt,
      updatedAt: payload.createdAt,
    };

    itemsByOrder[payload.orderId] = itemIds;
    addToStatusIndex(indexByStatus, payload.status, payload.orderId);

    set({
      entities,
      items,
      itemsByOrder,
      indexByStatus,
      seenEventIds: { ...state.seenEventIds, [eventId]: true },
    });
  },

  applyItemStatusChanged: (payload: OrderItemStatusChangedEvent) => {
    const eventId = generateEventId('order.item.status.changed', payload);
    const state = get();

    // Dedupe
    if (state.seenEventIds[eventId]) {
      console.debug('[OrdersStore] Duplicate event ignored:', eventId);
      return;
    }

    // Verificar que el item existe
    const item = state.items[payload.itemId];
    if (!item) {
      console.warn('[OrdersStore] Item not found for status change:', payload.itemId);
      return;
    }

    // Verificar versión (updatedAt)
    const itemTime = new Date(item.updatedAt).getTime();
    const payloadTime = new Date(payload.updatedAt).getTime();
    if (payloadTime < itemTime) {
      console.debug('[OrdersStore] Stale item status change ignored:', eventId);
      return;
    }

    // Actualizar item
    const items = { ...state.items };
    items[payload.itemId] = {
      ...item,
      status: payload.newStatus,
      updatedAt: payload.updatedAt,
    };

    set({
      items,
      seenEventIds: { ...state.seenEventIds, [eventId]: true },
    });
  },

  applyOrderStatusChanged: (payload: OrderStatusChangedEvent) => {
    const eventId = generateEventId(WS_EVENTS.ORDER_STATUS_CHANGED, payload);
    const state = get();

    // Dedupe
    if (state.seenEventIds[eventId]) {
      console.debug('[OrdersStore] Duplicate event ignored:', eventId);
      return;
    }

    // Verificar que la orden existe
    const order = state.entities[payload.orderId];
    if (!order) {
      console.warn('[OrdersStore] Order not found for status change:', payload.orderId);
      return;
    }

    // Verificar versión (updatedAt)
    const orderTime = new Date(order.updatedAt).getTime();
    const payloadTime = new Date(payload.updatedAt).getTime();
    if (payloadTime < orderTime) {
      console.debug('[OrdersStore] Stale order status change ignored:', eventId);
      return;
    }

    // Actualizar orden y índices
    const entities = { ...state.entities };
    const indexByStatus = { ...state.indexByStatus };

    // Remover del índice anterior
    removeFromStatusIndex(indexByStatus, order.status, order.id);

    // Actualizar entidad
    entities[payload.orderId] = {
      ...order,
      status: payload.newStatus,
      updatedAt: payload.updatedAt,
      confirmedAt: payload.newStatus === OrderStatus.CONFIRMED ? payload.updatedAt : order.confirmedAt,
      closedAt: payload.newStatus === OrderStatus.CLOSED ? payload.updatedAt : order.closedAt,
    };

    // Agregar al nuevo índice
    addToStatusIndex(indexByStatus, payload.newStatus, payload.orderId);

    set({
      entities,
      indexByStatus,
      seenEventIds: { ...state.seenEventIds, [eventId]: true },
    });
  },

  // Helpers
  getOrder: (orderId: string) => {
    return get().entities[orderId];
  },

  getOrderWithItems: (orderId: string) => {
    const state = get();
    const order = state.entities[orderId];
    if (!order) return undefined;

    const itemIds = state.itemsByOrder[orderId] || [];
    const items = itemIds.map((id) => state.items[id]).filter(Boolean) as NormalizedOrderItem[];

    return { ...order, items };
  },

  getOrdersByStatus: (status: OrderStatus) => {
    const state = get();
    const orderIds = state.indexByStatus[status] || [];
    return orderIds.map((id) => state.entities[id]).filter(Boolean) as NormalizedOrder[];
  },

  getAllOrderIds: () => {
    return Object.keys(get().entities);
  },

  setItemStatusOptimistic: (orderId: string, itemId: string, newStatus: OrderItemStatus) => {
    const state = get();
    const item = state.items[itemId];
    
    if (!item || item.orderId !== orderId) {
      throw new Error(`Item ${itemId} not found in order ${orderId}`);
    }

    const previousStatus = item.status;

    // Aplicar cambio optimista
    const items = { ...state.items };
    items[itemId] = {
      ...item,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    set({ items });

    // Retornar función de rollback
    return {
      previousStatus,
      rollback: () => {
        const currentState = get();
        const currentItems = { ...currentState.items };
        currentItems[itemId] = {
          ...currentItems[itemId],
          status: previousStatus,
        };
        set({ items: currentItems });
      },
    };
  },
}));
