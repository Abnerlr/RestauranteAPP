import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsEmitterService } from './services/events-emitter.service';
import { WebSocketModule } from '../../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebSocketModule],
  controllers: [OrdersController],
  providers: [OrdersService, EventsEmitterService],
  exports: [OrdersService],
})
export class OrdersModule {}
