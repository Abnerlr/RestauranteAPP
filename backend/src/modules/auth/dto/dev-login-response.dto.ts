import { Role } from '@prisma/client';

export class DevLoginResponseDto {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    role: Role;
    restaurantId: string;
  };
}
