import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.constants';
import type { DrizzleDB } from '../../database/database.provider';
import { companies } from '@app/db/schema/companies';
import { UpdateCompanyDto } from './dto/update-company.dto';

type Company = typeof companies.$inferSelect;

@Injectable()
export class CompaniesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findOne(companyId: string): Promise<Company> {
    const [company] = await this.db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    return company;
  }

  async update(companyId: string, dto: UpdateCompanyDto): Promise<Company> {
    await this.findOne(companyId);

    const [updated] = await this.db
      .update(companies)
      .set({
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.settings !== undefined && { settings: dto.settings }),
      })
      .where(eq(companies.id, companyId))
      .returning();

    return updated;
  }
}
