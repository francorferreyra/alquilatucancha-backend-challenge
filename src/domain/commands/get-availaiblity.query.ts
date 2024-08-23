import { Club } from '../../infrastructure/models/club';
import { Court } from '../../infrastructure/models/court';
import { Slot } from '../../infrastructure/models/slot';

export class GetAvailabilityQuery {
  constructor(readonly placeId: string, readonly date: Date) {}
}

export interface ClubWithAvailability extends Club {
  courts: (Court & {
    available: Slot[];
  })[];
}
