import type {
  DashboardStats,
  DisplaySettings,
  FaultCategory,
  FaultRecord,
  FaultTypeInfo,
  ThemePreset,
} from '../types';

export interface ThemeDefinition {
  id: ThemePreset;
  label: string;
  swatch: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  isLight: boolean;
}

export const BASE_THEME_DEFINITIONS: ThemeDefinition[] = [
  {
    id: 'dark',
    label: 'Koyu Tema',
    swatch: '#020617',
    bg: '#020617',
    surface: '#0f172a',
    surfaceAlt: '#1e293b',
    border: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    isLight: false,
  },
  {
    id: 'blue',
    label: 'Lacivert Tema',
    swatch: '#082f49',
    bg: '#082f49',
    surface: '#0c4a6e',
    surfaceAlt: '#075985',
    border: '#0369a1',
    text: '#f0f9ff',
    textMuted: '#bae6fd',
    isLight: false,
  },
  {
    id: 'gray',
    label: 'Gri Tema',
    swatch: '#1e293b',
    bg: '#1e293b',
    surface: '#334155',
    surfaceAlt: '#475569',
    border: '#475569',
    text: '#f8fafc',
    textMuted: '#cbd5e1',
    isLight: false,
  },
  {
    id: 'white',
    label: 'Beyaz Tema',
    swatch: '#f1f5f9',
    bg: '#f1f5f9',
    surface: '#ffffff',
    surfaceAlt: '#e2e8f0',
    border: '#cbd5e1',
    text: '#0f172a',
    textMuted: '#475569',
    isLight: true,
  },
];

