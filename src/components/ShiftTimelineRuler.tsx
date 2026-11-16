import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { FaultRecord } from '../types';
import { isSameDay, parseDateComponents } from '../utils/faultHelpers';

export interface ShiftConfig {
  id: 'day' | 'evening' | 'night';
  startHour: number;
  endHour: number;
  backdropClass: string;
  progressGradient: string;
  axisBg: string;
  majorTickBg: string;
  minorTickBg: string;
  hourTextClass: string;
}

export interface NumberedShiftFaultItem {
  fault: FaultRecord;
  mins: number;
  percent: number;
  timeShort: string;
  shiftNumber: number;
}

export interface ActiveShiftTimeline {
  now: Date;
  shift: ShiftConfig;
  shiftKey: string;
  elapsedMin: number;
  currentPercent: number;
  numberedItems: NumberedShiftFaultItem[];
  shiftNumberById: Map<string, number>;
}

interface ShiftTimelineRulerProps {
  timeline: ActiveShiftTimeline;
  fontSize?: number;
  openFaultIds?: Set<string>;
  newestFaultId?: string | null;
  onSelectFault: (fault: FaultRecord) => void;
}

interface StoredShiftCache {
  shiftKey: string;
  faults: FaultRecord[];
}

interface PlacedMarker {
  kind: 'single';
  fault: FaultRecord;
  shiftNumber: number;
  timeShort: string;
  x: number;
  y: number;
  percent: number;
  isOpen: boolean;
}

interface PlacedCluster {
  kind: 'cluster';
  id: string;
  x: number;
  y: number;
  items: NumberedShiftFaultItem[];
  label: string;
  bgRgb: string;
  fgHex: string;
}

type RulerMarker = PlacedMarker | PlacedCluster;

const SHIFT_CACHE_KEY = 'hub-shift-ruler-cache-v1';
const SHIFT_HOURS = 8;
const TOTAL_SHIFT_MIN = SHIFT_HOURS * 60; // 480
const TOTAL_QUARTERS = SHIFT_HOURS * 4; // 32 quarter-hour ticks (every 15 min)

const BAR_HEIGHT_PX = 38;
const AXIS_Y_PX = 25;
const SQUARE_SIZE_PX = 16;
const MIN_MARKER_GAP_PX = 18;
const LANE_STEP_PX = 11;

function getActiveShiftConfig(hour: number): ShiftConfig {
  if (hour >= 8 && hour < 16) {
    return {
      id: 'day',
      startHour: 8,
      endHour: 16,
      backdropClass: 'bg-gradient-to-r from-cyan-500/20 via-sky-400/15 to-cyan-500/25',
      progressGradient: 'linear-gradient(90deg, rgba(6,182,212,0.34), rgba(14,165,233,0.54))',
      axisBg: 'bg-cyan-500',
      majorTickBg: 'bg-cyan-700 dark:bg-cyan-300',
      minorTickBg: 'bg-cyan-600/75 dark:bg-cyan-400/65',
      hourTextClass: 'text-cyan-700 dark:text-cyan-300',
    };
  }

  if (hour >= 16) {
    return {
      id: 'evening',
      startHour: 16,
      endHour: 24,
      backdropClass: 'bg-gradient-to-r from-amber-500/20 via-orange-400/15 to-amber-500/25',
      progressGradient: 'linear-gradient(90deg, rgba(245,158,11,0.34), rgba(249,115,22,0.54))',
      axisBg: 'bg-amber-500',
      majorTickBg: 'bg-amber-700 dark:bg-amber-300',
      minorTickBg: 'bg-amber-600/75 dark:bg-amber-400/65',
      hourTextClass: 'text-amber-700 dark:text-amber-300',
    };
  }

  return {
    id: 'night',
    startHour: 0,
    endHour: 8,
    backdropClass: 'bg-gradient-to-r from-indigo-500/20 via-violet-400/15 to-indigo-500/25',
    progressGradient: 'linear-gradient(90deg, rgba(99,102,241,0.34), rgba(139,92,246,0.54))',
    axisBg: 'bg-indigo-500',
    majorTickBg: 'bg-indigo-700 dark:bg-indigo-300',
    minorTickBg: 'bg-indigo-600/75 dark:bg-indigo-400/65',
    hourTextClass: 'text-indigo-700 dark:text-indigo-300',
  };
}

