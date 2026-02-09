import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PipelineService } from './pipeline.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';

@ApiTags('Pipeline')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pipeline')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get pipeline processing status' })
  @ApiResponse({ status: 200, description: 'Pipeline status' })
  async getStatus(@CompanyId() companyId: string) {
    return this.pipelineService.getStatus(companyId);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List recent pipeline jobs' })
  @ApiResponse({ status: 200, description: 'List of pipeline jobs' })
  async getJobs(@CompanyId() companyId: string) {
    return this.pipelineService.getJobs(companyId);
  }

  @Post('retry/:id')
  @Roles('owner', 'admin')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Retry a failed pipeline job' })
  @ApiParam({ name: 'id', type: 'string', description: 'Job ID to retry' })
  @ApiResponse({ status: 202, description: 'Job queued for retry' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async retryJob(
    @CompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.pipelineService.retryJob(companyId, id);
  }
}
