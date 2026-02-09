import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';

@ApiTags('Companies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get the current company details' })
  @ApiResponse({ status: 200, description: 'Company details' })
  async getCurrent(@CompanyId() companyId: string) {
    return this.companiesService.findOne(companyId);
  }

  @Patch('current')
  @Roles('owner', 'admin')
  @ApiOperation({ summary: 'Update the current company' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  async updateCurrent(
    @CompanyId() companyId: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(companyId, updateCompanyDto);
  }
}
