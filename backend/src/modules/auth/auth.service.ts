import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { DevLoginDto } from './dto/dev-login.dto';
import { DevLoginResponseDto } from './dto/dev-login-response.dto';
import { JwtPayload } from '../../common/types/auth.types';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { isDevLoginEnabled } from '../../config/env';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    // Find user by email (we'll need to search across restaurants)
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        isActive: true,
      },
      include: {
        restaurant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if restaurant is active
    if (user.restaurant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Restaurant is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload: JwtPayload = {
      userId: user.id,
      role: user.role,
      restaurantId: user.restaurantId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    };
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        restaurant: true,
      },
    });

    if (!user || !user.isActive || user.restaurant.status !== 'ACTIVE') {
      return null;
    }

    return {
      userId: user.id,
      role: user.role,
      restaurantId: user.restaurantId,
    };
  }

  /**
   * Dev login endpoint - ONLY available when DEV_LOGIN_ENABLED=true
   * Generates a JWT token without validating against database
   */
  async devLogin(devLoginDto: DevLoginDto): Promise<DevLoginResponseDto> {
    // Check if dev-login is enabled
    // Use ConfigService first, then fallback to process.env
    const configDevLoginEnabled = this.configService.get<string>('DEV_LOGIN_ENABLED');
    const processDevLoginEnabled = process.env.DEV_LOGIN_ENABLED;
    
    if (!isDevLoginEnabled(configDevLoginEnabled ?? processDevLoginEnabled)) {
      throw new NotFoundException();
    }

    // Generate userId if not provided
    const userId = devLoginDto.userId || `dev-${devLoginDto.role.toLowerCase()}-${Date.now()}`;

    // Create JWT payload
    const payload: JwtPayload = {
      userId,
      role: devLoginDto.role,
      restaurantId: devLoginDto.restaurantId,
    };

    // Sign JWT token
    const accessToken = this.jwtService.sign(payload);

    // Get expiration time from config (default 7d)
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
    
    // Convert expiresIn string to seconds
    const expiresInSeconds = this.parseExpiresIn(expiresIn);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresInSeconds,
      user: {
        id: userId,
        role: devLoginDto.role,
        restaurantId: devLoginDto.restaurantId,
      },
    };
  }

  /**
   * Parse expiresIn string (e.g., "7d", "24h", "3600s") to seconds
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Default to 7 days if format is invalid
      return 7 * 24 * 60 * 60;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 7 * 24 * 60 * 60;
    }
  }
}
