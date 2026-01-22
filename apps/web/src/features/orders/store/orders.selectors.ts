import { OrderStatus, OrderItemStatus } from '@restaurante-app/contracts';
import { useOrdersStore } from './orders.store';

/**
 * Selector: Órdenes relevantes para cocina
 * Filtra órdenes que no estén cerradas o canceladas
 * y las ordena: primero las más nuevas o con items pendientes/cooking, READY al final
 */
export function useKitchenOrders() {
  const { entities, items, itemsByOrder, indexByStatus, getOrderWithItems } =
    useOrdersStore();

  // Obtener órdenes relevantes (no cerradas ni canceladas)
  const relevantStatuses: OrderStatus[] = [
    OrderStatus.CONFIRMED,
    OrderStatus.IN_PROGRESS,
    OrderStatus.READY,
  ];

  const allRelevantOrders = relevantStatuses.flatMap((status) => {
    const orderIds = indexByStatus[status] || [];
    return orderIds.map((id) => getOrderWithItems(id)).filter(Boolean);
  });

  // Separar en dos grupos: "En preparación" y "Listas"
  const inProgress: typeof allRelevantOrders = [];
  const ready: typeof allRelevantOrders = [];

  for (const order of allRelevantOrders) {
    if (!order) continue;

    // Si la orden está READY, va a "Listas"
    if (order.status === OrderStatus.READY) {
      ready.push(order);
      continue;
    }

    // Verificar si tiene items pendientes o en progreso
    const hasPendingOrInProgress = order.items.some(
      (item) =>
        item.status === OrderItemStatus.PENDING ||
        item.status === OrderItemStatus.IN_PROGRESS
    );

    if (hasPendingOrInProgress || order.status !== OrderStatus.READY) {
      inProgress.push(order);
    } else {
      ready.push(order);
    }
  }

  // Ordenar: más recientes primero (por createdAt o updatedAt)
  const sortByTime = (a: NonNullable<typeof allRelevantOrders[0]>, b: NonNullable<typeof allRelevantOrders[0]>) => {
    const timeA = new Date(a.updatedAt || a.createdAt).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt).getTime();
    return timeB - timeA;
  };

  inProgress.sort(sortByTime);
  ready.sort(sortByTime);

  return {
    inProgress,
    ready,
    all: [...inProgress, ...ready],
  };
}
