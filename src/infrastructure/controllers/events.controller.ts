import { Body, Controller, Post, Inject } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { UseZodGuard } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';  

import { ClubUpdatedEvent } from '../../domain/events/club-updated.event';
import { CourtUpdatedEvent } from '../../domain/events/court-updated.event';
import { SlotBookedEvent } from '../../domain/events/slot-booked.event';
import { SlotAvailableEvent } from '../../domain/events/slot-cancelled.event';

const SlotSchema = z.object({
  price: z.number(),
  duration: z.number(),
  datetime: z.string(),
  start: z.string(),
  end: z.string(),
  _priority: z.number(),
});

export const ExternalEventSchema = z.union([
  z.object({
    type: z.enum(['booking_cancelled', 'booking_created']),
    clubId: z.number().int(),
    courtId: z.number().int(),
    slot: SlotSchema,
  }),
  z.object({
    type: z.literal('club_updated'),
    clubId: z.number().int(),
    fields: z.array(
      z.enum(['attributes', 'openhours', 'logo_url', 'background_url']),
    ),
  }),
  z.object({
    type: z.literal('court_updated'),
    clubId: z.number().int(),
    courtId: z.number().int(),
    fields: z.array(z.enum(['attributes', 'name'])),
  }),
]);

export type ExternalEventDTO = z.infer<typeof ExternalEventSchema>;

@Controller('events')
export class EventsController {
  constructor(
    private eventBus: EventBus,
    @Inject(CACHE_MANAGER) private cacheManager: Cache, 
  ) {}

  private isBookingEvent(event: ExternalEventDTO): event is { type: 'booking_created' | 'booking_cancelled'; clubId: number; courtId: number; slot: any } {
    return event.type === 'booking_created' || event.type === 'booking_cancelled';
  }

  private async handleEvent(externalEvent: ExternalEventDTO) {
    if (this.isBookingEvent(externalEvent)) {
      const eventMapping = {
        booking_created: async () => {
          this.eventBus.publish(
            new SlotBookedEvent(
              externalEvent.clubId,
              externalEvent.courtId,
              externalEvent.slot,
            ),
          );

          const key = `availability:${externalEvent.clubId}:${externalEvent.courtId}:${externalEvent.slot.start}`;
          await this.cacheManager.set(key, { available: false }, { ttl: 60 }); 
        },
        booking_cancelled: async () => {
          this.eventBus.publish(
            new SlotAvailableEvent(
              externalEvent.clubId,
              externalEvent.courtId,
              externalEvent.slot,
            ),
          );

          const key = `availability:${externalEvent.clubId}:${externalEvent.courtId}:${externalEvent.slot.start}`;
          await this.cacheManager.set(key, { available: true }, { ttl: 60 });
        },
      };

      const eventHandler = eventMapping[externalEvent.type];
      if (eventHandler) {
        await eventHandler();
      }
    } else {
      switch (externalEvent.type) {
        case 'club_updated':
          this.eventBus.publish(
            new ClubUpdatedEvent(externalEvent.clubId, externalEvent.fields),
          );
          break;
        case 'court_updated':
          this.eventBus.publish(
            new CourtUpdatedEvent(
              externalEvent.clubId,
              externalEvent.courtId,
              externalEvent.fields,
            ),
          );
          break;
      }
    }
  }

  @Post()
  @UseZodGuard('body', ExternalEventSchema)
  async receiveEvent(@Body() externalEvent: ExternalEventDTO) {
    console.log('Received event:', externalEvent);
    try {
      await this.handleEvent(externalEvent);
      console.log('Event processed successfully');
      return { message: 'Event processed successfully' }; 
    } catch (error) {
      console.error('Error processing event:', error);
      return { message: 'Error processing event' };  
    }
  }
