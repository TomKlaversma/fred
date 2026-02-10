import { ApiProperty } from '@nestjs/swagger';

export class ConversationMetaDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  conversationId!: string;

  @ApiProperty()
  companyId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  isPublic!: boolean;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty()
  isFavorite!: boolean;

  @ApiProperty()
  messageCount!: number;

  @ApiProperty()
  lastActivityAt!: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ConversationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true })
  title!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: ConversationMetaDto })
  meta!: ConversationMetaDto;
}

export class MessageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  conversationId!: string;

  @ApiProperty({ enum: ['user', 'assistant', 'system'] })
  role!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ type: 'object', required: false })
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt!: Date;
}

export class ConversationWithMessagesDto extends ConversationDto {
  @ApiProperty({ type: [MessageDto] })
  messages!: MessageDto[];
}

export class PaginatedConversationsDto {
  @ApiProperty({ type: [ConversationDto] })
  data!: ConversationDto[];

  @ApiProperty({
    type: 'object',
    properties: {
      page: { type: 'number' },
      limit: { type: 'number' },
      total: { type: 'number' },
      totalPages: { type: 'number' },
    },
  })
  meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
