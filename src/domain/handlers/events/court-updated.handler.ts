import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { getCourtAttrFlagKey } from '../../../application/helpers/cache-keys';
import { CourtUpdatedEvent } from '../../../domain/events/court-updated.event';

@EventsHandler(CourtUpdatedEvent)
export class CourtUpdatedHandler implements IEventHandler<CourtUpdatedEvent> {
  constructor(@Inject(CACHE_MANAGER) private cacheService: Cache) {}

  async handle(e: CourtUpdatedEvent) {
    if (e.fields.length)
      await this.cacheService.set(
        getCourtAttrFlagKey(e.clubId, e.courtId),
        true,
      );
  }
}
