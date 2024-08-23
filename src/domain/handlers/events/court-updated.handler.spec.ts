import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';

import { getCourtAttrFlagKey } from '../../../application/helpers/cache-keys';
import { CourtUpdatedEvent } from '../../../domain/events/court-updated.event';
import { CourtUpdatedHandler } from './court-updated.handler';

describe('CourtUpdatedHandler', () => {
  let handler: CourtUpdatedHandler;
  let cacheService: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourtUpdatedHandler,
        {
          provide: CACHE_MANAGER,
          useValue: {
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<CourtUpdatedHandler>(CourtUpdatedHandler);
    cacheService = module.get<Cache>(CACHE_MANAGER);
  });

  it('should set the court attribute flag in the cache if fields are provided', async () => {
    const event = new CourtUpdatedEvent(1, 1, ['attributes']);

    const flagKey = getCourtAttrFlagKey(event.clubId, event.courtId);

    await handler.handle(event);

    expect(cacheService.set).toHaveBeenCalledWith(flagKey, true);
  });

  it('should not set any flag if fields are not provided', async () => {
    const event = new CourtUpdatedEvent(1, 1, []);

    await handler.handle(event);

    expect(cacheService.set).not.toHaveBeenCalled();
  });
});
