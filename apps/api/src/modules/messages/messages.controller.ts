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
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyId } from '../../common/decorators/company-id.decorator';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'List all message templates (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of message templates' })
  async findAll(
    @CompanyId() companyId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.messagesService.findAll(companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a message template by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Message template found' })
  @ApiResponse({ status: 404, description: 'Message template not found' })
  async findOne(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.messagesService.findOne(companyId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new message template' })
  @ApiResponse({ status: 201, description: 'Message template created successfully' })
  async create(
    @CompanyId() companyId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.create(companyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a message template' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Message template updated successfully' })
  @ApiResponse({ status: 404, description: 'Message template not found' })
  async update(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messagesService.update(companyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message template' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Message template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Message template not found' })
  async remove(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.messagesService.remove(companyId, id);
  }
}
