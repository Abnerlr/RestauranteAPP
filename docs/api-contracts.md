# API Contracts

## Overview
This document defines the API contracts for RestauranteApp.

## Base URL
- Development: `http://localhost:3001`
- Production: [To be defined]

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

The JWT token contains:
- `userId`: User identifier
- `role`: User role (ADMIN, WAITER, KITCHEN, CASHIER)
- `restaurantId`: Restaurant tenant identifier

### Endpoints

#### POST /api/v1/auth/login
Authenticate a user and receive a JWT token.

**Request Body:**
```typescript
{
  email: string;      // User email
  password: string;    // User password (min 6 characters)
}
```

**Response (200 OK):**
```typescript
{
  accessToken: string;  // JWT token
  user: {
    id: string;         // User ID
    name: string;       // User name
    role: string;       // User role (ADMIN, WAITER, KITCHEN, CASHIER)
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials or restaurant is not active

## Restaurants

### Endpoints

#### POST /api/v1/restaurants/bootstrap
Create a new restaurant and its first admin user. This endpoint is restricted:
- Only allowed if no restaurants exist in the system, OR
- Requires a valid `bootstrapSecret` in the request body

**Request Body:**
```typescript
{
  restaurantName: string;    // Restaurant name
  adminEmail: string;        // Admin user email
  adminPassword: string;     // Admin password (min 6 characters)
  adminName: string;         // Admin user name
  adminRole?: Role;          // Default: ADMIN
  bootstrapSecret?: string;  // Required if restaurants already exist
}
```

**Response (201 Created):**
```typescript
{
  restaurant: {
    id: string;    // Restaurant ID
    name: string;  // Restaurant name
  },
  admin: {
    id: string;    // Admin user ID
    email: string; // Admin email
    name: string;  // Admin name
    role: string;  // Admin role
  },
  message: string; // Success message
}
```

**Error Responses:**
- `403 Forbidden`: Bootstrap not allowed (restaurants exist and no valid secret)
- `409 Conflict`: Email already exists

## Orders

All order endpoints require authentication and automatically scope to the user's `restaurantId` from the JWT token.

### Endpoints

#### POST /api/v1/orders
Create a new order for a table session.

**Allowed Roles:** ADMIN, WAITER

**Request Body:**
```typescript
{
  tableSessionId: string;  // Table session ID
  notes?: string;          // Optional order notes
}
```

**Response (201 Created):**
```typescript
{
  id: string;
  restaurantId: string;
  tableSessionId: string;
  createdByUserId: string;
  status: "DRAFT";
  notes?: string;
  confirmedAt?: null;
  closedAt?: null;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  items: [];
}
```

**Error Responses:**
- `400 Bad Request`: Invalid table session ID or session is closed
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Table session not found or belongs to different restaurant

#### POST /api/v1/orders/:orderId/items
Add an item to an existing order.

**Allowed Roles:** ADMIN, WAITER

**Request Body:**
```typescript
{
  name: string;        // Item name
  qty: number;         // Quantity (min: 1)
  unitPrice?: number;   // Optional unit price
  notes?: string;       // Optional item notes
}
```

**Response (201 Created):**
```typescript
{
  id: string;
  orderId: string;
  name: string;
  qty: number;
  unitPrice?: string; // Decimal as string
  status: "PENDING";
  notes?: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data (qty < 1, etc.)
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Order not found or belongs to different restaurant
- `409 Conflict`: Order status is not DRAFT

#### PATCH /api/v1/orders/:orderId/items/:itemId
Update an order item (name, quantity, price, notes).

**Allowed Roles:** ADMIN, WAITER

**Request Body:**
```typescript
{
  name?: string;       // Optional new name
  qty?: number;        // Optional new quantity (min: 1)
  unitPrice?: number;  // Optional new unit price
  notes?: string;      // Optional new notes
}
```

**Response (200 OK):**
```typescript
{
  id: string;
  orderId: string;
  name: string;
  qty: number;
  unitPrice?: string; // Decimal as string
  status: OrderItemStatus;
  notes?: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Order or item not found
- `409 Conflict`: Item status is CANCELLED or order status is not DRAFT

#### DELETE /api/v1/orders/:orderId/items/:itemId
Soft cancel an order item (sets status to CANCELLED).

**Allowed Roles:** ADMIN, WAITER

**Response (200 OK):**
```typescript
{
  id: string;
  orderId: string;
  name: string;
  qty: number;
  unitPrice?: string;
  status: "CANCELLED";
  notes?: string;
  createdAt: string;
  updatedAt: string; // Updated timestamp
}
```

**Error Responses:**
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Order or item not found
- `409 Conflict`: Item already cancelled or order status is not DRAFT

#### POST /api/v1/orders/:orderId/confirm
Confirm an order (changes status from DRAFT to CONFIRMED).

**Allowed Roles:** ADMIN, WAITER

**Request Body:**
```typescript
{} // Empty body
```

**Response (200 OK):**
```typescript
{
  id: string;
  restaurantId: string;
  tableSessionId: string;
  createdByUserId: string;
  status: "CONFIRMED";
  notes?: string;
  confirmedAt: string; // ISO 8601 timestamp
  closedAt?: null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemResponseDto[];
}
```

**Error Responses:**
- `400 Bad Request`: Order has no items
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Order not found
- `409 Conflict`: Order status is not DRAFT

**Validations:**
- Order must have at least one item
- Order status must be DRAFT
- All items must have status PENDING (not CANCELLED)

#### GET /api/v1/orders/active
Get all active orders for the restaurant (status: DRAFT, CONFIRMED, IN_PROGRESS, READY).

**Allowed Roles:** ADMIN, WAITER, KITCHEN, CASHIER

**Query Parameters:**
- `status?`: Filter by status (DRAFT, CONFIRMED, IN_PROGRESS, READY)
- `tableSessionId?`: Filter by table session ID

**Response (200 OK):**
```typescript
OrderResponseDto[]
```

Example:
```typescript
[
  {
    id: string;
    restaurantId: string;
    tableSessionId: string;
    createdByUserId: string;
    status: OrderStatus;
    notes?: string;
    confirmedAt?: string;
    closedAt?: null;
    createdAt: string;
    updatedAt: string;
    items: OrderItemResponseDto[];
  }
]
```

**Error Responses:**
- `403 Forbidden`: Insufficient permissions

**Tenancy Rules:**
- Automatically filtered by `restaurantId` from JWT
- Only returns orders belonging to the user's restaurant

#### POST /api/v1/orders/:orderId/items/:itemId/status
Change the status of an order item.

**Allowed Roles:** ADMIN, KITCHEN

**Request Body:**
```typescript
{
  status: "PENDING" | "IN_PROGRESS" | "READY" | "CANCELLED";
}
```

**Response (200 OK):**
```typescript
{
  id: string;
  orderId: string;
  name: string;
  qty: number;
  unitPrice?: string;
  status: OrderItemStatus; // Updated status
  notes?: string;
  createdAt: string;
  updatedAt: string; // Updated timestamp
}
```

**Error Responses:**
- `400 Bad Request`: Invalid status transition
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Order or item not found
- `409 Conflict`: Invalid status transition

**Valid Status Transitions:**
- PENDING → IN_PROGRESS, CANCELLED
- IN_PROGRESS → READY, CANCELLED
- READY → (no transitions allowed in MVP)
- CANCELLED → (no transitions allowed)

**Auto Order Status Updates:**
- If all items are READY and order is IN_PROGRESS → order becomes READY
- If any item becomes IN_PROGRESS and order is CONFIRMED → order becomes IN_PROGRESS

#### POST /api/v1/orders/:orderId/close
Close an order (changes status to CLOSED).

**Allowed Roles:** ADMIN, CASHIER

**Request Body:**
```typescript
{} // Empty body
```

**Response (200 OK):**
```typescript
{
  id: string;
  restaurantId: string;
  tableSessionId: string;
  createdByUserId: string;
  status: "CLOSED";
  notes?: string;
  confirmedAt?: string;
  closedAt: string; // ISO 8601 timestamp
  createdAt: string;
  updatedAt: string;
  items: OrderItemResponseDto[];
}
```

**Error Responses:**
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Order not found
- `409 Conflict`: Order status is not READY or all items are not READY

**Validations:**
- Order status must be READY
- All items must have status READY (no PENDING, IN_PROGRESS, or CANCELLED items)

## Conversations

### Endpoints
[To be defined]

## Messages

### Endpoints
[To be defined]

## Agents

### Endpoints
[To be defined]

## WebSocket Events

### Client → Server
[To be defined]

### Server → Client

#### order.new
Emitted when an order is confirmed (POST /api/v1/orders/:orderId/confirm). This event is sent to the kitchen to notify that a new order is ready for preparation.

**Payload:**
```typescript
{
  orderId: string;
  restaurantId: string;
  tableSessionId: string;
  tableNumber?: number; // Optional table number for display
  status: OrderStatus; // Always CONFIRMED when this event is emitted
  items: OrderItemResponseDto[];
  createdAt: string; // ISO 8601 timestamp
}
```

#### order.status.changed
Emitted when an order status changes.

**Payload:**
```typescript
{
  orderId: string;
  restaurantId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  updatedAt: string; // ISO 8601 timestamp
}
```

#### order.item.status.changed
Emitted when an order item status changes.

**Payload:**
```typescript
{
  orderId: string;
  itemId: string;
  restaurantId: string;
  previousStatus: OrderItemStatus;
  newStatus: OrderItemStatus;
  updatedAt: string; // ISO 8601 timestamp
}
```

#### table.checkout.requested
Emitted when a table checkout is requested.

**Payload:**
```typescript
{
  tableId: string;
  restaurantId: string;
  sessionId: string;
  requestedBy: string; // User ID
  requestedAt: string; // ISO 8601 timestamp
}
```

#### payment.completed
Emitted when a payment is completed.

**Payload:**
```typescript
{
  paymentId: string;
  restaurantId: string;
  orderId: string;
  amount: number;
  method: string; // Payment method
  completedAt: string; // ISO 8601 timestamp
}
```

## Error Responses

### Standard Error Format
```typescript
{
  statusCode: number;
  message: string | string[];
  error?: string;
}
```

### Common Status Codes
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate email)
- `500 Internal Server Error`: Server error
