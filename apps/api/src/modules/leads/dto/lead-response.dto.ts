import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Contact summary information (read-only) */
export class ContactSummaryDto {
  @ApiPropertyOptional({
    description: 'Timestamp of last contact attempt',
    example: '2026-02-10T12:00:00Z',
  })
  lastContactedAt?: string;

  @ApiPropertyOptional({
    enum: ['email', 'linkedin', 'call', 'sms', 'other'],
    description: 'Method of last contact attempt',
    example: 'email',
  })
  lastContactMethod?: string;

  @ApiProperty({
    description: 'Total number of contact attempts',
    example: 3,
  })
  contactCount: number;

  @ApiPropertyOptional({
    description: 'Timestamp of last response from lead',
    example: '2026-02-10T14:30:00Z',
  })
  lastResponseAt?: string;
}

/** Assigned user information (nested) */
export class AssignedUserDto {
  @ApiProperty({ format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'John' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  lastName?: string;

  @ApiProperty({ enum: ['owner', 'admin', 'member'], example: 'member' })
  role: string;
}

/** Complete lead response with relations */
export class LeadResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  companyId: string;

  @ApiPropertyOptional({ format: 'uuid' })
  leadCompanyId?: string;

  @ApiPropertyOptional({ example: 'jane@example.com' })
  email?: string;

  @ApiPropertyOptional({ example: '+1-555-0100' })
  phone?: string;

  @ApiPropertyOptional({ example: 'Jane' })
  firstName?: string;

  @ApiPropertyOptional({ example: 'Smith' })
  lastName?: string;

  @ApiPropertyOptional({ example: 'VP of Engineering' })
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/janesmith' })
  linkedinUrl?: string;

  @ApiProperty({
    enum: ['new', 'enriched', 'contacted', 'conversing', 'qualified', 'converted', 'lost'],
    example: 'new',
  })
  status: string;

  @ApiPropertyOptional({ format: 'uuid' })
  assignedToUserId?: string;

  @ApiPropertyOptional({ example: '2026-02-10T12:00:00Z' })
  assignedAt?: string;

  @ApiPropertyOptional({ type: AssignedUserDto })
  assignedTo?: AssignedUserDto;

  @ApiProperty({ type: ContactSummaryDto })
  contactSummary: ContactSummaryDto;

  @ApiPropertyOptional({ example: 'linkedin' })
  source?: string;

  @ApiPropertyOptional({ example: 'apollo-enrichment' })
  sourceWorkflow?: string;

  @ApiPropertyOptional({ type: 'object' })
  enrichmentData?: Record<string, any>;

  @ApiPropertyOptional({ type: [String], example: ['enterprise', 'hot-lead'] })
  tags?: string[];

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 85 })
  score?: number;

  @ApiProperty({ example: '2026-02-10T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-02-10T12:00:00Z' })
  updatedAt: string;
}
