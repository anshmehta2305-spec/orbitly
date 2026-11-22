import { Module } from '@nestjs/common';
import { ShareLinksService } from './share-links.service';
import { ShareLinksController } from './share-links.controller';
import { AuditService } from '../../common/services/audit.service';

@Module({
  controllers: [ShareLinksController],
  providers: [ShareLinksService, AuditService],
  exports: [ShareLinksService],
})
export class ShareLinksModule {}
