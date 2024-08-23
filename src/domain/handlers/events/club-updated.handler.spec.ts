import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';

import {
  getClubAttrFlagKey,
  getClubDisponibilityFlagKey,
} from '../../../application/helpers/cache-keys';
import { ClubUpdatedEvent } from '../../../domain/events/club-updated.event';
import { ClubUpdatedHandler } from './club-updated.handler';

describe('ClubUpdatedHandler', () => {
  let handler: ClubUpdatedHandler;
  let cacheService: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClubUpdatedHandler,
        {
          provide: CACHE_MANAGER,
          useValue: {
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<ClubUpdatedHandler>(ClubUpdatedHandler);
    cacheService = module.get<Cache>(CACHE_MANAGER);
  });

  it('should set the disponibility flag in the cache if openhours field is updated', async () => {
    const event = new ClubUpdatedEvent(1, ['openhours']);

    const flagKey = getClubDisponibilityFlagKey(event.clubId);

    await handler.handle(event);

    expect(cacheService.set).toHaveBeenCalledWith(flagKey, true);
  });

  it('should set the static attribute flag in the cache if a static attribute field is updated', async () => {
    const event = new ClubUpdatedEvent(1, ['background_url']);

    const flagKey = getClubAttrFlagKey(event.clubId);

    await handler.handle(event);

    expect(cacheService.set).toHaveBeenCalledWith(flagKey, true);
  });

  it('should set both flags if both openhours and a static attribute are updated', async () => {
    const event = new ClubUpdatedEvent(1, ['openhours', 'logo_url']);

    const disponibilityFlagKey = getClubDisponibilityFlagKey(event.clubId);
    const attrFlagKey = getClubAttrFlagKey(event.clubId);

    await handler.handle(event);

    expect(cacheService.set).toHaveBeenCalledWith(disponibilityFlagKey, true);
    expect(cacheService.set).toHaveBeenCalledWith(attrFlagKey, true);
  });

  it('should not set any flag if no relevant fields are updated', async () => {
    const event = new ClubUpdatedEvent(1, []);

    await handler.handle(event);

    expect(cacheService.set).not.toHaveBeenCalled();
  });
});
