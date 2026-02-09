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
import { LeadCompaniesService } from './lead-companies.service';
import { CreateLeadCompanyDto } from './dto/create-lead-company.dto';
import { UpdateLeadCompanyDto } from './dto/update-lead-company.dto';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyId } from '../../common/decorators/company-id.decorator';

@ApiTags('Lead Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lead-companies')
export class LeadCompaniesController {
  constructor(private readonly leadCompaniesService: LeadCompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'List all lead companies (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of lead companies' })
  async findAll(
    @CompanyId() companyId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.leadCompaniesService.findAll(companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a lead company by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lead company found' })
  @ApiResponse({ status: 404, description: 'Lead company not found' })
  async findOne(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.leadCompaniesService.findOne(companyId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lead company' })
  @ApiResponse({ status: 201, description: 'Lead company created successfully' })
  async create(
    @CompanyId() companyId: string,
    @Body() dto: CreateLeadCompanyDto,
  ) {
    return this.leadCompaniesService.create(companyId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a lead company' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Lead company updated successfully' })
  @ApiResponse({ status: 404, description: 'Lead company not found' })
  async update(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadCompanyDto,
  ) {
    return this.leadCompaniesService.update(companyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lead company' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Lead company deleted successfully' })
  @ApiResponse({ status: 404, description: 'Lead company not found' })
  async remove(
    @CompanyId() companyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.leadCompaniesService.remove(companyId, id);
  }
}
