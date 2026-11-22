import { Module } from '@nestjs/common';
import { PublicShareService } from './public-share.service';
import { PublicShareController } from './public-share.controller';
import { EventsService } from '../../common/services/events.service';

@Module({
  controllers: [PublicShareController],
  providers: [PublicShareService, EventsService],
  exports: [PublicShareService],
})
export class PublicShareModule {}
