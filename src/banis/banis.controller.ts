import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiError } from '../common/api-error';
import { int, parseDateTime } from '../common/input';
import { Limit100 } from '../common/throttle';
import { BanisService } from './banis.service';

@Controller('banis')
export class BanisController {
  constructor(private readonly banis: BanisService) {}

  @Get()
  @Limit100()
  all() {
    return this.banis.all();
  }

  @Get(':BaniID')
  @Limit100()
  async bani(
    @Param('BaniID') baniId: string,
    @Query('length') length: unknown,
    @Query('updatedsince') updatedsince: unknown,
  ) {
    const id = int(baniId);
    const bani = Number.isNaN(id)
      ? null
      : await this.banis.bani(id, length, updatedsince ? parseDateTime(updatedsince) : null);
    if (!bani)
      throw new ApiError('Bani does not exist or no updates found for specified Bani.', 404);
    return bani;
  }
}
