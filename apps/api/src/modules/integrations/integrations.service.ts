import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql, ilike, or, desc, asc } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module';
import type { DrizzleDB } from '../../database/database.provider';
import { integrations } from '@fred/db/schema/integrations';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';

type Integration = typeof integrations.$inferSelect;

@Injectable()
export class IntegrationsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    companyId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Integration>> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search } = query;
    const offset = (page - 1) * limit;

    const conditions = [eq(integrations.companyId, companyId)];

    if (search) {
      conditions.push(
        or(
          ilike(integrations.name, `%${search}%`),
          ilike(integrations.provider, `%${search}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(integrations)
      .where(whereClause);

    const sortColumn = integrations[sort as keyof typeof integrations] ?? integrations.createdAt;
    const orderFn = order === 'asc' ? asc : desc;

    const data = await this.db
      .select()
      .from(integrations)
      .where(whereClause)
      .orderBy(orderFn(sortColumn as typeof integrations.createdAt))
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

  async findOne(companyId: string, id: string): Promise<Integration> {
    const [integration] = await this.db
      .select()
      .from(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.companyId, companyId)))
      .limit(1);

    if (!integration) {
      throw new NotFoundException(`Integration with ID ${id} not found`);
    }

    return integration;
  }

  async create(companyId: string, dto: CreateIntegrationDto): Promise<Integration> {
    const [integration] = await this.db
      .insert(integrations)
      .values({
        companyId,
        name: dto.name,
        provider: dto.provider,
        credentials: dto.credentials,
        metadata: dto.metadata ?? {},
        status: dto.status ?? 'inactive',
      })
      .returning();

    return integration;
  }

  async update(companyId: string, id: string, dto: UpdateIntegrationDto): Promise<Integration> {
    await this.findOne(companyId, id);

    const [updated] = await this.db
      .update(integrations)
      .set({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.provider !== undefined && { provider: dto.provider }),
        ...(dto.credentials !== undefined && { credentials: dto.credentials }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
        ...(dto.status !== undefined && { status: dto.status }),
      })
      .where(and(eq(integrations.id, id), eq(integrations.companyId, companyId)))
      .returning();

    return updated;
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.findOne(companyId, id);

    await this.db
      .delete(integrations)
      .where(and(eq(integrations.id, id), eq(integrations.companyId, companyId)));
  }
}
