import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ref } from './schemas';

// Shorthands for the @Api… decorators the controllers share.

// A route: its summary, what it answers, and the errors it can give.
export const Docs = (
  summary: string,
  ok: string,
  errors: Record<number, string> = {},
  description?: string,
) =>
  applyDecorators(
    ApiOperation({ summary, description }),
    ApiOkResponse({ schema: ref(ok) }),
    ...Object.entries(errors).map(([status, why]) =>
      ApiResponse({ status: Number(status), description: why, schema: ref('Error') }),
    ),
  );

// Every route can fail on the database.
export const ServerError = () =>
  ApiResponse({ status: 500, description: 'The database failed.', schema: ref('Error') });

export const UpdatedSince = () =>
  ApiQuery({
    name: 'updatedsince',
    required: false,
    description:
      'Only what changed after this date (`YYYY-MM-DD` or `YYYY-MM-DD HH:MM:SS`); an invalid date is ignored.',
    schema: { type: 'string', example: '2024-01-01' },
  });

export const SOURCES = {
  G: 'Sri Guru Granth Sahib Ji',
  D: 'Sri Dasam Granth Sahib',
  B: 'Bhai Gurdas Ji Vaaran',
  A: 'Amrit Keertan',
  S: 'Bhai Gurdas Singh Ji Vaaran',
  N: 'Bhai Nand Lal Ji Vaaran',
  R: 'Rehatnamas & Panthic Sources',
};
const sourceList = Object.entries(SOURCES)
  .map(([id, name]) => `\`${id}\` ${name}`)
  .join(', ');

export const SourceParam = (extra = '') =>
  ApiParam({
    name: 'SourceID',
    description: `${sourceList}${extra}. Anything else is read as \`G\`.`,
    schema: { type: 'string', enum: [...Object.keys(SOURCES), 'all'], example: 'G' },
  });

export const IdParam = (name: string, description: string, example: number | string = 1) =>
  ApiParam({ name, description, schema: { type: 'string', example: String(example) } });
