import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DRIZZLE } from './database.module';

import * as companiesSchema from '@fred/db/schema/companies';
import * as usersSchema from '@fred/db/schema/users';
import * as leadsSchema from '@fred/db/schema/leads';
import * as leadCompaniesSchema from '@fred/db/schema/lead-companies';
import * as integrationsSchema from '@fred/db/schema/integrations';
import * as campaignsSchema from '@fred/db/schema/campaigns';
import * as campaignLeadsSchema from '@fred/db/schema/campaign-leads';
import * as messagesSchema from '@fred/db/schema/messages';
import * as rawLeadsSchema from '@fred/db/schema/raw-leads';

export const schema = {
  ...companiesSchema,
  ...usersSchema,
  ...leadsSchema,
  ...leadCompaniesSchema,
  ...integrationsSchema,
  ...campaignsSchema,
  ...campaignLeadsSchema,
  ...messagesSchema,
  ...rawLeadsSchema,
};

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

export const DrizzleProvider: Provider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const connectionString = configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const pool = new Pool({ connectionString });

    return drizzle(pool, { schema });
  },
};
