import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql, ilike, or, desc, asc } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module';
import type { DrizzleDB } from '../../database/database.provider';
import { leads } from '@fred/db/schema/leads';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';

type Lead = typeof leads.$inferSelect;

@Injectable()
export class LeadsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    companyId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Lead>> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search } = query;
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

    const whereClause = and(...conditions);

    // Get total count
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(leads)
      .where(whereClause);

    // Get paginated results
    const sortColumn = leads[sort as keyof typeof leads] ?? leads.createdAt;
    const orderFn = order === 'asc' ? asc : desc;

    const data = await this.db
      .select()
      .from(leads)
      .where(whereClause)
      .orderBy(orderFn(sortColumn as typeof leads.createdAt))
      .limit(limit)
      .offset(offset);

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

  async findOne(companyId: string, id: string): Promise<Lead> {
    const [lead] = await this.db
      .select()
      .from(leads)
      .where(and(eq(leads.id, id), eq(leads.companyId, companyId)))
      .limit(1);

    if (!lead) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    return lead;
  }

  async create(companyId: string, dto: CreateLeadDto): Promise<Lead> {
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
      })
      .returning();

    return lead;
  }

  async update(companyId: string, id: string, dto: UpdateLeadDto): Promise<Lead> {
    // Verify lead belongs to this company
    await this.findOne(companyId, id);

    const [updated] = await this.db
      .update(leads)
      .set({
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle }),
        ...(dto.linkedinUrl !== undefined && { linkedinUrl: dto.linkedinUrl }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.source !== undefined && { source: dto.source }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.leadCompanyId !== undefined && { leadCompanyId: dto.leadCompanyId }),
      })
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
}
