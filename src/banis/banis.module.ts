import { Module } from '@nestjs/common';
import { BanisController } from './banis.controller';
import { BanisService } from './banis.service';

@Module({
  controllers: [BanisController],
  providers: [BanisService],
  exports: [BanisService],
})
export class BanisModule {}
