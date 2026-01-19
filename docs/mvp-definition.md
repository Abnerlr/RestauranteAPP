# MVP Definition

## Overview
This document defines the Minimum Viable Product (MVP) for RestauranteApp.

## Core Features

### Authentication & Multi-Tenancy
- User login with email and password
- JWT-based authentication with tenant isolation
- Role-based access control with four roles:
  - **ADMIN**: Restaurant owner/manager with full access
  - **WAITER**: Service staff for table and order management
  - **KITCHEN**: Kitchen staff for order preparation
  - **CASHIER**: Payment processing staff
- Automatic data isolation by `restaurant_id`
- Restaurant bootstrap endpoint for initial setup

### Restaurants
- Restaurant creation via bootstrap endpoint
- Restaurant status management (ACTIVE, INACTIVE, SUSPENDED)
- Multi-tenant architecture with row-level security
- Each restaurant operates in complete isolation

### Orders & Kitchen Flow

The MVP includes a streamlined order-to-kitchen flow that enables restaurant staff to create orders, send them to the kitchen, and track preparation status.

#### Order Creation & Management
- Create orders in DRAFT status for table sessions
- Add items to orders with name, quantity, optional unit price, and notes
- Update order items (name, quantity, price, notes) while order is in DRAFT or CONFIRMED
- Cancel individual items (soft cancel by setting status to CANCELLED)
- Confirm orders to send them to the kitchen (changes status DRAFT → CONFIRMED)

#### Kitchen Workflow
- Real-time order notifications via WebSocket when orders are confirmed (`order.new` event)
- Kitchen staff can view active orders (status: DRAFT, CONFIRMED, IN_PROGRESS, READY)
- Kitchen staff can update item status: PENDING → IN_PROGRESS → READY
- Automatic order status updates when items reach READY status:
  - When all items are READY and order is IN_PROGRESS → order becomes READY
  - When any item becomes IN_PROGRESS and order is CONFIRMED → order becomes IN_PROGRESS
- Real-time item status change notifications (`order.item.status.changed` event)
- Real-time order status change notifications (`order.status.changed` event)

#### Order Completion
- Cashier can close orders when status is READY and all items are READY
- Closing an order changes status READY → CLOSED
- Closed orders are no longer visible in active orders list

#### Roles & Permissions
- **ADMIN, WAITER**: Create orders, add/update items, confirm orders, close orders
- **KITCHEN**: View active orders, update item status (PENDING → IN_PROGRESS → READY)
- **CASHIER**: View active orders, close orders (when READY)

#### What's NOT in MVP
The following features are **explicitly excluded** from the MVP:
- **Menu/Catalog Management**: No menu items catalog. Items are added manually with name and price
- **Taxes & Discounts**: No tax calculation or discount management
- **Advanced Split Bill**: No bill splitting between multiple payment methods or customers
- **Real Payment Processing**: No integration with payment gateways or payment processing. Orders can be closed but payment tracking is out of scope

### Conversations
- Real-time chat conversations
- Conversation history
- Conversation assignment to agents

### Messages
- Send and receive messages in real-time
- Message status indicators
- Message history

### Agents
- Agent management
- Agent assignment to conversations
- Agent availability status

## Success Metrics
- [To be defined]

## Timeline
- [To be defined]
