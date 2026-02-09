import { IsNotEmpty, IsOptional, IsString, IsIn, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCampaignDto {
  /** Campaign name */
  @ApiProperty({ example: 'Q1 Outreach' })
  @IsString()
  @IsNotEmpty()
  name: string;

  /** Campaign description */
  @ApiPropertyOptional({ example: 'First quarter outbound campaign' })
  @IsOptional()
  @IsString()
  description?: string;

  /** Campaign status */
  @ApiPropertyOptional({
    enum: ['draft', 'active', 'paused', 'completed'],
    default: 'draft',
  })
  @IsOptional()
  @IsIn(['draft', 'active', 'paused', 'completed'])
  status?: 'draft' | 'active' | 'paused' | 'completed';

  /** Campaign settings */
  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  /** Campaign start date (ISO 8601) */
  @ApiPropertyOptional({ example: '2025-01-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  /** Campaign end date (ISO 8601) */
  @ApiPropertyOptional({ example: '2025-03-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
