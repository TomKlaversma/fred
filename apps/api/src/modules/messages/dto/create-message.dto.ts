import { IsNotEmpty, IsOptional, IsString, IsIn, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageDto {
  /** Template name */
  @ApiProperty({ example: 'Initial Outreach' })
  @IsString()
  @IsNotEmpty()
  name: string;

  /** Message channel */
  @ApiProperty({ enum: ['email', 'linkedin', 'sms'] })
  @IsIn(['email', 'linkedin', 'sms'])
  channel: 'email' | 'linkedin' | 'sms';

  /** Email subject (for email channel) */
  @ApiPropertyOptional({ example: 'Quick question about {{companyName}}' })
  @IsOptional()
  @IsString()
  subject?: string;

  /** Message body */
  @ApiProperty({ example: 'Hi {{firstName}}, I wanted to reach out...' })
  @IsString()
  @IsNotEmpty()
  body: string;

  /** Template variables used in body/subject */
  @ApiPropertyOptional({
    type: [String],
    example: ['firstName', 'companyName'],
  })
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
