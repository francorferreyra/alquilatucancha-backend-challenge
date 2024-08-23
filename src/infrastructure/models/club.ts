import { ZoneCountry } from './zone';

export interface ClubLocation {
  name: string;
  city: string;
  lat: string;
  lng: string;
}

export interface ClubZone {
  id: number;
  name: string;
  full_name: string;
  placeid: string;
  country: ZoneCountry;
}

export interface ClubProps {
  sponsor: boolean;
  favorite: boolean;
  stars: string;
  payment: boolean;
}

export type ClubAttributes = string[];

export interface ClubOpenHour {
  day_of_week: number;
  open_time: number;
  close_time: number;
  open: boolean;
}

export interface Club {
  id: number;
  permalink: string;
  name: string;
  logo: string;
  logo_url: string;
  background: string;
  background_url: string;
  location: ClubLocation;
  zone: ClubZone;
  props: ClubProps;
  attributes: ClubAttributes;
  openhours: ClubOpenHour[];
  _priority: number;
}
