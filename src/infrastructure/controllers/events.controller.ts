import { Body, Controller, Post } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { isMatch } from 'date-fns';
import { UseZodGuard } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

import { ClubUpdatedEvent } from '../../domain/events/club-updated.event';
import { CourtUpdatedEvent } from '../../domain/events/court-updated.event';
import { SlotBookedEvent } from '../../domain/events/slot-booked.event';
import { SlotCanceledEvent } from '../../domain/events/slot-cancelled.event';
import { DATE_HOUR_FORMAT } from '../constants/date';

const SlotSchema = z.object({
  price: z.number(),
  duration: z.number(),
  datetime: z.string().refine((d) => isMatch(d, DATE_HOUR_FORMAT)),
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
    fields: z
      .array(z.enum(['attributes', 'openhours', 'logo_url', 'background_url']))
      // Events without fields are rejected
      .refine((fields) => fields.length > 0),
  }),
  z.object({
    type: z.literal('court_updated'),
    clubId: z.number().int(),
    courtId: z.number().int(),
    fields: z
      .array(z.enum(['attributes', 'name']))
      // Events without fields are rejected
      .refine((fields) => fields.length > 0),
  }),
]);

export type ExternalEventDTO = z.infer<typeof ExternalEventSchema>;

@Controller('events')
export class EventsController {
  constructor(private eventBus: EventBus) {}

  @Post()
  @UseZodGuard('body', ExternalEventSchema)
  async receiveEvent(@Body() externalEvent: ExternalEventDTO) {
    switch (externalEvent.type) {
      case 'booking_created':
        this.eventBus.publish(
          new SlotBookedEvent(
            externalEvent.clubId,
            externalEvent.courtId,
            externalEvent.slot,
          ),
        );
        break;
      case 'booking_cancelled':
        this.eventBus.publish(
          new SlotCanceledEvent(
            externalEvent.clubId,
            externalEvent.courtId,
            externalEvent.slot,
          ),
        );
        break;
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
