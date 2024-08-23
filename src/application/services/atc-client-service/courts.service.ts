import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';

import {
  ALQUILA_TU_CANCHA_CLIENT,
  IAlquilaTuCanchaClient,
} from '../../../infrastructure/interfaces/aquila-tu-cancha.client';
import { Club } from '../../../infrastructure/models/club';
import { Court } from '../../../infrastructure/models/court';
import {
  getCourtAttrFlagKey,
  getCourtsCacheKey,
} from '../../helpers/cache-keys';

@Injectable()
export class CourtsService {
  private readonly logger = new Logger(CourtsService.name);
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheService: Cache,
    @Inject(ALQUILA_TU_CANCHA_CLIENT)
    private readonly client: IAlquilaTuCanchaClient,
  ) {}

  async getCachedCourts(clubId: Club['id']) {
    const cacheKey = getCourtsCacheKey(clubId);
    const cachedCourts = await this.cacheService.get<Court[]>(cacheKey);

    if (cachedCourts) {
      const updatedCacheCourts = await Promise.all(
        cachedCourts.map(async (c) => {
          const courtUpdatedKey = getCourtAttrFlagKey(clubId, c.id);
          const isCourtUpdated = await this.cacheService.get(courtUpdatedKey);

          if (!isCourtUpdated) return c;

          this.logger.verbose(`Updating court ${c.id}`);

          const newCourtInfo = await this.client.getCourtById(clubId, c.id);

          if (!newCourtInfo) return c;

          await this.cacheService.del(courtUpdatedKey);

          return newCourtInfo;
        }),
      );

      await this.cacheService.set(cacheKey, updatedCacheCourts, 10 * 1000);

      return updatedCacheCourts;
    }

    const newCourts = await this.client.getCourts(clubId);

    if (!newCourts) throw new Error('Hubo un error al obtener las canchas');

    await this.cacheService.set(cacheKey, newCourts, 10 * 1000);

    return newCourts;
  }
}
