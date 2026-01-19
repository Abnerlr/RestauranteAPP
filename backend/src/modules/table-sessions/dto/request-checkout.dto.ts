import { IsNotEmpty, IsUUID } from 'class-validator';

export class RequestCheckoutDto {
  @IsUUID()
  @IsNotEmpty()
  sessionId: string;
}
