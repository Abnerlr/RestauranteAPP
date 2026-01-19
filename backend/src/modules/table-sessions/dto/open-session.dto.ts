import { IsNotEmpty, IsUUID } from 'class-validator';

export class OpenSessionDto {
  @IsUUID()
  @IsNotEmpty()
  tableId: string;
}
