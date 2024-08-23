import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ZonesService } from '../../application/services/atc-client-service/zones.service';
import { Zone } from '../../infrastructure/models/zone';
import { GetZonesQuery } from '../commands/get-zones.query';

@QueryHandler(GetZonesQuery)
export class GetZonesHandler implements IQueryHandler<GetZonesQuery> {
  private readonly logger = new Logger(GetZonesHandler.name);
  constructor(private readonly zonesService: ZonesService) {}

  async execute(): Promise<Zone[]> {
    try {
      const zones = await this.zonesService.getCachedZones();

      return zones;
    } catch (error) {
      this.logger.fatal(error);
      return [];
    }
  }
}
