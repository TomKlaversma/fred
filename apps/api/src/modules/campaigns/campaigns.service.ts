import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql, ilike, desc, asc } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { DrizzleDB } from '../../database/database.provider';
import { campaigns } from '@app/db/schema/campaigns';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';

type Campaign = typeof campaigns.$inferSelect;

@Injectable()
export class CampaignsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    companyId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Campaign>> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search } = query;
    const offset = (page - 1) * limit;

    const conditions = [eq(campaigns.companyId, companyId)];

    if (search) {
      conditions.push(ilike(campaigns.name, `%${search}%`));
    }

    const whereClause = and(...conditions);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(campaigns)
      .where(whereClause);

    const sortColumn = campaigns[sort as keyof typeof campaigns] ?? campaigns.createdAt;
    const orderFn = order === 'asc' ? asc : desc;

    const data = await this.db
      .select()
      .from(campaigns)
      .where(whereClause)
      .orderBy(orderFn(sortColumn as typeof campaigns.createdAt))
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

  async findOne(companyId: string, id: string): Promise<Campaign> {
    const [campaign] = await this.db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.companyId, companyId)))
      .limit(1);

    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }

    return campaign;
  }

  async create(companyId: string, dto: CreateCampaignDto): Promise<Campaign> {
    const [campaign] = await this.db
      .insert(campaigns)
      .values({
        companyId,
        name: dto.name,
        description: dto.description,
        status: dto.status ?? 'draft',
        settings: dto.settings ?? {},
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      })
      .returning();

    return campaign;
  }

  async update(companyId: string, id: string, dto: UpdateCampaignDto): Promise<Campaign> {
    await this.findOne(companyId, id);

    const [updated] = await this.db
      .update(campaigns)
      .set({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.settings !== undefined && { settings: dto.settings }),
        ...(dto.startsAt !== undefined && { startsAt: new Date(dto.startsAt) }),
        ...(dto.endsAt !== undefined && { endsAt: new Date(dto.endsAt) }),
      })
      .where(and(eq(campaigns.id, id), eq(campaigns.companyId, companyId)))
      .returning();

    return updated;
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.findOne(companyId, id);

    await this.db
      .delete(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.companyId, companyId)));
  }
}
