import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import { BanisService } from '../banis/banis.service';
import { parseDateTime } from '../common/input';
import { Limit100 } from '../common/throttle';
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
  @Limit100()
  async post(@Req() req: Request, @Res() res: Response) {
    await this.query(withoutEmptyQuery(req) as never, res as never);
  }

  @Get()
  @Limit100()
  async get(@Req() req: Request, @Res() res: Response) {
    await this.queryOrGraphiql(withoutEmptyQuery(req) as never, res as never);
  }
}
