import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { QueueService } from '../../common/services/queue.service';
import { EventsService } from '../../common/services/events.service';
import { ProviderRegistry } from '../../providers/registry';

@Module({
  controllers: [PostsController],
  providers: [PostsService, QueueService, EventsService, ProviderRegistry],
  exports: [PostsService, QueueService, EventsService],
})
export class PostsModule {}
