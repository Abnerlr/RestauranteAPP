import { IsString, IsNotEmpty, IsEmail, MinLength, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class BootstrapDto {
  @IsString()
  @IsNotEmpty()
  restaurantName: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  adminEmail: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  adminPassword: string;

  @IsString()
  @IsNotEmpty()
  adminName: string;

  @IsEnum(Role)
  adminRole: Role = Role.ADMIN;

  @IsString()
  @IsNotEmpty()
  bootstrapSecret?: string;
}
