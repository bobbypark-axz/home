export type HousingTypeId = "happy" | "nation" | "integ";
export type StatusId = "open" | "upcoming" | "closing" | "closed";
export type Agency = "LH" | "SH" | "GH";

export interface District {
  id: string;
  name: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
  count: number;
}

export interface HousingType {
  id: HousingTypeId;
  name: string;
  badge: HousingTypeId;
}

export interface StatusLabel {
  text: string;
  color: string;
}

export interface Listing {
  id: string;
  title: string;
  type: HousingTypeId;
  agency: Agency;
  districtId: string;
  district: string;
  mapX: number;
  mapY: number;
  lat: number;
  lng: number;
  address: string;
  deposit: number;
  rent: number;
  area: string;
  layout: string;
  status: StatusId;
  deadline: string;
  eligible: string[];
  features: string[];
  transit: string;
  competition: number | null;
  thumbSeed: number;
}

export type FilterKey = "type" | "status" | "transit" | "eligibility" | "timing";
export type Filters = Record<FilterKey, string[]>;
export type SortKey = "recent" | "deadline" | "low-rent" | "low-depo";
export type ViewMode = "split" | "list";
export type Density = "compact" | "comfort";
