import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ClearDemoFundsDto {
  @ApiProperty({ 
    description: 'Confirm clearing demo funds', 
    example: true,
    default: false 
  })
  @IsBoolean()
  confirm: boolean;
}
