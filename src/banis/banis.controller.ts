import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiError } from '../common/api-error';
import { int, parseDateTime } from '../common/input';
import { Limit100 } from '../common/throttle';
import { Docs, IdParam, ServerError, UpdatedSince } from '../docs/decorators';
import { ref } from '../docs/schemas';
import { BanisService } from './banis.service';

@ApiTags('Banis')
@ServerError()
@Controller('banis')
export class BanisController {
  constructor(private readonly banis: BanisService) {}

  @Get()
  @Limit100()
  @ApiOperation({ summary: 'All banis' })
  @ApiOkResponse({ schema: { type: 'array', items: ref('BaniSummary') } })
  all() {
    return this.banis.all();
  }

  @Get(':BaniID')
  @Limit100()
  @Docs('Bani', 'Bani', { 404: 'No such bani, or nothing changed since `updatedsince`.' })
  @IdParam('BaniID', 'A bani ID (/v2/banis).', 2)
  @ApiQuery({
    name: 'length',
    required: false,
    description:
      'Only the lines of one version: `s` SGPC, `m` medium, `t` Taksal, `b` Buddha Dal. Without it, each line says which versions have it.',
    schema: { type: 'string', enum: ['s', 'm', 't', 'b'] },
  })
  @UpdatedSince()
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
