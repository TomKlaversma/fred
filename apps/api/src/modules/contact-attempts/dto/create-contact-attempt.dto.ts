import {
  IsString,
  IsOptional,
  IsIn,
  IsObject,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactAttemptDto {
  /** Contact method used */
  @ApiProperty({
    enum: ['email', 'linkedin', 'call', 'sms', 'other'],
    example: 'email',
  })
  @IsIn(['email', 'linkedin', 'call', 'sms', 'other'])
  method!: 'email' | 'linkedin' | 'call' | 'sms' | 'other';

  /** Contact direction */
  @ApiProperty({
    enum: ['outbound', 'inbound'],
    example: 'outbound',
  })
  @IsIn(['outbound', 'inbound'])
  direction!: 'outbound' | 'inbound';

  /** Subject line (for email) or title of the contact */
  @ApiPropertyOptional({ example: 'Introduction to our platform' })
  @IsOptional()
  @IsString()
  subject?: string;

  /** Body of the message or contact notes */
  @ApiPropertyOptional({ example: 'Hi [Name], I wanted to reach out...' })
  @IsOptional()
  @IsString()
  body?: string;

  /** Channel-specific metadata (message_id, thread_id, etc.) */
  @ApiPropertyOptional({
    type: 'object',
    example: { message_id: 'msg_123', thread_id: 'thread_456' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
