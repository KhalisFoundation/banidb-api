import { Module } from '@nestjs/common';
import { BanisModule } from '../banis/banis.module';
import { ShabadsModule } from '../shabads/shabads.module';
import { GraphqlController } from './graphql.controller';

@Module({
  imports: [ShabadsModule, BanisModule],
  controllers: [GraphqlController],
})
export class GraphqlModule {}
