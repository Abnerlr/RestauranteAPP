import { Socket } from 'socket.io-client';
import {
  OrderNewEvent,
  OrderStatusChangedEvent,
  OrderItemStatusChangedEvent,
  WS_EVENTS,
} from '@restaurante-app/contracts';
import { useOrdersStore } from './orders.store';

/**
 * Vincula los eventos de WebSocket al store de órdenes
 * @param socket Instancia de Socket.IO
 * @returns Función de cleanup para desmontar los listeners
 */
export function bindOrderEvents(socket: Socket): () => void {
  const ordersStore = useOrdersStore.getState();

  // order.new
  const handleOrderNew = (payload: OrderNewEvent) => {
    console.debug('[OrdersWS] Received order.new:', payload.orderId);
    ordersStore.applyOrderNew(payload);
  };

  // order.status.changed
  const handleOrderStatusChanged = (payload: OrderStatusChangedEvent) => {
    console.debug('[OrdersWS] Received order.status.changed:', payload.orderId, payload.newStatus);
    ordersStore.applyOrderStatusChanged(payload);
  };

  // order.item.status.changed
  const handleItemStatusChanged = (payload: OrderItemStatusChangedEvent) => {
    console.debug('[OrdersWS] Received order.item.status.changed:', payload.itemId, payload.newStatus);
    ordersStore.applyItemStatusChanged(payload);
  };

  // Registrar listeners
  socket.on(WS_EVENTS.ORDER_NEW, handleOrderNew);
  socket.on(WS_EVENTS.ORDER_STATUS_CHANGED, handleOrderStatusChanged);
  socket.on(WS_EVENTS.ORDER_ITEM_STATUS_CHANGED, handleItemStatusChanged);

  // Retornar función de cleanup
  return () => {
    socket.off(WS_EVENTS.ORDER_NEW, handleOrderNew);
    socket.off(WS_EVENTS.ORDER_STATUS_CHANGED, handleOrderStatusChanged);
    socket.off(WS_EVENTS.ORDER_ITEM_STATUS_CHANGED, handleItemStatusChanged);
  };
}
