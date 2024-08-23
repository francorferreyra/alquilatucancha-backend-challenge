import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { format, isBefore, isEqual } from 'date-fns';

import { insertIntoSlotsList } from '../../../domain/helpers/slots';
import { DATE_FORMAT } from '../../../infrastructure/constants/date';
import {
  ALQUILA_TU_CANCHA_CLIENT,
  IAlquilaTuCanchaClient,
} from '../../../infrastructure/interfaces/aquila-tu-cancha.client';
import { Club } from '../../../infrastructure/models/club';
import { Court } from '../../../infrastructure/models/court';
import { Slot } from '../../../infrastructure/models/slot';
import {
  getClubDisponibilityFlagKey,
  getSlotBookedFlagKey,
  getSlotCacheKey,
  getSlotCanceledFlagKey,
} from '../../helpers/cache-keys';
import { parseSlotDatetime } from '../../helpers/date';

@Injectable()
export class SlotsService {
  private readonly logger = new Logger(SlotsService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheService: Cache,
    @Inject(ALQUILA_TU_CANCHA_CLIENT)
    private readonly client: IAlquilaTuCanchaClient,
  ) {}

  async getCachedSlots(clubId: Club['id'], courtId: Court['id'], date: Date) {
    const clubDisponibilityFlagKey = getClubDisponibilityFlagKey(clubId);

    const isClubDisponibilityChanged = await this.cacheService.get(
      clubDisponibilityFlagKey,
    );

    const cacheKey = getSlotCacheKey(clubId, courtId, date);

    if (!isClubDisponibilityChanged) {
      let cachedSlots = await this.cacheService.get<Slot[]>(cacheKey);

      if (cachedSlots) {
        const formatedDate = format(date, DATE_FORMAT);

        const slotBookedFlagKey = getSlotBookedFlagKey(
          clubId,
          courtId,
          formatedDate,
        );
        const bookedSlot = await this.cacheService.get<Slot>(slotBookedFlagKey);

        if (bookedSlot) {
          this.logger.verbose(
            `Filtering booked slot for ${bookedSlot.datetime} in court ${courtId}`,
          );
          await this.cacheService.del(slotBookedFlagKey);
          cachedSlots = cachedSlots.filter(
            (s) =>
              !isEqual(
                parseSlotDatetime(s.datetime),
                parseSlotDatetime(bookedSlot.datetime),
              ),
          );
        }

        const slotAvailableFlagKey = getSlotCanceledFlagKey(
          clubId,
          courtId,
          formatedDate,
        );

        const availableSlot = await this.cacheService.get<Slot>(
          slotAvailableFlagKey,
        );
        if (availableSlot) {
          this.logger.verbose(
            `Added slot for ${availableSlot.datetime} in court ${courtId}`,
          );
          await this.cacheService.del(slotAvailableFlagKey);
          const indexToInsert = cachedSlots.findIndex((s) =>
            isBefore(
              parseSlotDatetime(availableSlot.datetime),
              parseSlotDatetime(s.datetime),
            ),
          );

          if (indexToInsert !== -1) {
            cachedSlots = insertIntoSlotsList(
              availableSlot,
              indexToInsert,
              cachedSlots,
            );
          }
        }

        await this.cacheService.set(cacheKey, cachedSlots, 10 * 1000);

        return cachedSlots;
      }
    }

    if (isClubDisponibilityChanged) {
      await this.cacheService.del(clubDisponibilityFlagKey);
      this.logger.verbose(
        `Updating club ${clubId} availability on open hours change`,
      );
    }

    const newSlots = await this.client.getAvailableSlots(clubId, courtId, date);

    if (!newSlots)
      throw new Error('Hubo un error al obtener los horarios disponibles');

    await this.cacheService.set(cacheKey, newSlots, 10 * 1000);

    return newSlots;
  }
}
