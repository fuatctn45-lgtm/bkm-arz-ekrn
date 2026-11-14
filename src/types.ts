export type FaultCategory =
  | 'isg'
  | 'mekanik'
  | 'elektrik'
  | 'planli'
  | 'is'
  | 'other';

export type ThemePreset = 'dark' | 'blue' | 'gray' | 'white';
export type FontWeightPreset = 'normal' | 'thin' | 'thick';
export type FontFamilyPreset = 'Plus Jakarta Sans' | 'Outfit' | 'Manrope' | 'DM Sans';

export interface FaultTypeInfo {
  category: FaultCategory;
  label: string;
  accentHex: string;
  bgRgb: string;
  fgHex: string;
  mutedFgHex: string;
  cardBgLight: string;
  cardBgDark: string;
  badgeTextClass: string;
  surfaceTintClass: string;
  borderTintClass: string;
}

export interface FaultRecord {
  id: string;
  rawDate: string;
  datePart: string;
  timePart: string;
  timestampMs: number;
  reporter: string;
  reporterFull: string;
  machine: string;
  shift: string;
  typeRaw: string;
  typeInfo: FaultTypeInfo;
  description: string;
  technician: string;
  isUnassigned: boolean;
  isTodayUnassigned: boolean;
  isRecurring: boolean;
  machineFaultCount: number;
}

export interface DisplaySettings {
  theme: ThemePreset;
  fontFamily: FontFamilyPreset;
  fontWeight: FontWeightPreset;
  cardFontSize: number;
  rowFontSize: number;
  rulerFontSize: number;
  cardOpacity: number;
  pageScale: number;
  soundEnabled: boolean;
}

export interface ApiConfig {
  dashboardUrl: string;
}

export interface DashboardStats {
  total: number;
  mekanik: number;
  elektrik: number;
  isg: number;
  recurring: number;
  planli: number;
  unassignedTotal: number;
}
