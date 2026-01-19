import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { TableResponseDto } from './dto/table-response.dto';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findAll(restaurantId: string): Promise<TableResponseDto[]> {
    const tables = await this.prisma.table.findMany({
      where: {
        restaurantId,
      },
      orderBy: {
        number: 'asc',
      },
      select: {
        id: true,
        number: true,
        area: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return tables;
  }

  async create(restaurantId: string, createTableDto: CreateTableDto): Promise<TableResponseDto> {
    // Check if table number already exists in this restaurant
    const existingTable = await this.prisma.table.findUnique({
      where: {
        restaurantId_number: {
          restaurantId,
          number: createTableDto.number,
        },
      },
    });

    if (existingTable) {
      throw new ConflictException(`Table number ${createTableDto.number} already exists`);
    }

    const table = await this.prisma.table.create({
      data: {
        restaurantId,
        number: createTableDto.number,
        area: createTableDto.area || null,
        status: 'AVAILABLE',
      },
      select: {
        id: true,
        number: true,
        area: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return table;
  }

  async findOneById(restaurantId: string, tableId: string) {
    const table = await this.prisma.table.findFirst({
      where: {
        id: tableId,
        restaurantId,
      },
    });

    if (!table) {
      throw new NotFoundException(`Table with ID ${tableId} not found`);
    }

    return table;
  }
}
