import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookPayloadDto {
  /** Entity type (e.g. "person", "company", "enrichment") */
  @ApiProperty({ example: 'person' })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  /** Workflow identifier for tracking */
  @ApiPropertyOptional({ example: 'linkedin-scrape-2025-01' })
  @IsOptional()
  @IsString()
  workflowId?: string;

  /** Raw data payload */
  @ApiProperty({ type: 'object', example: { name: 'Jane Doe', email: 'jane@example.com' } })
  @IsObject()
  @IsNotEmpty()
  data: Record<string, unknown>;

  /** Additional metadata */
  @ApiPropertyOptional({ type: 'object', example: { source: 'linkedin', scrapedAt: '2025-01-15' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
