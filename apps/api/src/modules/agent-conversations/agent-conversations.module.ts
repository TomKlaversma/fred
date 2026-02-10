import { Module } from '@nestjs/common';
import { AgentConversationsController } from './agent-conversations.controller';
import { AgentConversationsService } from './agent-conversations.service';

@Module({
  controllers: [AgentConversationsController],
  providers: [AgentConversationsService],
  exports: [AgentConversationsService],
})
export class AgentConversationsModule {}
