import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Limit250 } from '../common/throttle';
import { DatabaseService } from '../database/database.service';
import { Docs, ServerError } from '../docs/decorators';

@ApiTags('API')
@ServerError()
@Controller()
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  // The database answers and has its first verse: { ok: true }.
  @Get('health')
  @Limit250()
  @Docs('Whether the API can read the database', 'Health')
  async check() {
    const [row] = await this.db.query<{ ok: unknown }>(
      'SELECT 1 as ok FROM Verse WHERE ID=1 LIMIT 1',
    );
    if (!row) throw new Error('Verse 1 is missing');
    return { ok: row.ok === 1 };
  }
}
