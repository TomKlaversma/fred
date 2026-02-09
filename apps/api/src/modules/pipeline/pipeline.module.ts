import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PipelineController } from './pipeline.controller';
import { PipelineService } from './pipeline.service';
import { TransformProcessor } from './processors/transform.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'data-transformation',
    }),
  ],
  controllers: [PipelineController],
  providers: [PipelineService, TransformProcessor],
  exports: [PipelineService],
})
export class PipelineModule {}
