// Authentication DTOs

/**
 * Login request DTO
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Login response DTO
 */
export interface LoginResponseDto {
  accessToken: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}
