import { Injectable, ConflictException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BootstrapDto } from './dto/bootstrap.dto';
import { BootstrapResponseDto } from './dto/bootstrap-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RestaurantsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async bootstrap(bootstrapDto: BootstrapDto): Promise<BootstrapResponseDto> {
    // Check if bootstrap is allowed
    const bootstrapSecret = this.configService.get<string>('BOOTSTRAP_SECRET');
    const hasSecret = bootstrapSecret && bootstrapDto.bootstrapSecret === bootstrapSecret;

    // Check if there are any restaurants (if no secret provided, only allow if no restaurants exist)
    const restaurantCount = await this.prisma.restaurant.count();
    const isFirstRestaurant = restaurantCount === 0;

    if (!hasSecret && !isFirstRestaurant) {
      throw new ForbiddenException(
        'Bootstrap is only allowed for the first restaurant or with a valid bootstrap secret',
      );
    }

    // Check if email already exists (across all restaurants for first restaurant, or within restaurant for subsequent)
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: bootstrapDto.adminEmail,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(bootstrapDto.adminPassword, saltRounds);

    // Create restaurant and admin in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: bootstrapDto.restaurantName,
          status: 'ACTIVE',
        },
      });

      // Create admin user
      const admin = await tx.user.create({
        data: {
          restaurantId: restaurant.id,
          name: bootstrapDto.adminName,
          email: bootstrapDto.adminEmail,
          passwordHash,
          role: bootstrapDto.adminRole || 'ADMIN',
          isActive: true,
        },
      });

      return { restaurant, admin };
    });

    return {
      restaurant: {
        id: result.restaurant.id,
        name: result.restaurant.name,
      },
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        name: result.admin.name,
        role: result.admin.role,
      },
      message: 'Restaurant and admin user created successfully',
    };
  }
}
