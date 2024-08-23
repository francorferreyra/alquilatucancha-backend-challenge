import { format } from 'date-fns';

import { DATE_FORMAT } from '../../infrastructure/constants/date';

export const getFallbackClubsKey = (placeId: string, date: string) =>
  `date[${date}]-zone[${placeId}]-available_clubs-fallback`;

export const getZonesCacheKey = () => `zones`;

export const getClubsByZoneCacheKey = (placeId: string) =>
  `zone[${placeId}]-clubs`;

export const getCourtsCacheKey = (clubId: number) => `club[${clubId}]-courts`;

export const getSlotCacheKey = (clubId: number, courtId: number, date: Date) =>
  `club[${clubId}]-court[${courtId}]-date[${format(date, DATE_FORMAT)}]-slots`;

export const getClubDisponibilityFlagKey = (clubId: number) =>
  `club[${clubId}]-disponibility-updated`;

export const getClubAttrFlagKey = (clubId: number) =>
  `club[${clubId}]-attr-updated`;

export const getCourtAttrFlagKey = (clubId: number, courtId: number) =>
  `club[${clubId}]-court[${courtId}]-attr-updated`;

export const getSlotCanceledFlagKey = (
  clubId: number,
  courtId: number,
  date: string,
) => `club[${clubId}]-court[${courtId}]-date[${date}]-slot-canceled`;

export const getSlotBookedFlagKey = (
  clubId: number,
  courtId: number,
  date: string,
) => `club[${clubId}]-court[${courtId}]-date[${date}]-slot-booked`;
