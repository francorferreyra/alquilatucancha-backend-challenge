import { Slot } from '../../infrastructure/models/slot';

export class SlotCanceledEvent {
  constructor(
    public clubId: number,
    public courtId: number,
    public slot: Slot,
  ) {}
}
