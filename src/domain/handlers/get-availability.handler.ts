import { Cache } from '@nestjs/cache-manager';
import { Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { format } from 'date-fns';

import { getFallbackClubsKey } from '../../application/helpers/cache-keys';
import { ClubsService } from '../../application/services/atc-client-service/clubs.service';
import { CourtsService } from '../../application/services/atc-client-service/courts.service';
import { SlotsService } from '../../application/services/atc-client-service/slots.service';
import { DATE_FORMAT } from '../../infrastructure/constants/date';
import {
  ClubWithAvailability,
  GetAvailabilityQuery,
} from '../commands/get-availaiblity.query';

@QueryHandler(GetAvailabilityQuery)
export class GetAvailabilityHandler
  implements IQueryHandler<GetAvailabilityQuery>
{
  private readonly logger = new Logger(GetAvailabilityHandler.name);
  constructor(
    private readonly clubsService: ClubsService,
    private readonly courtsService: CourtsService,
    private readonly slotsService: SlotsService,
    private readonly cacheService: Cache,
  ) {}

  async execute(query: GetAvailabilityQuery): Promise<ClubWithAvailability[]> {
    const fallbackKey = getFallbackClubsKey(
      query.placeId,
      format(query.date, DATE_FORMAT),
    );
    try {
      // Get clubs by zone
      const clubs = await this.clubsService.getCachedClubs(query.placeId);

      const clubsWithAvailability = await Promise.all(
        clubs.map(async (club) => {
          // Get courts static info
          const courts = await this.courtsService.getCachedCourts(club.id);

          if (!courts) return { ...club, courts: [] };

          //#region Get courts with available time slots
          const courtsWithAvailability = await Promise.all(
            courts.map(async (court) => {
              const slots = await this.slotsService.getCachedSlots(
                club.id,
                court.id,
                query.date,
              );

              return {
                ...court,
                available: slots,
              };
            }),
          );
          //#endregion

          return {
            ...club,
            courts: courtsWithAvailability,
          };
        }),
      );

      // Stores fallback response in case of error
      if (clubsWithAvailability)
        await this.cacheService.set(
          fallbackKey,
          clubsWithAvailability,
          60 * 1000,
        );

      return clubsWithAvailability;
    } catch (error) {
      this.logger.fatal(error);

      // Return of cached response if exists
      const fallbackClubs = await this.cacheService.get<ClubWithAvailability[]>(
        fallbackKey,
      );

      if (fallbackClubs) return fallbackClubs;

      return [];
    }
  }
}
