import { Slot } from '../../infrastructure/models/slot';

export class SlotBookedEvent {
  constructor(
    public clubId: number,
    public courtId: number,
    public slot: Slot,
  ) {}
}
