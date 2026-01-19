import { Module } from '@nestjs/common';
import { TableSessionsService } from './table-sessions.service';
import { TableSessionsController } from './table-sessions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TableSessionsController],
  providers: [TableSessionsService],
  exports: [TableSessionsService],
})
export class TableSessionsModule {}
