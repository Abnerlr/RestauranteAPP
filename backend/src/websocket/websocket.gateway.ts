import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../common/types/auth.types';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    // Authentication middleware
    server.use((socket: Socket, next) => {
      const token = this.extractToken(socket);

      if (!token) {
        return next(new Error('Unauthorized: No token provided'));
      }

      try {
        const secret = this.configService.get<string>('JWT_SECRET') || 'your-secret-key';
        const payload = this.jwtService.verify<JwtPayload>(token, { secret });

        // Set socket data
        socket.data.userId = payload.userId;
        socket.data.role = payload.role;
        socket.data.restaurantId = payload.restaurantId;

        // Join restaurant room for multi-tenancy
        const room = `restaurant:${payload.restaurantId}`;
        socket.join(room);

        this.logger.debug(
          `Socket authenticated: ${socket.id} (userId: ${payload.userId}, restaurantId: ${payload.restaurantId}, room: ${room})`,
        );

        next();
      } catch (error) {
        return next(new Error('Unauthorized: Invalid token'));
      }
    });
  }

  private extractToken(socket: Socket): string | null {
    // Try Authorization header first (with or without Bearer prefix)
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      // If no Bearer prefix, use the whole header value
      return authHeader;
    }

    // Fallback to handshake.auth.token
    if (socket.handshake.auth?.token) {
      return socket.handshake.auth.token;
    }

    return null;
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    const restaurantId = client.data.restaurantId;
    const userId = client.data.userId;

    this.logger.log(
      `Client connected: ${client.id} (userId: ${userId}, restaurantId: ${restaurantId})`,
    );
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const restaurantId = client.data.restaurantId;
    const userId = client.data.userId;

    this.logger.log(
      `Client disconnected: ${client.id} (userId: ${userId}, restaurantId: ${restaurantId})`,
    );
  }

  /**
   * Emit event to all clients in a restaurant room
   */
  emitToRestaurant(restaurantId: string, event: string, data: any): void {
    const room = `restaurant:${restaurantId}`;
    this.server.to(room).emit(event, data);
    this.logger.debug(`Emitted ${event} to room ${room}`);
  }
}
