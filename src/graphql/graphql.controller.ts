import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyDecorators, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import { BanisService } from '../banis/banis.service';
import { parseDateTime } from '../common/input';
import { Limit100 } from '../common/throttle';
import { ref } from '../docs/schemas';
import { VersesService } from '../shabads/verses.service';

// GraphQL over the same data as the REST routes: shabad(s), ang(s), banis.
// GET also serves GraphiQL to a browser.
const schema = buildSchema(readFileSync(join(__dirname, 'schema.graphql'), 'utf8'));

interface Args {
  id: string;
  sinceDate?: string;
  sourceId?: string;
  length?: string;
}

const since = (sinceDate?: string) => (sinceDate ? parseDateTime(sinceDate) : null);

// An empty query is "Must provide query string." (400), as before, rather than
// a syntax error.
function withoutEmptyQuery(req: Request) {
  const body = req.body as { query?: unknown } | undefined;
  if (body?.query === '') delete body.query;
  return req;
}

const GRAPHQL_ERRORS = [
  ApiResponse({
    status: 400,
    description: 'The query is missing or not valid.',
    schema: ref('GraphQLResponse'),
  }),
  ApiResponse({
    status: 500,
    description: 'Nothing could be answered (e.g. a variable is missing).',
    schema: ref('GraphQLResponse'),
  }),
];

const GraphqlErrors = () => applyDecorators(...GRAPHQL_ERRORS);

@ApiTags('GraphQL')
@Controller('graphql')
export class GraphqlController {
  private readonly rootValue: Record<string, (args: Args) => unknown>;

  constructor(verses: VersesService, banis: BanisService) {
    this.rootValue = {
      shabad: ({ id, sinceDate }) => verses.getShabad([`${id}`], since(sinceDate), false),
      multiShabad: ({ id, sinceDate }) =>
        verses.getShabad(id.split(/[,+]/g), since(sinceDate), true),
      ang: ({ id, sourceId, sinceDate }) =>
        verses.getAngs({ pageNo: id, sourceID: sourceId, sinceDate: since(sinceDate) }),
      multiAng: ({ id, sourceId, sinceDate }) =>
        verses.getAngs({ pageNo: id, sourceID: sourceId, sinceDate: since(sinceDate) }),
      banis: () => banis.all(),
      bani: ({ id, length, sinceDate }) => banis.bani(id, length, since(sinceDate)),
    };
  }

  private readonly query = graphqlHTTP(() => ({
    schema,
    rootValue: this.rootValue,
    graphiql: false,
  }));
  private readonly queryOrGraphiql = graphqlHTTP(() => ({
    schema,
    rootValue: this.rootValue,
    graphiql: true,
  }));

  @Post()
  @HttpCode(200)
  @GraphqlErrors()
  @Limit100()
  @ApiOperation({
    summary: 'GraphQL query',
    description:
      'Queries: `shabad(id, sinceDate)`, `multiShabad(id: "1,2")`, `ang(id, sourceId, sinceDate)`, `multiAng(id: "1-3")`, `banis`, `bani(id, length, sinceDate)`.',
  })
  @ApiBody({ schema: ref('GraphQLRequest') })
  @ApiOkResponse({ schema: ref('GraphQLResponse') })
  async post(@Req() req: Request, @Res() res: Response) {
    await this.query(withoutEmptyQuery(req) as never, res as never);
  }

  @Get()
  @Limit100()
  @GraphqlErrors()
  @ApiOperation({
    summary: 'GraphQL query, or GraphiQL in a browser',
    description: 'Without `query`, a browser (`Accept: text/html`) gets GraphiQL.',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    schema: { type: 'string', example: '{ banis { ID token } }' },
  })
  @ApiQuery({
    name: 'variables',
    required: false,
    description: 'JSON.',
    schema: { type: 'string' },
  })
  @ApiQuery({ name: 'operationName', required: false, schema: { type: 'string' } })
  @ApiProduces('application/json', 'text/html')
  @ApiOkResponse({
    content: {
      'application/json': { schema: ref('GraphQLResponse') },
      'text/html': { schema: { type: 'string', description: 'GraphiQL.' } },
    },
  })
  async get(@Req() req: Request, @Res() res: Response) {
    await this.queryOrGraphiql(withoutEmptyQuery(req) as never, res as never);
  }
}
