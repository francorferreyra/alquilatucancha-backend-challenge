import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { getSlotBookedFlagKey } from '../../../application/helpers/cache-keys';
import { SlotBookedEvent } from '../../../domain/events/slot-booked.event';

@EventsHandler(SlotBookedEvent)
export class SlotBookedHandler implements IEventHandler<SlotBookedEvent> {
  constructor(@Inject(CACHE_MANAGER) private cacheService: Cache) {}

  async handle(e: SlotBookedEvent) {
    if (!e.slot) return;

    await this.cacheService.set(
      getSlotBookedFlagKey(
        e.clubId,
        e.courtId,
        e.slot.datetime.substring(0, 11),
      ),
      e.slot,
    );
  }
}
