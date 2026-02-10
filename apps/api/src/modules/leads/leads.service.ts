import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, sql, ilike, or, desc, asc } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { DrizzleDB } from '../../database/database.provider';
import { leads } from '@app/db/schema/leads';
import { users } from '@app/db/schema/users';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

type Lead = typeof leads.$inferSelect;
type User = typeof users.$inferSelect;

export interface LeadWithRelations extends Lead {
  assignedTo?: User | null;
  contactSummary: {
    lastContactedAt: Date | null;
    lastContactMethod: string | null;
    contactCount: number;
    lastResponseAt: Date | null;
  };
}

@Injectable()
export class LeadsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    companyId: string,
    userId: string,
    query: LeadQueryDto,
  ): Promise<PaginatedResponse<LeadWithRelations>> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search, status, assigned_to_me } = query;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(leads.companyId, companyId)];

    if (search) {
      conditions.push(
        or(
          ilike(leads.email, `%${search}%`),
          ilike(leads.firstName, `%${search}%`),
          ilike(leads.lastName, `%${search}%`),
        )!,
      );
    }

    if (status) {
      conditions.push(eq(leads.status, status));
    }

    if (assigned_to_me === true) {
      conditions.push(eq(leads.assignedToUserId, userId));
    }

    const whereClause = and(...conditions);

    // Get total count
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(leads)
      .where(whereClause);

    // Get paginated results with assignedTo user relation
    const sortColumn = leads[sort as keyof typeof leads] ?? leads.createdAt;
    const orderFn = order === 'asc' ? asc : desc;

    const results = await this.db
      .select({
        lead: leads,
        assignedTo: users,
      })
      .from(leads)
      .leftJoin(users, eq(leads.assignedToUserId, users.id))
      .where(whereClause)
      .orderBy(orderFn(sortColumn as typeof leads.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform results to include contact summary
    const data: LeadWithRelations[] = results.map(({ lead, assignedTo }) => ({
      ...lead,
      assignedTo,
      contactSummary: {
        lastContactedAt: lead.lastContactedAt,
        lastContactMethod: lead.lastContactMethod,
        contactCount: lead.contactCount ?? 0,
        lastResponseAt: lead.lastResponseAt,
      },
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async findOne(companyId: string, id: string): Promise<LeadWithRelations> {
    const results = await this.db
      .select({
        lead: leads,
        assignedTo: users,
      })
      .from(leads)
      .leftJoin(users, eq(leads.assignedToUserId, users.id))
      .where(and(eq(leads.id, id), eq(leads.companyId, companyId)))
      .limit(1);

    if (!results.length) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    const { lead, assignedTo } = results[0];

    return {
      ...lead,
      assignedTo,
      contactSummary: {
        lastContactedAt: lead.lastContactedAt,
        lastContactMethod: lead.lastContactMethod,
        contactCount: lead.contactCount ?? 0,
        lastResponseAt: lead.lastResponseAt,
      },
    };
  }

  async create(companyId: string, dto: CreateLeadDto): Promise<Lead> {
    // Validate assignedToUserId belongs to the same company if provided
    if (dto.assignedToUserId) {
      await this.validateUserBelongsToCompany(companyId, dto.assignedToUserId);
    }

    const [lead] = await this.db
      .insert(leads)
      .values({
        companyId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        jobTitle: dto.jobTitle,
        linkedinUrl: dto.linkedinUrl,
        status: dto.status ?? 'new',
        source: dto.source,
        tags: dto.tags,
        notes: dto.notes,
        leadCompanyId: dto.leadCompanyId,
        assignedToUserId: dto.assignedToUserId,
        assignedAt: dto.assignedToUserId ? new Date() : null,
      })
      .returning();

    return lead;
  }

  async update(companyId: string, id: string, dto: UpdateLeadDto): Promise<Lead> {
    // Verify lead belongs to this company
    await this.findOne(companyId, id);

    // Validate assignedToUserId belongs to the same company if provided
    if (dto.assignedToUserId !== undefined) {
      if (dto.assignedToUserId !== null) {
        await this.validateUserBelongsToCompany(companyId, dto.assignedToUserId);
      }
    }

    const updateData: Record<string, any> = {};

    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.jobTitle !== undefined) updateData.jobTitle = dto.jobTitle;
    if (dto.linkedinUrl !== undefined) updateData.linkedinUrl = dto.linkedinUrl;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.source !== undefined) updateData.source = dto.source;
    if (dto.tags !== undefined) updateData.tags = dto.tags;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.leadCompanyId !== undefined) updateData.leadCompanyId = dto.leadCompanyId;

    // Handle assignment updates
    if (dto.assignedToUserId !== undefined) {
      updateData.assignedToUserId = dto.assignedToUserId;
      updateData.assignedAt = dto.assignedToUserId ? new Date() : null;
    }

    const [updated] = await this.db
      .update(leads)
      .set(updateData)
      .where(and(eq(leads.id, id), eq(leads.companyId, companyId)))
      .returning();

    return updated;
  }

  async remove(companyId: string, id: string): Promise<void> {
    // Verify lead belongs to this company
    await this.findOne(companyId, id);

    await this.db
      .delete(leads)
      .where(and(eq(leads.id, id), eq(leads.companyId, companyId)));
  }

  async getStats(companyId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
  }> {
    const [{ total }] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(leads)
      .where(eq(leads.companyId, companyId));

    const statusCounts = await this.db
      .select({
        status: leads.status,
        count: sql<number>`count(*)::int`,
      })
      .from(leads)
      .where(eq(leads.companyId, companyId))
      .groupBy(leads.status);

    const byStatus: Record<string, number> = {};
    for (const row of statusCounts) {
      byStatus[row.status] = row.count;
    }

    return { total, byStatus };
  }

  async assignLead(companyId: string, leadId: string, userId: string): Promise<Lead> {
    // Verify lead belongs to this company
    await this.findOne(companyId, leadId);

    // Validate user belongs to the same company
    await this.validateUserBelongsToCompany(companyId, userId);

    const [updated] = await this.db
      .update(leads)
      .set({
        assignedToUserId: userId,
        assignedAt: new Date(),
      })
      .where(and(eq(leads.id, leadId), eq(leads.companyId, companyId)))
      .returning();

    return updated;
  }

  private async validateUserBelongsToCompany(companyId: string, userId: string): Promise<void> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.companyId, companyId)))
      .limit(1);

    if (!user) {
      throw new BadRequestException(`User with ID ${userId} does not belong to this company or does not exist`);
    }
  }
}
