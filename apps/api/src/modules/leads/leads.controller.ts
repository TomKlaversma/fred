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
  ApiQuery,
} from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
import { LeadResponseDto } from './dto/lead-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { UserId } from '../../common/decorators/user-id.decorator';

@ApiTags('Leads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List all leads (paginated with filters)' })
  @ApiResponse({ status: 200, description: 'Paginated list of leads with assigned user and contact summary', type: LeadResponseDto, isArray: true })
  @ApiQuery({ name: 'status', required: false, enum: ['new', 'enriched', 'contacted', 'conversing', 'qualified', 'converted', 'lost'] })
  @ApiQuery({ name: 'assigned_to_me', required: false, type: Boolean, description: 'Show only leads assigned to current user' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @CompanyId() companyId: string,
    @UserId() userId: string,
    @Query() query: LeadQueryDto,
  ) {
    return this.leadsService.findAll(companyId, userId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get lead statistics for the company' })
  @ApiResponse({ status: 200, description: 'Lead statistics' })
  async getStats(@CompanyId() companyId: string) {
    return this.leadsService.getStats(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lead by ID with assigned user and contact summary' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lead found', type: LeadResponseDto })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async findOne(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.leadsService.findOne(companyId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiResponse({ status: 201, description: 'Lead created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @CompanyId() companyId: string,
    @Body() createLeadDto: CreateLeadDto,
  ) {
    return this.leadsService.create(companyId, createLeadDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lead' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lead updated successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async update(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLeadDto: UpdateLeadDto,
  ) {
    return this.leadsService.update(companyId, id, updateLeadDto);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign a lead to a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Lead ID' })
  @ApiResponse({ status: 200, description: 'Lead assigned successfully' })
  @ApiResponse({ status: 400, description: 'User does not belong to this company' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async assignLead(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignLeadDto: AssignLeadDto,
  ) {
    return this.leadsService.assignLead(companyId, id, assignLeadDto.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lead' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Lead deleted successfully' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async remove(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.leadsService.remove(companyId, id);
  }
}
