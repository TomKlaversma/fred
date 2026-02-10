import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    required: false,
    description: 'Additional message metadata (tokens, model, search params, etc.)'
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
