import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiHeader,
} from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { BatchWebhookPayloadDto } from './dto/batch-webhook-payload.dto';

@ApiTags('Webhooks')
@ApiSecurity('api-key')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('raw-data')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiHeader({ name: 'X-API-Key', required: true, description: 'API key for webhook authentication' })
  @ApiOperation({ summary: 'Receive raw webhook data' })
  @ApiResponse({ status: 202, description: 'Data accepted for processing' })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  async receiveRawData(
    @Headers('x-api-key') apiKey: string,
    @Body() payload: WebhookPayloadDto,
  ) {
    const companyId = await this.webhooksService.validateApiKey(apiKey);

    if (!companyId) {
      throw new UnauthorizedException('Invalid API key');
    }

    return this.webhooksService.processRawData(companyId, payload);
  }

  @Post('raw-data/batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiHeader({ name: 'X-API-Key', required: true, description: 'API key for webhook authentication' })
  @ApiOperation({ summary: 'Receive batch raw webhook data' })
  @ApiResponse({ status: 202, description: 'Batch data accepted for processing' })
  @ApiResponse({ status: 401, description: 'Invalid API key' })
  async receiveRawDataBatch(
    @Headers('x-api-key') apiKey: string,
    @Body() payload: BatchWebhookPayloadDto,
  ) {
    const companyId = await this.webhooksService.validateApiKey(apiKey);

    if (!companyId) {
      throw new UnauthorizedException('Invalid API key');
    }

    return this.webhooksService.processRawDataBatch(companyId, payload);
  }
}
