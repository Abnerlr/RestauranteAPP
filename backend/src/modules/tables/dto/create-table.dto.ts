import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateTableDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  number: number;

  @IsString()
  @IsOptional()
  area?: string;
}
