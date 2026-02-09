import { IsOptional, IsString, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyDto {
  /** Company display name */
  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  name?: string;

  /** URL-safe slug */
  @ApiPropertyOptional({ example: 'acme-corp' })
  @IsOptional()
  @IsString()
  slug?: string;

  /** Arbitrary settings JSON */
  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
