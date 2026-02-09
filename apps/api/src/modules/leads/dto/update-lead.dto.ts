import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  IsIn,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLeadDto {
  /** Lead email address */
  @ApiPropertyOptional({ example: 'jane@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  /** Lead first name */
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  firstName?: string;

  /** Lead last name */
  @ApiPropertyOptional({ example: 'Smith' })
  @IsOptional()
  @IsString()
  lastName?: string;

  /** Lead phone number */
  @ApiPropertyOptional({ example: '+1-555-0100' })
  @IsOptional()
  @IsString()
  phone?: string;

  /** Lead job title */
  @ApiPropertyOptional({ example: 'VP of Engineering' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  /** LinkedIn profile URL */
  @ApiPropertyOptional({ example: 'https://linkedin.com/in/janesmith' })
  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  /** Lead status */
  @ApiPropertyOptional({
    enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
  })
  @IsOptional()
  @IsIn(['new', 'contacted', 'qualified', 'converted', 'lost'])
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

  /** Lead source */
  @ApiPropertyOptional({ example: 'linkedin' })
  @IsOptional()
  @IsString()
  source?: string;

  /** Tags for categorization */
  @ApiPropertyOptional({ type: [String], example: ['enterprise', 'hot-lead'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  /** Notes about the lead */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  /** Lead score (0-100) */
  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  /** ID of the associated lead company */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  leadCompanyId?: string;
}
