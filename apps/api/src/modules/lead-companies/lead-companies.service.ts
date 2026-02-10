import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql, ilike, or, desc, asc } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { DrizzleDB } from '../../database/database.provider';
import { leadCompanies } from '@app/db/schema/lead-companies';
import { CreateLeadCompanyDto } from './dto/create-lead-company.dto';
import { UpdateLeadCompanyDto } from './dto/update-lead-company.dto';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';

type LeadCompany = typeof leadCompanies.$inferSelect;

@Injectable()
export class LeadCompaniesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    companyId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<LeadCompany>> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search } = query;
    const offset = (page - 1) * limit;

    const conditions = [eq(leadCompanies.companyId, companyId)];

    if (search) {
      conditions.push(
        or(
          ilike(leadCompanies.name, `%${search}%`),
          ilike(leadCompanies.domain, `%${search}%`),
          ilike(leadCompanies.industry, `%${search}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(leadCompanies)
      .where(whereClause);

    const sortColumn = leadCompanies[sort as keyof typeof leadCompanies] ?? leadCompanies.createdAt;
    const orderFn = order === 'asc' ? asc : desc;

    const data = await this.db
      .select()
      .from(leadCompanies)
      .where(whereClause)
      .orderBy(orderFn(sortColumn as typeof leadCompanies.createdAt))
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

  async findOne(companyId: string, id: string): Promise<LeadCompany> {
    const [leadCompany] = await this.db
      .select()
      .from(leadCompanies)
      .where(and(eq(leadCompanies.id, id), eq(leadCompanies.companyId, companyId)))
      .limit(1);

    if (!leadCompany) {
      throw new NotFoundException(`Lead company with ID ${id} not found`);
    }

    return leadCompany;
  }

  async create(companyId: string, dto: CreateLeadCompanyDto): Promise<LeadCompany> {
    const [leadCompany] = await this.db
      .insert(leadCompanies)
      .values({
        companyId,
        name: dto.name,
        domain: dto.domain,
        website: dto.website,
        industry: dto.industry,
        size: dto.size,
        linkedinUrl: dto.linkedinUrl,
        location: dto.location,
        description: dto.description,
      })
      .returning();

    return leadCompany;
  }

  async update(companyId: string, id: string, dto: UpdateLeadCompanyDto): Promise<LeadCompany> {
    await this.findOne(companyId, id);

    const [updated] = await this.db
      .update(leadCompanies)
      .set({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.domain !== undefined && { domain: dto.domain }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.industry !== undefined && { industry: dto.industry }),
        ...(dto.size !== undefined && { size: dto.size }),
        ...(dto.linkedinUrl !== undefined && { linkedinUrl: dto.linkedinUrl }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.description !== undefined && { description: dto.description }),
      })
      .where(and(eq(leadCompanies.id, id), eq(leadCompanies.companyId, companyId)))
      .returning();

    return updated;
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.findOne(companyId, id);

    await this.db
      .delete(leadCompanies)
      .where(and(eq(leadCompanies.id, id), eq(leadCompanies.companyId, companyId)));
  }
}
