import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

import {
  ALQUILA_TU_CANCHA_CLIENT,
  IAlquilaTuCanchaClient,
} from '../../../infrastructure/interfaces/aquila-tu-cancha.client';
import { Zone } from '../../../infrastructure/models/zone';
import { getZonesCacheKey } from '../../helpers/cache-keys';

@Injectable()
export class ZonesService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheService: Cache,
    @Inject(ALQUILA_TU_CANCHA_CLIENT)
    private readonly client: IAlquilaTuCanchaClient,
  ) {}

  async getCachedZones() {
    const cacheKey = getZonesCacheKey();
    const cachedZones = await this.cacheService.get<Zone[]>(cacheKey);

    if (cachedZones) return cachedZones;

    const newZones = await this.client.getZones();

    if (!newZones)
      throw new Error('Hubo un error al obtener las zonas de busqueda');

    await this.cacheService.set(cacheKey, newZones, 10 * 1000);

    return newZones;
  }
}
