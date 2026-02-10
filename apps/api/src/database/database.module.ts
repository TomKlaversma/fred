import { Global, Module } from '@nestjs/common';
import { DrizzleProvider } from './database.provider';
import { DRIZZLE } from './database.constants';

@Global()
@Module({
  providers: [DrizzleProvider],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
