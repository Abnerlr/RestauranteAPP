export class BootstrapResponseDto {
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
