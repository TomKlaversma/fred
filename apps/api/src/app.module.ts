import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { UsersModule } from './modules/users/users.module';
import { LeadsModule } from './modules/leads/leads.module';
import { LeadCompaniesModule } from './modules/lead-companies/lead-companies.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { MessagesModule } from './modules/messages/messages.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { EventsModule } from './gateway/events.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    // Global config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Event emitter
    EventEmitterModule.forRoot(),

    // BullMQ for job queues
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),

    // Database
    DatabaseModule,

    // Feature modules
    AuthModule,
    CompaniesModule,
    UsersModule,
    LeadsModule,
    LeadCompaniesModule,
    CampaignsModule,
    MessagesModule,
    IntegrationsModule,
    WebhooksModule,
    PipelineModule,

    // WebSocket gateway
    EventsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
