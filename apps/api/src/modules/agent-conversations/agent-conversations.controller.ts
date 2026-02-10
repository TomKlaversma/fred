import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AgentConversationsService } from './agent-conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import {
  ConversationDto,
  ConversationWithMessagesDto,
  PaginatedConversationsDto,
  MessageDto,
} from './dto/conversation-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Agent Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agent-conversations')
export class AgentConversationsController {
  constructor(private readonly service: AgentConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all conversations for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of conversations',
    type: PaginatedConversationsDto,
  })
  async findAll(
    @CurrentUser('sub') userId: string,
    @CompanyId() companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('isPublic') isPublic?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 25;
    const isPublicBool = isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;

    return this.service.findAll(userId, companyId, {
      page: pageNum,
      limit: limitNum,
      status,
      isPublic: isPublicBool,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully with initial welcome message',
    type: ConversationWithMessagesDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @CurrentUser('sub') userId: string,
    @CompanyId() companyId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.service.create(userId, companyId, dto);
  }

  @Get('public')
  @ApiOperation({ summary: 'List public conversations from the same company' })
  @ApiResponse({
    status: 200,
    description: 'List of public conversations',
    type: [ConversationDto],
  })
  async findPublic(
    @CurrentUser('sub') userId: string,
    @CompanyId() companyId: string,
  ) {
    return this.service.findPublic(companyId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a conversation with all messages' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Conversation with messages',
    type: ConversationWithMessagesDto,
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CompanyId() companyId: string,
  ) {
    return this.service.findOne(id, userId, companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a conversation' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Conversation updated successfully',
    type: ConversationWithMessagesDto,
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CompanyId() companyId: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.service.update(id, userId, companyId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a conversation (soft delete)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Conversation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CompanyId() companyId: string,
  ) {
    return this.service.remove(id, userId, companyId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Message created successfully',
    type: MessageDto,
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async sendMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CompanyId() companyId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.service.sendMessage(id, userId, companyId, dto);
  }

  @Post(':id/regenerate-title')
  @ApiOperation({ summary: 'Regenerate conversation title from messages' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Title regenerated successfully',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async regenerateTitle(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @CompanyId() companyId: string,
  ) {
    return this.service.regenerateTitle(id, userId, companyId);
  }
}
