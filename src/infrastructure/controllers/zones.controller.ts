import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { GetZonesQuery } from '../../domain/commands/get-zones.query';
import { Zone } from '../models/zone';

@Controller('/zones')
export class ZonesController {
  constructor(private queryBus: QueryBus) {}
  @Get()
  getZones(): Promise<Zone[]> {
    return this.queryBus.execute(new GetZonesQuery());
  }
}
