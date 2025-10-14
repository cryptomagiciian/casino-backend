import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class GameSearchQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string = '10';
}
