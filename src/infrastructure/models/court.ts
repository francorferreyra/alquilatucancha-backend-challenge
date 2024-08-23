export interface CourtAttributes {
  floor: string;
  light: boolean;
  roofed: boolean;
  beelup: boolean;
}

export interface CourtSport {
  id: number;
  parent_id: number;
  name: string;
  players_max: number;
  order: number;
  default_duration: number;
  divisible_duration: number;
  icon: string;
  pivot: {
    court_id: number;
    sport_id: number;
    enabled: number;
  };
}

export interface Court {
  id: number;
  name: string;
  sports: CourtSport[];
}