export const COLOR_PALETTE_DEFINITIONS: ThemeDefinition[] = [
  {
    id: '#000000',
    label: '#000000',
    swatch: '#000000',
    bg: '#000000',
    surface: '#111827',
    surfaceAlt: '#1f2937',
    border: '#27272a',
    text: '#ffffff',
    textMuted: '#a1a1aa',
    isLight: false,
  },
  {
    id: '#FFFFFF',
    label: '#FFFFFF',
    swatch: '#FFFFFF',
    bg: '#FFFFFF',
    surface: '#f8fafc',
    surfaceAlt: '#f1f5f9',
    border: '#cbd5e1',
    text: '#0f172a',
    textMuted: '#475569',
    isLight: true,
  },
  {
    id: '#FF0000',
    label: '#FF0000',
    swatch: '#FF0000',
    bg: '#FF0000',
    surface: '#991b1b',
    surfaceAlt: '#b91c1c',
    border: '#ef4444',
    text: '#ffffff',
    textMuted: '#fecaca',
    isLight: false,
  },
  {
    id: '#0000FF',
    label: '#0000FF',
    swatch: '#0000FF',
    bg: '#0000FF',
    surface: '#1e3a8a',
    surfaceAlt: '#1d4ed8',
    border: '#3b82f6',
    text: '#ffffff',
    textMuted: '#bfdbfe',
    isLight: false,
  },
  {
    id: '#808080',
    label: '#808080',
    swatch: '#808080',
    bg: '#808080',
    surface: '#f3f4f6',
    surfaceAlt: '#e5e7eb',
    border: '#52525b',
    text: '#0f172a',
    textMuted: '#374151',
    isLight: true,
  },
  {
    id: '#333333',
    label: '#333333',
    swatch: '#333333',
    bg: '#333333',
    surface: '#1f1f1f',
    surfaceAlt: '#2a2a2a',
    border: '#4a4a4a',
    text: '#f8fafc',
    textMuted: '#d4d4d8',
    isLight: false,
  },
  {
    id: '#00FF00',
    label: '#00FF00',
    swatch: '#00FF00',
    bg: '#00FF00',
    surface: '#f0fdf4',
    surfaceAlt: '#dcfce7',
    border: '#16a34a',
    text: '#052e16',
    textMuted: '#166534',
    isLight: true,
  },
  {
    id: '#FFA500',
    label: '#FFA500',
    swatch: '#FFA500',
    bg: '#FFA500',
    surface: '#fffbeb',
    surfaceAlt: '#fef3c7',
    border: '#d97706',
    text: '#1c1917',
    textMuted: '#78350f',
    isLight: true,
  },
  {
    id: '#FF00FF',
    label: '#FF00FF',
    swatch: '#FF00FF',
    bg: '#FF00FF',
    surface: '#fdf4ff',
    surfaceAlt: '#fae8ff',
    border: '#a21caf',
    text: '#0f172a',
    textMuted: '#701a75',
    isLight: true,
  },
  {
    id: '#FFFF00',
    label: '#FFFF00',
    swatch: '#FFFF00',
    bg: '#FFFF00',
    surface: '#fefce8',
    surfaceAlt: '#fef9c3',
    border: '#ca8a04',
    text: '#0f172a',
    textMuted: '#713f12',
    isLight: true,
  },
  {
    id: '#FFD700',
    label: '#FFD700',
    swatch: '#FFD700',
    bg: '#FFD700',
    surface: '#fffbeb',
    surfaceAlt: '#fef3c7',
    border: '#b45309',
    text: '#0f172a',
    textMuted: '#78350f',
    isLight: true,
  },
  {
    id: '#F5F5F5',
    label: '#F5F5F5',
    swatch: '#F5F5F5',
    bg: '#F5F5F5',
    surface: '#ffffff',
    surfaceAlt: '#e5e5e5',
    border: '#d4d4d4',
    text: '#0f172a',
    textMuted: '#525252',
    isLight: true,
  },
  {
    id: '#1F91DC',
    label: '#1F91DC',
    swatch: '#1F91DC',
    bg: '#1F91DC',
    surface: '#0c4a6e',
    surfaceAlt: '#0369a1',
    border: '#38bdf8',
    text: '#ffffff',
    textMuted: '#e0f2fe',
    isLight: false,
  },
  {
    id: '#D6C1A6',
    label: '#D6C1A6',
    swatch: '#D6C1A6',
    bg: '#D6C1A6',
    surface: '#faf6f0',
    surfaceAlt: '#efe7da',
    border: '#a89173',
    text: '#1c1917',
    textMuted: '#57534e',
    isLight: true,
  },
  {
    id: '#ED9277',
    label: '#ED9277',
    swatch: '#ED9277',
    bg: '#ED9277',
    surface: '#fff5f2',
    surfaceAlt: '#ffe4dc',
    border: '#c2593f',
    text: '#1c1917',
    textMuted: '#7c2d12',
    isLight: true,
  },
];

export const ALL_THEME_DEFINITIONS: ThemeDefinition[] = [
  ...BASE_THEME_DEFINITIONS,
  ...COLOR_PALETTE_DEFINITIONS,
];

export function getThemeDefinition(theme: string | undefined): ThemeDefinition {
  return (
    ALL_THEME_DEFINITIONS.find((t) => t.id === theme) ?? BASE_THEME_DEFINITIONS[0]
  );
}

export function isLightTheme(theme: string | undefined): boolean {
  return getThemeDefinition(theme).isLight;
}

export const DEFAULT_DASHBOARD_API_URL =
  'https://script.google.com/macros/s/AKfycbwQS11Ce9KO5zpfsUVRpK8DjZrHCGz-T-6dVQC7awZ0llyas_CVii2UXV3Rg0ivDKllmA/exec';

export const REFRESH_INTERVAL_SEC = 20;
export const ALERT_TIMEOUT_SEC = 30;

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  theme: 'dark',
  fontFamily: 'Plus Jakarta Sans',
  fontWeight: 'normal',
  cardFontSize: 14,
  rowFontSize: 12,
  rulerFontSize: 11,
  cardOpacity: 1,
  pageScale: 1,
  soundEnabled: true,
};

