import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
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
import { ContactAttemptsService } from './contact-attempts.service';
import { CreateContactAttemptDto } from './dto/create-contact-attempt.dto';
import { UpdateContactAttemptDto } from './dto/update-contact-attempt.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Contact Attempts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ContactAttemptsController {
  constructor(
    private readonly contactAttemptsService: ContactAttemptsService,
  ) {}

  @Post('leads/:leadId/contacts')
  @ApiOperation({
    summary: 'Log a contact attempt for a lead',
    description:
      'Creates a contact attempt record and updates lead summary fields (last_contacted_at, contact_count). Auto-transitions lead status from enriched/new to contacted.',
  })
  @ApiParam({ name: 'leadId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 201,
    description: 'Contact attempt logged successfully',
  })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async create(
    @CompanyId() companyId: string,
    @CurrentUser('sub') userId: string,
    @Param('leadId', ParseUUIDPipe) leadId: string,
    @Body() createDto: CreateContactAttemptDto,
  ) {
    return this.contactAttemptsService.create(
      companyId,
      leadId,
      userId,
      createDto,
    );
  }

  @Get('leads/:leadId/contacts')
  @ApiOperation({
    summary: 'Get contact history for a lead',
    description:
      'Returns all contact attempts for a lead, ordered by most recent first. Includes user information for each contact.',
  })
  @ApiParam({ name: 'leadId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Contact history retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async findAllForLead(
    @CompanyId() companyId: string,
    @Param('leadId', ParseUUIDPipe) leadId: string,
  ) {
    return this.contactAttemptsService.findAllForLead(companyId, leadId);
  }

  @Get('leads/:leadId/contacts/check-recent')
  @ApiOperation({
    summary: 'Check for recent contact attempts before new outreach',
    description:
      'Returns contact attempts within a specified time window (default 72 hours) to prevent duplicate outreach. Use this endpoint before creating a new contact attempt to show sales reps when the lead was last contacted and by whom.',
  })
  @ApiParam({ name: 'leadId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Recent contact attempts retrieved successfully',
  })
  async checkRecentContacts(
    @CompanyId() companyId: string,
    @Param('leadId', ParseUUIDPipe) leadId: string,
    @Query('method') method: string,
    @Query('withinHours', new ParseIntPipe({ optional: true }))
    withinHours?: number,
  ) {
    return this.contactAttemptsService.checkRecentContacts(
      companyId,
      leadId,
      method,
      withinHours,
    );
  }

  @Patch('contacts/:contactId/responded')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark a contact attempt as responded',
    description:
      'Updates the contact attempt with response information and auto-transitions lead status to conversing.',
  })
  @ApiParam({ name: 'contactId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Contact attempt marked as responded',
  })
  @ApiResponse({ status: 404, description: 'Contact attempt not found' })
  async markAsResponded(
    @CompanyId() companyId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Body() updateDto: UpdateContactAttemptDto,
  ) {
    return this.contactAttemptsService.markAsResponded(
      companyId,
      contactId,
      updateDto,
    );
  }
}
