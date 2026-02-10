import { IsBoolean, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateContactAttemptDto {
  /** Whether the lead responded to this contact attempt */
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  responded?: boolean;

  /** Timestamp when the lead responded */
  @ApiPropertyOptional({ example: '2024-01-15T10:30:00Z' })
  @IsOptional()
  @IsDateString()
  responseAt?: string;
}
