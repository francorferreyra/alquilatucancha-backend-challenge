export interface ZoneCountry {
  id: number;
  name: string;
  iso_code: string;
}

export type Zone = {
  id: number;
  name: string;
  full_name: string;
  placeid: string;
  country: ZoneCountry;
};
