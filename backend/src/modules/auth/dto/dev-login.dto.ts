import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class DevLoginDto {
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsString()
  @IsNotEmpty()
  restaurantId: string;

  @IsString()
  @IsOptional()
  userId?: string;
}
