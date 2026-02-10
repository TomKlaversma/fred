import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ required: false, description: 'Conversation title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false, default: false, description: 'Make conversation visible to other company members' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
