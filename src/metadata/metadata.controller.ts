import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { getRaagExtended } from '../banidb/mappers';
import { Limit100 } from '../common/throttle';
import { DatabaseService } from '../database/database.service';
import { Docs, ServerError } from '../docs/decorators';

// The writers, raags and sources, as their tables hold them.
@ApiTags('Writers, raags and sources')
@ServerError()
@Controller()
export class MetadataController {
  constructor(private readonly db: DatabaseService) {}

  @Get('writers')
  @Limit100()
  @Docs('Writers', 'Writers')
  async writers() {
    return { rows: await this.db.query('SELECT * FROM Writer ORDER BY WriterID') };
  }

  @Get('raags')
  @Limit100()
  @Docs('Raags', 'Raags')
  async raags() {
    const rows = await this.db.query('SELECT * FROM Raag ORDER BY RaagID');
    return { rows: rows.map(getRaagExtended) };
  }

  @Get('sources')
  @Limit100()
  @Docs('Sources', 'Sources')
  async sources() {
    return { rows: await this.db.query('SELECT * FROM Source ORDER BY SourceID') };
  }
}
