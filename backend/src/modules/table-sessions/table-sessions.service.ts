import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenSessionDto } from './dto/open-session.dto';
import { RequestCheckoutDto } from './dto/request-checkout.dto';
import { CloseSessionDto } from './dto/close-session.dto';
import { SessionResponseDto } from './dto/session-response.dto';

@Injectable()
export class TableSessionsService {
  constructor(private prisma: PrismaService) {}

  async openSession(
    restaurantId: string,
    userId: string,
    openSessionDto: OpenSessionDto,
  ): Promise<SessionResponseDto> {
    // Verify table exists and belongs to restaurant
    const table = await this.prisma.table.findFirst({
      where: {
        id: openSessionDto.tableId,
        restaurantId,
      },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${openSessionDto.tableId} not found`);
    }

    // Create session and update table status in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Check if there's already an OPEN session for this table (inside transaction to avoid race conditions)
      const existingOpenSession = await tx.tableSession.findFirst({
        where: {
          tableId: openSessionDto.tableId,
          restaurantId,
          status: 'OPEN',
        },
      });

      if (existingOpenSession) {
        throw new ConflictException('Table already has an open session');
      }

      // Update table status to OCCUPIED if it was AVAILABLE
      let updatedTable = table;
      if (table.status === 'AVAILABLE') {
        updatedTable = await tx.table.update({
          where: { id: table.id },
          data: { status: 'OCCUPIED' },
        });
      }

      // Create session
      const session = await tx.tableSession.create({
        data: {
          restaurantId,
          tableId: openSessionDto.tableId,
          openedByUserId: userId,
          status: 'OPEN',
          openedAt: new Date(),
        },
      });

      // Return session with updated table state
      return {
        session,
        table: updatedTable,
      };
    });

    return {
      id: result.session.id,
      tableId: result.session.tableId,
      table: {
        id: result.table.id,
        number: result.table.number,
        area: result.table.area,
        status: result.table.status,
      },
      openedByUserId: result.session.openedByUserId,
      status: result.session.status,
      openedAt: result.session.openedAt,
      closedAt: result.session.closedAt,
      createdAt: result.session.createdAt,
      updatedAt: result.session.updatedAt,
    };
  }

  async requestCheckout(
    restaurantId: string,
    requestCheckoutDto: RequestCheckoutDto,
  ): Promise<SessionResponseDto> {
    // Find session and verify it belongs to restaurant
    const session = await this.prisma.tableSession.findFirst({
      where: {
        id: requestCheckoutDto.sessionId,
        restaurantId,
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${requestCheckoutDto.sessionId} not found`);
    }

    if (session.status !== 'OPEN') {
      throw new ConflictException('Session is not open');
    }

    // Update session and table status in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update session to CHECKOUT
      const updatedSession = await tx.tableSession.update({
        where: { id: session.id },
        data: { status: 'CHECKOUT' },
      });

      // Update table to CHECKOUT and get the updated result
      const updatedTable = await tx.table.update({
        where: { id: session.tableId },
        data: { status: 'CHECKOUT' },
      });

      return {
        session: updatedSession,
        table: updatedTable,
      };
    });

    return {
      id: result.session.id,
      tableId: result.session.tableId,
      table: {
        id: result.table.id,
        number: result.table.number,
        area: result.table.area,
        status: result.table.status,
      },
      openedByUserId: result.session.openedByUserId,
      status: result.session.status,
      openedAt: result.session.openedAt,
      closedAt: result.session.closedAt,
      createdAt: result.session.createdAt,
      updatedAt: result.session.updatedAt,
    };
  }

  async closeSession(
    restaurantId: string,
    closeSessionDto: CloseSessionDto,
  ): Promise<SessionResponseDto> {
    // Find session and verify it belongs to restaurant
    const session = await this.prisma.tableSession.findFirst({
      where: {
        id: closeSessionDto.sessionId,
        restaurantId,
      },
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${closeSessionDto.sessionId} not found`);
    }

    if (session.status === 'CLOSED') {
      throw new ConflictException('Session is already closed');
    }

    // Close session and update table status in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Update session to CLOSED
      const updatedSession = await tx.tableSession.update({
        where: { id: session.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
        },
      });

      // Update table to AVAILABLE and get the updated result
      const updatedTable = await tx.table.update({
        where: { id: session.tableId },
        data: { status: 'AVAILABLE' },
      });

      return {
        session: updatedSession,
        table: updatedTable,
      };
    });

    return {
      id: result.session.id,
      tableId: result.session.tableId,
      table: {
        id: result.table.id,
        number: result.table.number,
        area: result.table.area,
        status: result.table.status,
      },
      openedByUserId: result.session.openedByUserId,
      status: result.session.status,
      openedAt: result.session.openedAt,
      closedAt: result.session.closedAt,
      createdAt: result.session.createdAt,
      updatedAt: result.session.updatedAt,
    };
  }

  async findActiveSessions(restaurantId: string): Promise<SessionResponseDto[]> {
    const sessions = await this.prisma.tableSession.findMany({
      where: {
        restaurantId,
        status: {
          in: ['OPEN', 'CHECKOUT'],
        },
      },
      include: {
        table: true,
      },
      orderBy: {
        openedAt: 'desc',
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      tableId: session.tableId,
      table: {
        id: session.table.id,
        number: session.table.number,
        area: session.table.area,
        status: session.table.status,
      },
      openedByUserId: session.openedByUserId,
      status: session.status,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }));
  }
}
