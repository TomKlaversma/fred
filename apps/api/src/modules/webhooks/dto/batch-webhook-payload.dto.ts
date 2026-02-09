import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { WebhookPayloadDto } from './webhook-payload.dto';

export class BatchWebhookPayloadDto {
  /** Array of webhook payloads */
  @ApiProperty({ type: [WebhookPayloadDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WebhookPayloadDto)
  items: WebhookPayloadDto[];
}
