import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';

import { getSlotBookedFlagKey } from '../../../application/helpers/cache-keys';
import { SlotBookedEvent } from '../../../domain/events/slot-booked.event';
import { SlotBookedHandler } from './slot-booked.handler';

describe('SlotBookedHandler', () => {
  let handler: SlotBookedHandler;
  let cacheService: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotBookedHandler,
        {
          provide: CACHE_MANAGER,
          useValue: {
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<SlotBookedHandler>(SlotBookedHandler);
    cacheService = module.get<Cache>(CACHE_MANAGER);
  });

  it('should set the slot booked flag in the cache if a slot is provided', async () => {
    const event = new SlotBookedEvent(1, 1, {
      price: 3500,
      duration: 60,
      datetime: '2022-08-18 17:30',
      start: '17:30',
      end: '18:30',
      _priority: 0,
    });

    const flagKey = getSlotBookedFlagKey(
      event.clubId,
      event.courtId,
      event.slot.datetime.substring(0, 11),
    );

    await handler.handle(event);

    expect(cacheService.set).toHaveBeenCalledWith(flagKey, event.slot);
  });
});