export function getTypeInfo(turRaw?: string): FaultTypeInfo {
  const tur = (turRaw || '').toUpperCase().trim();
  if (tur.includes('İSG') || tur.includes('GÜVENLİ')) {
    return {
      category: 'isg',
      label: 'İSG Güvenliği',
      accentHex: '#dc2626',
      bgRgb: '220, 38, 38',
      fgHex: '#ffffff',
      mutedFgHex: 'rgba(255, 255, 255, 0.88)',
      cardBgLight: 'rgba(220, 38, 38, 0.14)',
      cardBgDark: 'rgba(220, 38, 38, 0.25)',
      badgeTextClass: 'text-red-700 dark:text-red-300',
      surfaceTintClass: 'bg-red-50/90 dark:bg-red-950/50',
      borderTintClass: 'border-red-300 dark:border-red-800/80',
    };
  }
  if (tur.includes('MEKANİK')) {
    return {
      category: 'mekanik',
      label: 'Mekanik Arıza',
      accentHex: '#00ffff',
      bgRgb: '0, 255, 255',
      fgHex: '#020617',
      mutedFgHex: 'rgba(2, 6, 23, 0.78)',
      cardBgLight: 'rgba(6, 182, 212, 0.14)',
      cardBgDark: 'rgba(8, 145, 178, 0.25)',
      badgeTextClass: 'text-cyan-800 dark:text-cyan-300',
      surfaceTintClass: 'bg-cyan-50/90 dark:bg-cyan-950/45',
      borderTintClass: 'border-cyan-300 dark:border-cyan-800/70',
    };
  }
  if (tur.includes('ELEKTRİK')) {
    return {
      category: 'elektrik',
      label: 'Elektrik Arıza',
      accentHex: '#ffff00',
      bgRgb: '255, 245, 0',
      fgHex: '#020617',
      mutedFgHex: 'rgba(2, 6, 23, 0.78)',
      cardBgLight: 'rgba(234, 179, 8, 0.16)',
      cardBgDark: 'rgba(202, 138, 4, 0.22)',
      badgeTextClass: 'text-amber-800 dark:text-amber-300',
      surfaceTintClass: 'bg-amber-50/90 dark:bg-amber-950/40',
      borderTintClass: 'border-amber-300 dark:border-amber-800/70',
    };
  }
  if (tur.includes('PLANLI')) {
    return {
      category: 'planli',
      label: 'Planlı Bakım',
      accentHex: '#ffa500',
      bgRgb: '255, 165, 0',
      fgHex: '#020617',
      mutedFgHex: 'rgba(2, 6, 23, 0.78)',
      cardBgLight: 'rgba(249, 115, 22, 0.14)',
      cardBgDark: 'rgba(234, 88, 12, 0.22)',
      badgeTextClass: 'text-orange-800 dark:text-orange-300',
      surfaceTintClass: 'bg-orange-50/90 dark:bg-orange-950/40',
      borderTintClass: 'border-orange-300 dark:border-orange-800/70',
    };
  }
  if (tur.includes('YAPILAN')) {
    return {
      category: 'is',
      label: 'Yapılan İş',
      accentHex: '#a25586',
      bgRgb: '162, 85, 134',
      fgHex: '#ffffff',
      mutedFgHex: 'rgba(255, 255, 255, 0.88)',
      cardBgLight: 'rgba(162, 85, 134, 0.14)',
      cardBgDark: 'rgba(162, 85, 134, 0.25)',
      badgeTextClass: 'text-[#833b69] dark:text-[#e3a8ce]',
      surfaceTintClass: 'bg-[#a25586]/10 dark:bg-[#a25586]/25',
      borderTintClass: 'border-[#a25586]/45 dark:border-[#a25586]/65',
    };
  }
  return {
    category: 'other',
    label: tur || 'Diğer',
    accentHex: '#f8fafc',
    bgRgb: '248, 250, 252',
    fgHex: '#020617',
    mutedFgHex: 'rgba(2, 6, 23, 0.75)',
    cardBgLight: 'rgba(148, 163, 184, 0.14)',
    cardBgDark: 'rgba(71, 85, 105, 0.25)',
    badgeTextClass: 'text-slate-700 dark:text-slate-300',
    surfaceTintClass: 'bg-slate-100/90 dark:bg-slate-800/60',
    borderTintClass: 'border-slate-300 dark:border-slate-700',
  };
}

