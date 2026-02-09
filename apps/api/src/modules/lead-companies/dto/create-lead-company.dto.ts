import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadCompanyDto {
  /** Company name */
  @ApiProperty({ example: 'TechCorp Inc.' })
  @IsString()
  @IsNotEmpty()
  name: string;

  /** Company domain (e.g. "techcorp.com") */
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

  /** Company size (e.g. "51-200") */
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
