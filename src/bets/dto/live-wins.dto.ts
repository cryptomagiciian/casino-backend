import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class LiveWinsQueryDto {
  @IsOptional()
  @IsNumberString()
  limit?: string = '20';
}
