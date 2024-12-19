import { Controller, Get, Query, UsePipes, InternalServerErrorException, Inject } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import * as moment from 'moment';
import { createZodDto, ZodValidationPipe } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

import {
  ClubWithAvailability,
  GetAvailabilityQuery,
} from '../../domain/commands/get-availaiblity.query';

const GetAvailabilitySchema = z.object({
  placeId: z.string(),
  date: z
    .string()
    .regex(/\d{4}-\d{2}-\d{2}/)
    .refine((date) => moment(date).isValid())
    .transform((date) => moment(date).toDate()),
});

class GetAvailabilityDTO extends createZodDto(GetAvailabilitySchema) {}

@Controller('search')
export class SearchController {
  constructor(
    private readonly queryBus: QueryBus,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  @Get()
  @UsePipes(ZodValidationPipe)
  async searchAvailability(
    @Query() query: GetAvailabilityDTO,
  ): Promise<ClubWithAvailability[]> {
    const key = `rate_limit:${query.placeId}:${query.date.toISOString()}`;
    const rateLimit = 60;
    const ttl = 60;

    const currentCount = await this.cacheManager.get<number>(key);
    if (currentCount && currentCount >= rateLimit) {
      throw new InternalServerErrorException('Rate limit exceeded');
    }

    await this.cacheManager.set(key, (currentCount || 0) + 1, { ttl });

    try {
      return await this.queryBus.execute(new GetAvailabilityQuery(query.placeId, query.date));
    } catch (error) {
      console.error('Error executing query:', error);
      throw new InternalServerErrorException('Failed to fetch availability');
    }
  }
}
