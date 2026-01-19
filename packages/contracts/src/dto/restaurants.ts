// Restaurant DTOs

import { Role } from '../types';

/**
 * Bootstrap restaurant request DTO
 */
export interface BootstrapDto {
  restaurantName: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  adminRole?: Role;
  bootstrapSecret?: string;
}

/**
 * Bootstrap restaurant response DTO
 */
export interface BootstrapResponseDto {
  restaurant: {
    id: string;
    name: string;
  };
  admin: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  message: string;
}