export function shortenName(name?: string): string {
  if (!name || name.trim() === '-' || name.trim() === '') return '-';
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name.trim();
  return `${parts[0][0].toUpperCase()}.${parts[parts.length - 1]}`;
}

export function parseDateComponents(str: string): { d: number; m: number; y: number } | null {
  if (!str) return null;
  const parts = str.split(' ')[0].split(/[./-]/);
  if (parts.length < 3) return null;
  if (parts[0].length === 4) {
    return {
      y: parseInt(parts[0], 10),
      m: parseInt(parts[1], 10),
      d: parseInt(parts[2], 10),
    };
  }
  const first = parseInt(parts[0], 10);
  const second = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  // Handle mixed US-format Google Sheets dates like "1.27.2026"
  if (second > 12 && first <= 12) {
    return { d: second, m: first, y: year };
  }
  return { d: first, m: second, y: year };
}

export function isSameDay(
  a: { d: number; m: number; y: number } | null,
  b: { d: number; m: number; y: number } | null
): boolean {
  if (!a || !b) return false;
  return a.d === b.d && a.m === b.m && a.y === b.y;
}

export function parseTimestampMs(datePart: string, timePart: string): number {
  const comp = parseDateComponents(datePart);
  if (!comp) return 0;
  const cleanTime = (timePart || '00:00:00').trim();
  const timeParts = cleanTime.split(':').map((n) => parseInt(n, 10) || 0);
  const dt = new Date(
    comp.y,
    comp.m - 1,
    comp.d,
    timeParts[0] || 0,
    timeParts[1] || 0,
    timeParts[2] || 0
  );
  return Number.isNaN(dt.getTime()) ? 0 : dt.getTime();
}

export interface ProcessedDashboardResult {
  todayOpenFaults: FaultRecord[];
  pendingFaults: FaultRecord[];
  allFaults: FaultRecord[];
  stats: DashboardStats;
  latestAlertCandidate: FaultRecord | null;
  allKeys: string[];
}

