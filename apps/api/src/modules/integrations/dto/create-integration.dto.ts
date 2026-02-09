import { IsNotEmpty, IsOptional, IsString, IsIn, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIntegrationDto {
  /** Integration display name */
  @ApiProperty({ example: 'My LinkedIn Integration' })
  @IsString()
  @IsNotEmpty()
  name: string;

  /** Provider identifier */
  @ApiProperty({ example: 'linkedin' })
  @IsString()
  @IsNotEmpty()
  provider: string;

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
  @ApiPropertyOptional({
    enum: ['active', 'inactive', 'error', 'expired'],
    default: 'inactive',
  })
  @IsOptional()
  @IsIn(['active', 'inactive', 'error', 'expired'])
  status?: 'active' | 'inactive' | 'error' | 'expired';
}
