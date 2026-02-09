import { IsOptional, IsString, IsIn, IsObject, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCampaignDto {
  /** Campaign name */
  @ApiPropertyOptional({ example: 'Q1 Outreach' })
  @IsOptional()
  @IsString()
  name?: string;

  /** Campaign description */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /** Campaign status */
  @ApiPropertyOptional({ enum: ['draft', 'active', 'paused', 'completed'] })
  @IsOptional()
  @IsIn(['draft', 'active', 'paused', 'completed'])
  status?: 'draft' | 'active' | 'paused' | 'completed';

  /** Campaign settings */
  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  /** Campaign start date (ISO 8601) */
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  /** Campaign end date (ISO 8601) */
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}
