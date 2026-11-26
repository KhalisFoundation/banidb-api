import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { ShabadsController } from './shabads.controller';
import { VersesService } from './verses.service';

@Module({
  controllers: [ShabadsController],
  providers: [VersesService, SearchService],
  exports: [VersesService],
})
export class ShabadsModule {}
