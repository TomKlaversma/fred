import { Global, Module } from '@nestjs/common';
import { DrizzleProvider } from './database.provider';

export const DRIZZLE = Symbol('DRIZZLE');

@Global()
@Module({
  providers: [DrizzleProvider],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
