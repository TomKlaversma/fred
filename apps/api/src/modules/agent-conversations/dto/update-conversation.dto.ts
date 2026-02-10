import { IsString, IsOptional, IsBoolean, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConversationDto {
  @ApiProperty({ required: false, description: 'Conversation title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false, description: 'Make conversation visible to other company members' })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({
    required: false,
    enum: ['active', 'archived', 'deleted'],
    description: 'Conversation status'
  })
  @IsEnum(['active', 'archived', 'deleted'])
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false, description: 'Mark as favorite' })
  @IsBoolean()
  @IsOptional()
  isFavorite?: boolean;

  @ApiProperty({ required: false, type: [String], description: 'Conversation tags' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
