import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Response } from 'express';
import { version } from '../app.controller';
import { schemas } from './schemas';

const DESCRIPTION = `
The most accurate Gurbani database: Sri Guru Granth Sahib Ji, Sri Dasam Granth
Sahib, Bhai Gurdas Ji's and Bhai Nand Lal Ji's Vaaran, Amrit Keertan and more,
with translations, transliterations, banis, hukamnamas, the Mahan Kosh and
rehat maryadas. Data licence: [NPOSL](http://www.banidb.com/nposl).

**Gurmukhi** comes as \`gurmukhi\` (ASCII for the Gurbani Akhar fonts) and
\`unicode\`.

**Caching.** Responses are cacheable for 6 hours (\`Cache-Control:
max-age=21600\`), the hukamnama for 30 minutes; \`/random\` and errors never.

**Errors.** \`{ "error": true, "data": { "error": "<message>" } }\` with the
status of the failure (500: \`Internal server error\`). An address the API
doesn't have answers 404 \`{ "url": "<path> not found" }\`.

**Rate limits.** Per client IP and per route, 100 or 250 requests a minute;
beyond that the answer is 429 \`Too Many Requests\` (plain text).

**GraphQL** at \`/v2/graphql\` serves shabads, Angs and banis in the same shapes
(schema: \`{ __schema { types { name } } }\`, or open it in a browser for GraphiQL).
`;

export function buildDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('BaniDB API')
    .setDescription(DESCRIPTION.trim())
    .setVersion(version)
    .setTermsOfService('https://www.banidb.com/tos')
    .setLicense('NPOSL (data)', 'http://www.banidb.com/nposl')
    .addServer('https://api.banidb.com', 'Production')
    .addServer('https://api.khajana.org', 'Development')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  document.components = { ...document.components, schemas };
  return document;
}

// Swagger UI at /v2/docs; the spec at /v2/openapi.json and /v2/openapi.yaml.
// The old address of the docs, /v2/api-docs, leads there.
export function setupDocs(app: INestApplication) {
  SwaggerModule.setup('v2/docs', app, () => buildDocument(app), {
    jsonDocumentUrl: 'v2/openapi.json',
    yamlDocumentUrl: 'v2/openapi.yaml',
    customSiteTitle: 'BaniDB API',
  });
  app.use('/v2/api-docs', (_req: unknown, res: Response) => res.redirect(301, '/v2/docs'));
}
