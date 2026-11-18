import { Controller, Get } from '@nestjs/common';
import { getRaagExtended } from '../banidb/mappers';
import { Limit100 } from '../common/throttle';
import { DatabaseService } from '../database/database.service';

// The writers, raags and sources, as their tables hold them.
@Controller()
export class MetadataController {
  constructor(private readonly db: DatabaseService) {}

  @Get('writers')
  @Limit100()
  async writers() {
    return { rows: await this.db.query('SELECT * FROM Writer ORDER BY WriterID') };
  }

  @Get('raags')
  @Limit100()
  async raags() {
    const rows = await this.db.query('SELECT * FROM Raag ORDER BY RaagID');
    return { rows: rows.map(getRaagExtended) };
  }

  @Get('sources')
  @Limit100()
  async sources() {
    return { rows: await this.db.query('SELECT * FROM Source ORDER BY SourceID') };
  }
}
