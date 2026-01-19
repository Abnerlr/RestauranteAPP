import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { TablesModule } from './modules/tables/tables.module';
import { TableSessionsModule } from './modules/table-sessions/table-sessions.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { WebSocketModule } from './websocket/websocket.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    RestaurantsModule,
    TablesModule,
    TableSessionsModule,
    OrdersModule,
    WebSocketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
