import { IsOptional, IsString, IsIn, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIntegrationDto {
  /** Integration display name */
  @ApiPropertyOptional({ example: 'My LinkedIn Integration' })
  @IsOptional()
  @IsString()
  name?: string;

  /** Provider identifier */
  @ApiPropertyOptional({ example: 'linkedin' })
  @IsOptional()
  @IsString()
  provider?: string;

  /** Encrypted credentials string */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  credentials?: string;

  /** Additional metadata */
  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  /** Integration status */
  @ApiPropertyOptional({ enum: ['active', 'inactive', 'error', 'expired'] })
  @IsOptional()
  @IsIn(['active', 'inactive', 'error', 'expired'])
  status?: 'active' | 'inactive' | 'error' | 'expired';
}
