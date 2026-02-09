import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql, ilike, desc, asc } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module';
import type { DrizzleDB } from '../../database/database.provider';
import { messages } from '@fred/db/schema/messages';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';

type Message = typeof messages.$inferSelect;

@Injectable()
export class MessagesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    companyId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Message>> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search } = query;
    const offset = (page - 1) * limit;

    const conditions = [eq(messages.companyId, companyId)];

    if (search) {
      conditions.push(ilike(messages.name, `%${search}%`));
    }

    const whereClause = and(...conditions);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(whereClause);

    const sortColumn = messages[sort as keyof typeof messages] ?? messages.createdAt;
    const orderFn = order === 'asc' ? asc : desc;

    const data = await this.db
      .select()
      .from(messages)
      .where(whereClause)
      .orderBy(orderFn(sortColumn as typeof messages.createdAt))
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

  async findOne(companyId: string, id: string): Promise<Message> {
    const [message] = await this.db
      .select()
      .from(messages)
      .where(and(eq(messages.id, id), eq(messages.companyId, companyId)))
      .limit(1);

    if (!message) {
      throw new NotFoundException(`Message template with ID ${id} not found`);
    }

    return message;
  }

  async create(companyId: string, dto: CreateMessageDto): Promise<Message> {
    const [message] = await this.db
      .insert(messages)
      .values({
        companyId,
        name: dto.name,
        channel: dto.channel,
        subject: dto.subject,
        body: dto.body,
        variables: dto.variables,
        settings: dto.settings ?? {},
      })
      .returning();

    return message;
  }

  async update(companyId: string, id: string, dto: UpdateMessageDto): Promise<Message> {
    await this.findOne(companyId, id);

    const [updated] = await this.db
      .update(messages)
      .set({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.channel !== undefined && { channel: dto.channel }),
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.variables !== undefined && { variables: dto.variables }),
        ...(dto.settings !== undefined && { settings: dto.settings }),
      })
      .where(and(eq(messages.id, id), eq(messages.companyId, companyId)))
      .returning();

    return updated;
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.findOne(companyId, id);

    await this.db
      .delete(messages)
      .where(and(eq(messages.id, id), eq(messages.companyId, companyId)));
  }
}
