import { Module } from '@nestjs/common';
import { ContactAttemptsController } from './contact-attempts.controller';
import { ContactAttemptsService } from './contact-attempts.service';

@Module({
  controllers: [ContactAttemptsController],
  providers: [ContactAttemptsService],
  exports: [ContactAttemptsService],
})
export class ContactAttemptsModule {}
