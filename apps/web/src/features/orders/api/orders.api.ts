import { OrderResponseDto, OrderItemStatus } from '@restaurante-app/contracts';
import { apiGet, apiPost } from '@/core/api/http';

/**
 * Obtiene las órdenes activas del restaurante
 * El restaurantId se extrae automáticamente del JWT en el backend
 */
export async function getActiveOrders(): Promise<OrderResponseDto[]> {
  return apiGet<OrderResponseDto[]>('/orders/active');
}

/**
 * Actualiza el estado de un item de orden
 * @param orderId ID de la orden
 * @param itemId ID del item
 * @param status Nuevo estado del item
 */
export async function updateOrderItemStatus(
  orderId: string,
  itemId: string,
  status: OrderItemStatus
): Promise<void> {
  return apiPost<void>(
    `/orders/${orderId}/items/${itemId}/status`,
    { status }
  );
}