function getShiftKey(date: Date, shiftId: ShiftConfig['id']): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}_${shiftId}`;
}

function parseTimeToMinutesInShift(
  timePart: string,
  startHour: number,
  endHour: number
): number | null {
  if (!timePart) return null;
  const parts = timePart.trim().split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;

  const totalMin = h * 60 + m;
  const minStart = startHour * 60;
  const minEnd = endHour * 60;

  if (totalMin < minStart || totalMin > minEnd) return null;
  return totalMin - minStart;
}

function readShiftCache(shiftKey: string): FaultRecord[] {
  try {
    const raw = localStorage.getItem(SHIFT_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredShiftCache;
    if (parsed && parsed.shiftKey === shiftKey && Array.isArray(parsed.faults)) {
      return parsed.faults;
    }
  } catch {
    // ignore storage errors
  }
  return [];
}

function writeShiftCache(shiftKey: string, faults: FaultRecord[]): void {
  try {
    const payload: StoredShiftCache = { shiftKey, faults };
    localStorage.setItem(SHIFT_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
}

export function useActiveShiftTimeline(faults: FaultRecord[]): ActiveShiftTimeline {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = now.getHours();
  const shift = getActiveShiftConfig(currentHour);
  const shiftKey = getShiftKey(now, shift.id);

  const [cachedShiftFaults, setCachedShiftFaults] = useState<FaultRecord[]>(() =>
    readShiftCache(shiftKey)
  );

  useEffect(() => {
    const curNow = new Date();
    const todayComp = {
      d: curNow.getDate(),
      m: curNow.getMonth() + 1,
      y: curNow.getFullYear(),
    };

    const activeLiveFaults = faults.filter((fault) => {
      const dateComp = parseDateComponents(fault.rawDate);
      if (!isSameDay(todayComp, dateComp)) return false;
      return parseTimeToMinutesInShift(fault.timePart, shift.startHour, shift.endHour) !== null;
    });

    const existingForShift = readShiftCache(shiftKey);
    const mergedMap = new Map<string, FaultRecord>();

    for (const item of existingForShift) {
      mergedMap.set(item.id, item);
    }
    for (const item of activeLiveFaults) {
      mergedMap.set(item.id, item);
    }

    const mergedList = Array.from(mergedMap.values());
    writeShiftCache(shiftKey, mergedList);
    setCachedShiftFaults(mergedList);
  }, [faults, shiftKey, shift.startHour, shift.endHour]);

  const currentMinutesOfDay = currentHour * 60 + now.getMinutes() + now.getSeconds() / 60;
  const startMin = shift.startHour * 60;
  const elapsedMin = Math.max(0, Math.min(TOTAL_SHIFT_MIN, currentMinutesOfDay - startMin));
  const currentPercent = (elapsedMin / TOTAL_SHIFT_MIN) * 100;

  const { numberedItems, shiftNumberById } = useMemo(() => {
    const sorted = cachedShiftFaults
      .map((fault) => {
        const mins = parseTimeToMinutesInShift(fault.timePart, shift.startHour, shift.endHour);
        if (mins === null) return null;
        return {
          fault,
          mins,
          percent: (mins / TOTAL_SHIFT_MIN) * 100,
          timeShort: fault.timePart.substring(0, 5),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.mins - b.mins || a.fault.timestampMs - b.fault.timestampMs);

    const map = new Map<string, number>();
    const items: NumberedShiftFaultItem[] = sorted.map((item, idx) => {
      const shiftNumber = idx + 1;
      map.set(item.fault.id, shiftNumber);
      return {
        ...item,
        shiftNumber,
      };
    });

    return {
      numberedItems: items,
      shiftNumberById: map,
    };
  }, [cachedShiftFaults, shift.startHour, shift.endHour]);

  return {
    now,
    shift,
    shiftKey,
    elapsedMin,
    currentPercent,
    numberedItems,
    shiftNumberById,
  };
}

export const ShiftTimelineRuler: React.FC<ShiftTimelineRulerProps> = ({
  timeline,
  fontSize = 11,
  openFaultIds,
  newestFaultId,
  onSelectFault,
}) => {
  const { now, shift, currentPercent, numberedItems } = timeline;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [trackWidth, setTrackWidth] = useState<number>(1200);
  const [hoveredMarker, setHoveredMarker] = useState<RulerMarker | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const updateWidth = () => {
      if (el.clientWidth > 0) {
        setTrackWidth(el.clientWidth);
      }
    };

    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateWidth);
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Place open faults first with priority; keep max 2 horizontal lanes on the rail and group overflowing closed items
  const rulerMarkers = useMemo<RulerMarker[]>(() => {
    const minX = SQUARE_SIZE_PX / 2 + 4;
    const maxX = Math.max(minX + 20, trackWidth - SQUARE_SIZE_PX / 2 - 4);

    const ordered = [...numberedItems]
      .map((item) => {
        const rawX = (item.percent / 100) * trackWidth;
        const clampedX = Math.max(minX, Math.min(maxX, rawX));
        const isOpen = openFaultIds ? openFaultIds.has(item.fault.id) : true;
        return { item, x: clampedX, isOpen };
      })
      .sort((a, b) => {
        if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
        return a.x - b.x || a.item.shiftNumber - b.item.shiftNumber;
      });

    const lanes: Array<Array<{ x: number }>> = [[], []];
    const singles: PlacedMarker[] = [];
    const overflowBuckets = new Map<number, { x: number; items: NumberedShiftFaultItem[] }>();

    for (const entry of ordered) {
      const { item, x, isOpen } = entry;
      let chosenLane = -1;

      for (let lane = 0; lane < lanes.length; lane++) {
        const collides = lanes[lane].some((p) => Math.abs(p.x - x) < MIN_MARKER_GAP_PX);
        if (!collides) {
          chosenLane = lane;
          break;
        }
      }

      if (chosenLane === -1) {
        if (isOpen) {
          chosenLane = lanes.length;
          lanes[chosenLane] = [];
        } else {
          const bucketX = Math.round(x / MIN_MARKER_GAP_PX) * MIN_MARKER_GAP_PX;
          const existing = overflowBuckets.get(bucketX);
          if (existing) {
            existing.items.push(item);
          } else {
            overflowBuckets.set(bucketX, { x, items: [item] });
          }
          continue;
        }
      }

      lanes[chosenLane].push({ x });
      singles.push({
        kind: 'single',
        fault: item.fault,
        shiftNumber: item.shiftNumber,
        timeShort: item.timeShort,
        x,
        y: AXIS_Y_PX + chosenLane * LANE_STEP_PX,
        percent: item.percent,
        isOpen,
      });
    }

    const clusters: PlacedCluster[] = [];
    for (const [bucketKey, bucket] of overflowBuckets.entries()) {
      const sortedItems = [...bucket.items].sort((a, b) => a.shiftNumber - b.shiftNumber);
      const firstNum = sortedItems[0].shiftNumber;
      const lastNum = sortedItems[sortedItems.length - 1].shiftNumber;
      const label = sortedItems.length === 1 ? String(firstNum) : `${firstNum}-${lastNum}`;
      const lastItem = sortedItems[sortedItems.length - 1];

      clusters.push({
        kind: 'cluster',
        id: String(bucketKey),
        x: Math.min(trackWidth - 26, Math.max(26, bucket.x)),
        y: AXIS_Y_PX + LANE_STEP_PX * 2 - 2,
        items: sortedItems,
        label,
        bgRgb: lastItem.fault.typeInfo.bgRgb,
        fgHex: lastItem.fault.typeInfo.fgHex,
      });
    }

    return [...singles, ...clusters];
  }, [numberedItems, openFaultIds, trackWidth]);

  const clampedFontPx = Math.max(4, Math.min(14, fontSize));
  const BASE_LABEL_FONT_PX = 11;
  const labelBasePx = clampedFontPx < BASE_LABEL_FONT_PX ? BASE_LABEL_FONT_PX : clampedFontPx;
  const labelScale = clampedFontPx < BASE_LABEL_FONT_PX ? clampedFontPx / BASE_LABEL_FONT_PX : 1;
  const halfLabelScale = labelScale * 0.85;

  const pillFontPx = Math.min(17, Math.max(12, Math.round(clampedFontPx * 1.25)));
  const liveClockStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const liveNeedleX = (Math.max(0, Math.min(100, currentPercent)) / 100) * trackWidth;
  const clampedLivePillX = Math.max(28, Math.min(trackWidth - 28, liveNeedleX));

  return (
    <div data-ruler-root="true" className="w-full select-none">
      {/* Flush Full-Width 3D Horizontal Single-Shift Bar (Pinned at 0px Top Edge) */}
      <div
        ref={trackRef}
        className="relative w-full border-b border-black/20 dark:border-white/15"
        style={{
          height: `${BAR_HEIGHT_PX}px`,
          boxShadow:
            'inset 0 2px 5px rgba(0,0,0,0.38), inset 0 -1px 0 rgba(255,255,255,0.22), 0 4px 10px rgba(0,0,0,0.24)',
        }}
      >
        {/* Clipped 3D Track Background + Elapsed Progress */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute inset-0 ${shift.backdropClass}`} />
          <div
            className="absolute inset-y-0 left-0 transition-all duration-1000"
            style={{
              width: `${currentPercent}%`,
              background: shift.progressGradient,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.32)',
            }}
          />
          <div
            className={`absolute left-0 right-0 h-[2px] shadow-[0_1px_0_rgba(255,255,255,0.28)] ${shift.axisBg}`}
            style={{ top: `${AXIS_Y_PX - 1}px` }}
          />
        </div>

        {/* Graduated 15-min Ticks & Top-Band Hour Labels (Flush inside top rail) */}
        {Array.from({ length: TOTAL_QUARTERS + 1 }).map((_, idx) => {
          const percent = (idx / TOTAL_QUARTERS) * 100;
          const isHour = idx % 4 === 0;
          const isHalf = idx % 4 === 2;
          const isStart = idx === 0;
          const isEnd = idx === TOTAL_QUARTERS;

          const hourVal = shift.startHour + Math.floor(idx / 4);
          const displayHour =
            hourVal === 24 ? '00:00' : `${String(hourVal).padStart(2, '0')}:00`;
          const displayHalf = `${String(hourVal).padStart(2, '0')}:30`;

          const tickHeight = isHour ? 'h-3.5' : isHalf ? 'h-2.5' : 'h-1.5';
          const tickWidth = isHour ? 'w-[2px]' : isHalf ? 'w-[1.5px]' : 'w-[1px]';
          const tickColor = isHour ? shift.majorTickBg : shift.minorTickBg;

          return (
            <div
              key={idx}
              className={`pointer-events-none absolute top-0 bottom-0 flex flex-col z-[15] ${
                isStart
                  ? 'items-start'
                  : isEnd
                    ? 'items-end -translate-x-full'
                    : 'items-center -translate-x-1/2'
              }`}
              style={{ left: `${percent}%` }}
            >
              {(isHour || isHalf) && (
                <span
                  data-ruler-label="true"
                  className={`mt-[3px] font-mono tabular-nums whitespace-nowrap leading-none ${
                    isStart ? 'pl-1.5' : isEnd ? 'pr-1.5' : ''
                  } ${
                    isHour ? 'font-extrabold' : 'font-semibold opacity-80'
                  } ${shift.hourTextClass}`}
                  style={{
                    fontSize: `${labelBasePx}px`,
                    transform: `scale(${isHour ? labelScale : halfLabelScale})`,
                    transformOrigin: isStart
                      ? 'left top'
                      : isEnd
                        ? 'right top'
                        : 'center top',
                  }}
                >
                  {isHour ? displayHour : displayHalf}
                </span>
              )}
              <div
                className={`absolute -translate-y-1/2 ${tickWidth} ${tickHeight} ${tickColor} rounded-full`}
                style={{ top: `${AXIS_Y_PX}px` }}
              />
            </div>
          );
        })}

        {/* Live Time Vertical Needle */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 -translate-x-1/2 z-[28]"
          style={{ left: `${liveNeedleX}px` }}
        >
          <div className="w-[2px] h-full bg-rose-500/95 shadow-[0_0_8px_rgba(244,63,94,0.75)]" />
        </div>

        {/* Centered 3D Red Live Clock Pill (clamped safely inside rail, never clipped) */}
        <div
          className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 rounded px-1.5 py-[2px] font-mono font-black tracking-wide tabular-nums text-white whitespace-nowrap leading-none"
          style={{
            left: `${clampedLivePillX}px`,
            fontSize: `${pillFontPx}px`,
            background: 'linear-gradient(180deg, #fb7185 0%, #e11d48 55%, #be123c 100%)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -2px 0 rgba(0,0,0,0.32), 0 3px 8px rgba(225,29,72,0.5)',
          }}
        >
          {liveClockStr}
        </div>

        {/* Numbered Fault Markers & Overflow Cluster Chips */}
        {rulerMarkers.map((marker) => {
          if (marker.kind === 'cluster') {
            return (
              <button
                key={`cluster-${marker.id}`}
                type="button"
                onClick={() => onSelectFault(marker.items[marker.items.length - 1].fault)}
                onMouseEnter={() => setHoveredMarker(marker)}
                onMouseLeave={() => setHoveredMarker(null)}
                onFocus={() => setHoveredMarker(marker)}
                onBlur={() => setHoveredMarker(null)}
                style={{
                  left: `${marker.x}px`,
                  top: `${marker.y}px`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: `rgb(${marker.bgRgb})`,
                  backgroundImage:
                    'linear-gradient(145deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.06) 48%, rgba(0,0,0,0.22) 100%)',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.68), inset 0 -2px 0 rgba(0,0,0,0.32), 0 3px 5px rgba(0,0,0,0.42)',
                  color: marker.fgHex,
                }}
                title={`${marker.items.length} kayıt (#${marker.label})`}
                aria-label={`${marker.items.length} kayıt (#${marker.label})`}
                className="absolute z-20 flex h-4 px-1.5 items-center justify-center rounded-full font-mono text-[9px] font-black leading-none tabular-nums ring-1 ring-black/25 dark:ring-white/30 transition-transform hover:scale-115 hover:z-40 cursor-pointer whitespace-nowrap"
              >
                {marker.label}
              </button>
            );
          }

          const { fault, x, y, timeShort, shiftNumber, isOpen } = marker;
          const isNewest = newestFaultId === fault.id;

          return (
            <button
              key={fault.id}
              type="button"
              data-ruler-fault-id={fault.id}
              onClick={() => onSelectFault(fault)}
              onMouseEnter={() => setHoveredMarker(marker)}
              onMouseLeave={() => setHoveredMarker(null)}
              onFocus={() => setHoveredMarker(marker)}
              onBlur={() => setHoveredMarker(null)}
              style={{
                left: `${x - SQUARE_SIZE_PX / 2}px`,
                top: `${y - SQUARE_SIZE_PX / 2}px`,
                backgroundColor: `rgb(${fault.typeInfo.bgRgb})`,
                backgroundImage:
                  'linear-gradient(145deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.06) 48%, rgba(0,0,0,0.22) 100%)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.68), inset 0 -2px 0 rgba(0,0,0,0.32), 0 3px 5px rgba(0,0,0,0.42)',
                color: fault.typeInfo.fgHex,
              }}
              title={`#${shiftNumber} · ${timeShort} · ${fault.machine} (${fault.typeInfo.label})${isOpen ? '' : ` [${fault.technician}]`} — ${fault.description}`}
              aria-label={`#${shiftNumber} ${timeShort} ${fault.machine} (${fault.typeInfo.label}) arıza detayı`}
              className={`absolute flex h-4 min-w-[16px] px-[2px] items-center justify-center rounded-[3px] font-mono text-[9.5px] font-black leading-none tabular-nums opacity-100 transition-transform hover:scale-125 hover:z-40 cursor-pointer ${
                isNewest
                  ? 'z-[25] scale-110 ring-2 ring-slate-900/80 dark:ring-white/95'
                  : isOpen
                    ? 'z-20 ring-1 ring-black/25 dark:ring-white/30'
                    : 'z-20 ring-1 ring-black/20 dark:ring-white/20'
              }`}
            >
              {shiftNumber}
            </button>
          );
        })}

        {/* Hover / Focus Tooltip */}
        {hoveredMarker && (
          <div
            role="tooltip"
            className="pointer-events-none absolute top-full mt-2 z-50 w-max max-w-[290px] -translate-x-1/2 rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface)] px-2.5 py-1.5 text-[11px] text-[var(--hub-text)] shadow-xl"
            style={{
              left: `${Math.max(120, Math.min(trackWidth - 120, hoveredMarker.x))}px`,
            }}
          >
            {hoveredMarker.kind === 'cluster' ? (
              <div>
                <div className="font-extrabold">
                  #{hoveredMarker.label} · {hoveredMarker.items.length} Kayıt ({hoveredMarker.items[0].timeShort})
                </div>
                <div className="mt-0.5 space-y-0.5 text-[10px] text-[var(--hub-text-muted)]">
                  {hoveredMarker.items.slice(0, 4).map((it) => (
                    <div key={it.fault.id} className="truncate">
                      #{it.shiftNumber} · {it.fault.machine} ({it.fault.technician})
                    </div>
                  ))}
                  {hoveredMarker.items.length > 4 && (
                    <div className="font-semibold">
                      +{hoveredMarker.items.length - 4} diğer kayıt
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 font-extrabold">
                  <span className="truncate">
                    #{hoveredMarker.shiftNumber} · {hoveredMarker.fault.machine}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--hub-text-muted)] shrink-0">
                    {hoveredMarker.timeShort}
                  </span>
                </div>
                <div className="mt-0.5 line-clamp-2 text-[10px] text-[var(--hub-text)]">
                  {hoveredMarker.fault.description}
                </div>
                <div className="mt-0.5 text-[10px] font-semibold text-[var(--hub-text-muted)] truncate">
                  {hoveredMarker.isOpen
                    ? 'Açık (Personel Bekliyor)'
                    : `Görevli: ${hoveredMarker.fault.technician}`}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
