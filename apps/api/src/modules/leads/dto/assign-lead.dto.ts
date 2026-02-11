import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignLeadDto {
  /** User ID to assign the lead to */
  @ApiProperty({
    format: 'uuid',
    description: 'ID of the user to assign this lead to',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  userId: string;
}
