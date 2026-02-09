import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql, ilike, or, desc, asc } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DRIZZLE } from '../../database/database.module';
import type { DrizzleDB } from '../../database/database.provider';
import { users } from '@fred/db/schema/users';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';

type User = typeof users.$inferSelect;

/** User response type (without passwordHash) */
type UserResponse = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(
    companyId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<UserResponse>> {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search } = query;
    const offset = (page - 1) * limit;

    const conditions = [eq(users.companyId, companyId)];

    if (search) {
      conditions.push(
        or(
          ilike(users.email, `%${search}%`),
          ilike(users.firstName, `%${search}%`),
          ilike(users.lastName, `%${search}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause);

    const sortColumn = users[sort as keyof typeof users] ?? users.createdAt;
    const orderFn = order === 'asc' ? asc : desc;

    const data = await this.db
      .select({
        id: users.id,
        companyId: users.companyId,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(orderFn(sortColumn as typeof users.createdAt))
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

  async findOne(companyId: string, id: string): Promise<UserResponse> {
    const [user] = await this.db
      .select({
        id: users.id,
        companyId: users.companyId,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(and(eq(users.id, id), eq(users.companyId, companyId)))
      .limit(1);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async create(companyId: string, dto: CreateUserDto): Promise<UserResponse> {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const [user] = await this.db
      .insert(users)
      .values({
        companyId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role ?? 'member',
      })
      .returning();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _hash, ...result } = user;
    return result;
  }

  async update(companyId: string, id: string, dto: UpdateUserDto): Promise<UserResponse> {
    await this.findOne(companyId, id);

    const updateData: Record<string, unknown> = {};

    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.role !== undefined) updateData.role = dto.role;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 12);
    }

    const [user] = await this.db
      .update(users)
      .set(updateData)
      .where(and(eq(users.id, id), eq(users.companyId, companyId)))
      .returning();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _hash, ...result } = user;
    return result;
  }

  async remove(companyId: string, id: string): Promise<void> {
    await this.findOne(companyId, id);

    await this.db
      .delete(users)
      .where(and(eq(users.id, id), eq(users.companyId, companyId)));
  }
}
