import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DRIZZLE } from './database.constants';

import * as companiesSchema from '@app/db/schema/companies';
import * as usersSchema from '@app/db/schema/users';
import * as leadsSchema from '@app/db/schema/leads';
import * as leadCompaniesSchema from '@app/db/schema/lead-companies';
import * as integrationsSchema from '@app/db/schema/integrations';
import * as campaignsSchema from '@app/db/schema/campaigns';
import * as campaignLeadsSchema from '@app/db/schema/campaign-leads';
import * as messagesSchema from '@app/db/schema/messages';
import * as rawLeadsSchema from '@app/db/schema/raw-leads';

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
