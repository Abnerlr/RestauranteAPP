import { Module } from '@nestjs/common';
import { RealtimeGateway  } from './websocket.gateway';

@Module({
  providers: [RealtimeGateway ],
})
export class WebSocketModule {}
