import { Module } from '@nestjs/common';
import { LeadCompaniesController } from './lead-companies.controller';
import { LeadCompaniesService } from './lead-companies.service';

@Module({
  controllers: [LeadCompaniesController],
  providers: [LeadCompaniesService],
  exports: [LeadCompaniesService],
})
export class LeadCompaniesModule {}
