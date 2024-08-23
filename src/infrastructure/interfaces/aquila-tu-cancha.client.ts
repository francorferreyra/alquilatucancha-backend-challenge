import { Club } from '../models/club';
import { Court } from '../models/court';
import { Slot } from '../models/slot';
import { Zone } from '../models/zone';

export const ALQUILA_TU_CANCHA_CLIENT = 'ALQUILA_TU_CANCHA_CLIENT';
export interface IAlquilaTuCanchaClient {
  getClubs(placeId: string): Promise<Club[] | undefined>;
  getCourts(clubId: number): Promise<Court[] | undefined>;
  getAvailableSlots(
    clubId: number,
    courtId: number,
    date: Date,
  ): Promise<Slot[] | undefined>;
  getClubById(clubId: number): Promise<Club | undefined>;
  getCourtById(clubId: number, courtId: number): Promise<Court | undefined>;
  getZones(): Promise<Zone[] | undefined>;
}