export function processDashboardRows(
  rawData: unknown,
  previousAlertKeys: Set<string>,
  wasMemoryEmpty: boolean
): ProcessedDashboardResult {
  let rows: unknown[][] = [];
  if (Array.isArray(rawData)) {
    rows = rawData as unknown[][];
  } else if (rawData && typeof rawData === 'object') {
    const obj = rawData as Record<string, unknown>;
    if (Array.isArray(obj.value)) rows = obj.value as unknown[][];
    else if (Array.isArray(obj.data)) rows = obj.data as unknown[][];
    else {
      const firstVal = Object.values(obj)[0];
      if (Array.isArray(firstVal)) rows = firstVal as unknown[][];
    }
  }

  const emptyResult: ProcessedDashboardResult = {
    todayOpenFaults: [],
    pendingFaults: [],
    allFaults: [],
    stats: {
      total: 0,
      mekanik: 0,
      elektrik: 0,
      isg: 0,
      recurring: 0,
      planli: 0,
      unassignedTotal: 0,
    },
    latestAlertCandidate: null,
    allKeys: [],
  };

  if (!rows || rows.length < 2) {
    return emptyResult;
  }

  const now = new Date();
  const realToday = {
    d: now.getDate(),
    m: now.getMonth() + 1,
    y: now.getFullYear(),
  };

  const dataRows = rows.slice(1);
  const seenKeys = new Set<string>();
  const machineCounts = new Map<string, number>();
  const parsedDrafts: Omit<FaultRecord, 'isRecurring' | 'machineFaultCount'>[] = [];
  let latestAlertCandidate: FaultRecord | null = null;

  for (const row of dataRows) {
    if (!row || row.length < 1) continue;
    const rawDate = String(row[0] ?? '').trim();
    if (!rawDate) continue;

    const spaceSplit = rawDate.split(/\s+/);
    const datePart = spaceSplit[0] || '';
    const timePart = spaceSplit[1] || '';
    const reporterFull = String(row[1] ?? '-').trim() || '-';
    const reporter = shortenName(reporterFull);
    const machine = String(row[2] ?? '-').trim() || '-';
    const shift = String(row[3] ?? '').trim();
    const typeRaw = String(row[4] ?? 'DİĞER').toUpperCase().trim();
    const description = String(row[5] ?? '-').trim() || '-';
    const rawTech = String(row[6] ?? '').trim();

    const key = `${datePart}_${machine}_${description}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const isUnassigned = rawTech === '' || rawTech === '-';
    const technician = isUnassigned ? 'Personel Atanmadı' : rawTech;
    const rowDateComp = parseDateComponents(rawDate);
    const isTodayUnassigned = isSameDay(realToday, rowDateComp) && isUnassigned;
    const typeInfo = getTypeInfo(typeRaw);
    const timestampMs = parseTimestampMs(datePart, timePart);

    const normalizedMachine = machine.toUpperCase();
    if (normalizedMachine && normalizedMachine !== '-') {
      machineCounts.set(normalizedMachine, (machineCounts.get(normalizedMachine) || 0) + 1);
    }

    const draft = {
      id: key,
      rawDate,
      datePart,
      timePart,
      timestampMs,
      reporter,
      reporterFull,
      machine,
      shift,
      typeRaw,
      typeInfo,
      description,
      technician,
      isUnassigned,
      isTodayUnassigned,
    };

    parsedDrafts.push(draft);

    if (!wasMemoryEmpty && !previousAlertKeys.has(key)) {
      latestAlertCandidate = {
        ...draft,
        isRecurring: false,
        machineFaultCount: 1,
      };
    }
  }

  const allFaults: FaultRecord[] = parsedDrafts.map((item) => {
    const count = machineCounts.get(item.machine.toUpperCase()) || 1;
    return {
      ...item,
      isRecurring: count > 1 && item.machine !== '-',
      machineFaultCount: count,
    };
  });

  if (latestAlertCandidate) {
    const matched = allFaults.find((f) => f.id === latestAlertCandidate!.id);
    if (matched) latestAlertCandidate = matched;
  }

  const todayOpenFaults = allFaults
    .filter((f) => f.isTodayUnassigned)
    .sort((a, b) => a.timestampMs - b.timestampMs);

  const pendingFaults = allFaults
    .filter((f) => !f.isTodayUnassigned)
    .sort((a, b) => b.timestampMs - a.timestampMs);

  let mekanik = 0;
  let elektrik = 0;
  let isg = 0;
  let planli = 0;

  for (const item of todayOpenFaults) {
    if (item.typeInfo.category === 'mekanik') mekanik++;
    else if (item.typeInfo.category === 'elektrik') elektrik++;
    else if (item.typeInfo.category === 'isg') isg++;
    else if (item.typeInfo.category === 'planli') planli++;
  }

  let recurring = 0;
  for (const count of machineCounts.values()) {
    if (count > 1) recurring++;
  }

  const unassignedTotal = allFaults.filter((f) => f.isUnassigned).length;

  return {
    todayOpenFaults,
    pendingFaults,
    allFaults,
    stats: {
      total: allFaults.length,
      mekanik,
      elektrik,
      isg,
      recurring,
      planli,
      unassignedTotal,
    },
    latestAlertCandidate,
    allKeys: Array.from(seenKeys),
  };
}

export const CATEGORY_GROUP_ORDER: { category: FaultCategory; title: string }[] = [
  { category: 'isg', title: 'İSG & Güvenlik' },
  { category: 'mekanik', title: 'Mekanik Arıza' },
  { category: 'elektrik', title: 'Elektrik Arıza' },
  { category: 'planli', title: 'Planlı Bakım Kodu' },
  { category: 'is', title: 'Yapılan İş Hakkında' },
  { category: 'other', title: 'Diğer Kayıtlar' },
];

export function playAlertChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const freqs = [880, 660, 880];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.16);
      gain.gain.setValueAtTime(0.001, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.16 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.15);
    });
  } catch {
    // Ignore audio context restriction errors
  }
}
