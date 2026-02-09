import { IsOptional, IsString, IsIn, IsArray, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMessageDto {
  /** Template name */
  @ApiPropertyOptional({ example: 'Initial Outreach v2' })
  @IsOptional()
  @IsString()
  name?: string;

  /** Message channel */
  @ApiPropertyOptional({ enum: ['email', 'linkedin', 'sms'] })
  @IsOptional()
  @IsIn(['email', 'linkedin', 'sms'])
  channel?: 'email' | 'linkedin' | 'sms';

  /** Email subject */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  /** Message body */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  /** Template variables */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  /** Additional settings */
  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
