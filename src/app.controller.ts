import { readFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { join } from 'node:path';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Limit100 } from './common/throttle';
import { Docs } from './docs/decorators';

// src/ and dist/ both sit next to package.json.
export const { version } = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
) as { version: string };

@ApiTags('API')
@Controller()
export class AppController {
  @Get()
  @Limit100()
  @Docs('Name and version of the API', 'Info')
  info() {
    return {
      name: 'BaniDB API',
      version,
      documentation: 'https://www.banidb.com',
      'terms-of-service': 'https://www.banidb.com/tos',
      'data-license': 'http://www.banidb.com/nposl',
      // Which instance answered (first letters of its hostname).
      endpoint: hostname().slice(0, 3),
    };
  }
}
