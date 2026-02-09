import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLeadCompanyDto {
  /** Company name */
  @ApiPropertyOptional({ example: 'TechCorp Inc.' })
  @IsOptional()
  @IsString()
  name?: string;

  /** Company domain */
  @ApiPropertyOptional({ example: 'techcorp.com' })
  @IsOptional()
  @IsString()
  domain?: string;

  /** Company website URL */
  @ApiPropertyOptional({ example: 'https://techcorp.com' })
  @IsOptional()
  @IsUrl()
  website?: string;

  /** Industry */
  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  industry?: string;

  /** Company size */
  @ApiPropertyOptional({ example: '51-200' })
  @IsOptional()
  @IsString()
  size?: string;

  /** LinkedIn company URL */
  @ApiPropertyOptional({ example: 'https://linkedin.com/company/techcorp' })
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  /** Location */
  @ApiPropertyOptional({ example: 'San Francisco, CA' })
  @IsOptional()
  @IsString()
  location?: string;

  /** Company description */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
