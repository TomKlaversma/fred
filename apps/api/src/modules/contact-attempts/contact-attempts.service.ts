import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { DrizzleDB } from '../../database/database.provider';
import { contactAttempts } from '@app/db/schema/contact-attempts';
import { leads } from '@app/db/schema/leads';
import { users } from '@app/db/schema/users';
import { CreateContactAttemptDto } from './dto/create-contact-attempt.dto';
import { UpdateContactAttemptDto } from './dto/update-contact-attempt.dto';

type ContactAttempt = typeof contactAttempts.$inferSelect;
type ContactAttemptWithUser = ContactAttempt & {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
};

@Injectable()
export class ContactAttemptsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * Create a contact attempt and update lead summary fields.
   * This is a transactional operation to ensure data consistency.
   */
  async create(
    companyId: string,
    leadId: string,
    userId: string,
    dto: CreateContactAttemptDto,
  ): Promise<ContactAttempt> {
    // Verify lead exists and belongs to company
    const [lead] = await this.db
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.companyId, companyId)))
      .limit(1);

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    // Use transaction to ensure atomicity
    return await this.db.transaction(async (tx) => {
      // 1. Create the contact attempt
      const [contactAttempt] = await tx
        .insert(contactAttempts)
        .values({
          companyId,
          leadId,
          userId,
          method: dto.method,
          direction: dto.direction,
          subject: dto.subject,
          body: dto.body,
          metadata: dto.metadata ?? {},
        })
        .returning();

      // 2. Update lead summary fields
      const now = new Date();
      const newContactCount = (lead.contactCount ?? 0) + 1;

      await tx
        .update(leads)
        .set({
          lastContactedAt: now,
          lastContactMethod: dto.method,
          contactCount: newContactCount,
          // Auto-transition from enriched/new to contacted
          ...(lead.status === 'enriched' || lead.status === 'new'
            ? { status: 'contacted' as const }
            : {}),
        })
        .where(and(eq(leads.id, leadId), eq(leads.companyId, companyId)));

      return contactAttempt;
    });
  }

  /**
   * Get all contact attempts for a lead, with user information
   */
  async findAllForLead(
    companyId: string,
    leadId: string,
  ): Promise<ContactAttemptWithUser[]> {
    // Verify lead exists and belongs to company
    const [lead] = await this.db
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.companyId, companyId)))
      .limit(1);

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    // Get contact attempts with user info
    const attempts = await this.db
      .select({
        // Contact attempt fields
        id: contactAttempts.id,
        companyId: contactAttempts.companyId,
        leadId: contactAttempts.leadId,
        userId: contactAttempts.userId,
        method: contactAttempts.method,
        direction: contactAttempts.direction,
        subject: contactAttempts.subject,
        body: contactAttempts.body,
        responded: contactAttempts.responded,
        responseAt: contactAttempts.responseAt,
        metadata: contactAttempts.metadata,
        createdAt: contactAttempts.createdAt,
        // User fields
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(contactAttempts)
      .leftJoin(users, eq(contactAttempts.userId, users.id))
      .where(
        and(
          eq(contactAttempts.leadId, leadId),
          eq(contactAttempts.companyId, companyId),
        ),
      )
      .orderBy(desc(contactAttempts.createdAt));

    return attempts;
  }

  /**
   * Mark a contact attempt as responded
   */
  async markAsResponded(
    companyId: string,
    contactId: string,
    dto: UpdateContactAttemptDto,
  ): Promise<ContactAttempt> {
    // Verify contact attempt exists and belongs to company
    const [existing] = await this.db
      .select()
      .from(contactAttempts)
      .where(
        and(
          eq(contactAttempts.id, contactId),
          eq(contactAttempts.companyId, companyId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundException(
        `Contact attempt with ID ${contactId} not found`,
      );
    }

    // Use transaction to update both contact attempt and lead
    return await this.db.transaction(async (tx) => {
      // 1. Update the contact attempt
      const [updated] = await tx
        .update(contactAttempts)
        .set({
          responded: dto.responded ?? true,
          responseAt: dto.responseAt ? new Date(dto.responseAt) : new Date(),
        })
        .where(
          and(
            eq(contactAttempts.id, contactId),
            eq(contactAttempts.companyId, companyId),
          ),
        )
        .returning();

      // 2. Update lead's last response timestamp and status
      const responseDate = dto.responseAt
        ? new Date(dto.responseAt)
        : new Date();

      await tx
        .update(leads)
        .set({
          lastResponseAt: responseDate,
          // Auto-transition from contacted to conversing when response received
          status: 'conversing' as const,
        })
        .where(
          and(
            eq(leads.id, existing.leadId),
            eq(leads.companyId, companyId),
          ),
        );

      return updated;
    });
  }
}
