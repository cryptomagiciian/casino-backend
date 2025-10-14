import { IsOptional, IsString, IsIn, IsDateString } from 'class-validator';

export class BetFiltersDto {
  @IsOptional()
  @IsString()
  game?: string;

  @IsOptional()
  @IsIn(['won', 'lost', 'pending'])
  status?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  limit?: string = '50';

  @IsOptional()
  @IsString()
  offset?: string = '0';
}
