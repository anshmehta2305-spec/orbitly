import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiGatewayService } from './gateway/gateway.service';

@Module({
  controllers: [AiController],
  providers: [AiGatewayService, AiService],
  exports: [AiService, AiGatewayService],
})
export class AiModule {}
