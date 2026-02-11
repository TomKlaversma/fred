import { IsOptional, IsIn, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class LeadQueryDto extends PaginationQueryDto {
  /** Filter by lead status */
  @ApiPropertyOptional({
    enum: ['new', 'enriched', 'contacted', 'conversing', 'qualified', 'converted', 'lost'],
    description: 'Filter leads by status',
    example: 'enriched',
  })
  @IsOptional()
  @IsIn(['new', 'enriched', 'contacted', 'conversing', 'qualified', 'converted', 'lost'])
  status?: 'new' | 'enriched' | 'contacted' | 'conversing' | 'qualified' | 'converted' | 'lost';

  /** Show only leads assigned to the current user */
  @ApiPropertyOptional({
    description: 'Filter to show only leads assigned to the current user',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  assigned_to_me?: boolean;
}
