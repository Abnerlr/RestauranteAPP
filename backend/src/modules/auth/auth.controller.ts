import { Controller, Post, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { DevLoginDto } from './dto/dev-login.dto';
import { DevLoginResponseDto } from './dto/dev-login-response.dto';
import { isDevLoginEnabled } from '../../config/env';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('dev-login')
  @HttpCode(HttpStatus.OK)
  async devLogin(@Body() devLoginDto: DevLoginDto): Promise<DevLoginResponseDto> {
    // Log that handler was hit
    console.log('[DEV-LOGIN] Handler hit', {
      role: devLoginDto.role,
      restaurantId: devLoginDto.restaurantId,
      userId: devLoginDto.userId || 'auto-generated',
    });

    // Check if dev-login is enabled (defense in depth)
    // Use ConfigService first, then fallback to process.env
    const configDevLoginEnabled = this.configService.get<string>('DEV_LOGIN_ENABLED');
    const processDevLoginEnabled = process.env.DEV_LOGIN_ENABLED;
    const devLoginEnabled = isDevLoginEnabled(configDevLoginEnabled ?? processDevLoginEnabled);
    
    if (!devLoginEnabled) {
      console.log('[DEV-LOGIN] Blocked: DEV_LOGIN_ENABLED is false', {
        processEnvDEV_LOGIN_ENABLED: processDevLoginEnabled,
        configDEV_LOGIN_ENABLED: configDevLoginEnabled,
        enabled: devLoginEnabled,
      });
      throw new NotFoundException();
    }

    const result = await this.authService.devLogin(devLoginDto);
    
    console.log('[DEV-LOGIN] Token generated successfully');
    
    return result;
  }
}
