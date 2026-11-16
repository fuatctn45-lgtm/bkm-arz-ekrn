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

const SHIFT_CACHE_KEY = 'hub-shift-ruler-cache-v1';
const SHIFT_HOURS = 8;
const TOTAL_QUARTERS = SHIFT_HOURS * 4; // 32 quarter-hour ticks (every 15 min)
const SQUARE_SIZE_PX = 16;
const MIN_HORIZ_GAP_PX = 18; // 16px square + 2px horizontal clearance
const LANE_STEP_PX = 17; // 16px square + 1px vertical clearance
const BASE_BAR_HEIGHT_PX = 28; // h-7
const BASE_BOTTOM_OFFSET_PX = 6; // centers 16px square vertically inside 28px bar

function getActiveShiftConfig(hour: number): ShiftConfig {
  if (hour >= 8 && hour < 16) {
    return {
      id: 'day',
      startHour: 8,
      endHour: 16,
      backdropClass: 'bg-gradient-to-r from-cyan-500/20 via-sky-400/15 to-cyan-500/25',
      progressGradient: 'linear-gradient(90deg, rgba(6,182,212,0.32), rgba(14,165,233,0.52))',
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
      progressGradient: 'linear-gradient(90deg, rgba(245,158,11,0.32), rgba(249,115,22,0.52))',
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
    progressGradient: 'linear-gradient(90deg, rgba(99,102,241,0.32), rgba(139,92,246,0.52))',
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

  // Sync live faults from this shift into persistent shift cache until shift handover (vardiya devri)
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

    // Retain previously recorded faults from this shift even if closed & removed from API
    for (const item of existingForShift) {
      mergedMap.set(item.id, item);
    }
    // Update / add current live faults from this shift
    for (const item of activeLiveFaults) {
      mergedMap.set(item.id, item);
    }

    const mergedList = Array.from(mergedMap.values());
    writeShiftCache(shiftKey, mergedList);
    setCachedShiftFaults(mergedList);
  }, [faults, shiftKey, shift.startHour, shift.endHour]);

  const currentMinutesOfDay = currentHour * 60 + now.getMinutes() + now.getSeconds() / 60;
  const startMin = shift.startHour * 60;
  const totalSpanMin = SHIFT_HOURS * 60;
  const elapsedMin = Math.max(0, Math.min(totalSpanMin, currentMinutesOfDay - startMin));
  const currentPercent = (elapsedMin / totalSpanMin) * 100;

  const { numberedItems, shiftNumberById } = useMemo(() => {
    const sorted = cachedShiftFaults
      .map((fault) => {
        const mins = parseTimeToMinutesInShift(fault.timePart, shift.startHour, shift.endHour);
        if (mins === null) return null;
        return {
          fault,
          mins,
          percent: (mins / totalSpanMin) * 100,
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
  }, [cachedShiftFaults, shift.startHour, shift.endHour, totalSpanMin]);

  return {
    now,
    shift,
    shiftKey,
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
  const [trackWidthPx, setTrackWidthPx] = useState<number>(1200);
  const [hoveredMarker, setHoveredMarker] = useState<{
    fault: FaultRecord;
    shiftNumber: number;
    timeShort: string;
    percent: number;
    isOpen: boolean;
  } | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const updateWidth = () => {
      if (el.clientWidth > 0) {
        setTrackWidthPx(el.clientWidth);
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

  const { faultMarkers, maxLanes } = useMemo(() => {
    const laneLastXPx: number[] = [];
    const placed = numberedItems.map((item) => {
      const rawXPx = (item.percent / 100) * trackWidthPx;
      // Keep edges inside track bounds so first/last squares aren't clipped
      const clampedXPx = Math.max(
        SQUARE_SIZE_PX / 2,
        Math.min(trackWidthPx - SQUARE_SIZE_PX / 2, rawXPx)
      );

      let assignedLane = 0;
      while (
        assignedLane < laneLastXPx.length &&
        clampedXPx - laneLastXPx[assignedLane] < MIN_HORIZ_GAP_PX
      ) {
        assignedLane++;
      }
      laneLastXPx[assignedLane] = clampedXPx;

      const clampedPercent =
        trackWidthPx > 0 ? (clampedXPx / trackWidthPx) * 100 : item.percent;

      return {
        ...item,
        percent: clampedPercent,
        lane: assignedLane,
      };
    });

    return {
      faultMarkers: placed,
      maxLanes: Math.max(1, laneLastXPx.length),
    };
  }, [numberedItems, trackWidthPx]);

  const trackHeightPx = Math.max(
    BASE_BAR_HEIGHT_PX,
    BASE_BOTTOM_OFFSET_PX + maxLanes * LANE_STEP_PX + 2
  );

  const clampedFontPx = Math.max(4, Math.min(24, fontSize));
  const BASE_LABEL_FONT_PX = 12;
  const labelBasePx = clampedFontPx < BASE_LABEL_FONT_PX ? BASE_LABEL_FONT_PX : clampedFontPx;
  const labelScale = clampedFontPx < BASE_LABEL_FONT_PX ? clampedFontPx / BASE_LABEL_FONT_PX : 1;
  const halfLabelScale = labelScale * 0.85;

  const pillFontPx = Math.min(28, Math.max(13, Math.round(clampedFontPx * 1.5)));
  const pillBoxHeightPx = Math.ceil(pillFontPx * 1.15 + 6);
  const labelsTopAboveTrackPx = Math.max(0, 29 + Math.ceil(clampedFontPx) - trackHeightPx + 3);
  const pillPullUpPx = labelsTopAboveTrackPx + pillBoxHeightPx + 4;

  const bottomPadPx = 4;
  const topPadPx = pillPullUpPx + 5;

  return (
    <div data-ruler-root="true" className="w-full py-0 select-none">
      {/* Horizontal Graduated Colored Ruler for Active 8-Hour Shift (Frameless, Flush Top) */}
      <div
        className="relative w-full px-3.5 sm:px-4"
        style={{ paddingTop: `${topPadPx}px`, paddingBottom: `${bottomPadPx}px` }}
      >
        <div
          ref={trackRef}
          className="relative w-full transition-[height] duration-150"
          style={{ height: `${trackHeightPx}px` }}
        >
          {/* Base 28px Recessed 3D Ruler Track Anchored at Bottom */}
          <div
            className="absolute inset-x-0 bottom-0 h-7 rounded-md border border-black/20 dark:border-white/15"
            style={{
              boxShadow:
                'inset 0 3px 6px rgba(0,0,0,0.42), inset 0 -1px 0 rgba(255,255,255,0.22), 0 4px 10px rgba(0,0,0,0.26)',
            }}
          >
            <div
              className="absolute inset-0 rounded-md overflow-hidden pointer-events-none"
              aria-hidden="true"
            >
              {/* Colored Active Shift Backdrop */}
              <div className={`absolute inset-0 ${shift.backdropClass}`} />

              {/* Live Elapsed Progress Bar */}
              <div
                className="absolute inset-y-0 left-0 transition-all duration-1000"
                style={{
                  width: `${currentPercent}%`,
                  background: shift.progressGradient,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
                }}
              />

              {/* Center Horizontal Axis Line */}
              <div
                className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] shadow-[0_1px_0_rgba(255,255,255,0.28)] ${shift.axisBg}`}
              />
            </div>

            {/* Graduated Ruler Tick Marks (every 15 min across 8 hours, with hour & half-hour labels) */}
            {Array.from({ length: TOTAL_QUARTERS + 1 }).map((_, idx) => {
              const pct = (idx / TOTAL_QUARTERS) * 100;
              const isHour = idx % 4 === 0;
              const isHalf = idx % 4 === 2;
              const hourVal = shift.startHour + Math.floor(idx / 4);
              const displayHour =
                hourVal === 24 ? '00:00' : `${String(hourVal).padStart(2, '0')}:00`;
              const displayHalf = `${String(hourVal).padStart(2, '0')}:30`;

              const tickHeight = isHour ? 'h-6' : isHalf ? 'h-4.5' : 'h-2.5';
              const tickWidth = isHour ? 'w-[2px]' : isHalf ? 'w-[1.5px]' : 'w-[1px]';
              const tickColor = isHour ? shift.majorTickBg : shift.minorTickBg;

              return (
                <div
                  key={idx}
                  className="absolute inset-y-0 -translate-x-1/2 flex flex-col items-center justify-center"
                  style={{ left: `${pct}%` }}
                >
                  <div className={`${tickWidth} ${tickHeight} ${tickColor} rounded-full`} />
                  {isHour && (
                    <span
                      data-ruler-label="true"
                      className={`absolute bottom-[29px] z-[15] font-mono font-extrabold tabular-nums whitespace-nowrap leading-none ${
                        idx === 0
                          ? 'left-1/2 translate-x-0'
                          : idx === TOTAL_QUARTERS
                            ? 'right-1/2 translate-x-0'
                            : ''
                      } ${shift.hourTextClass}`}
                      style={{
                        fontSize: `${labelBasePx}px`,
                        transform: labelScale !== 1 ? `scale(${labelScale})` : undefined,
                        transformOrigin:
                          idx === 0
                            ? 'bottom left'
                            : idx === TOTAL_QUARTERS
                              ? 'bottom right'
                              : 'bottom center',
                      }}
                    >
                      {displayHour}
                    </span>
                  )}
                  {isHalf && (
                    <span
                      data-ruler-label="true"
                      className={`absolute bottom-[29px] z-[15] font-mono font-semibold tabular-nums whitespace-nowrap leading-none opacity-80 ${shift.hourTextClass}`}
                      style={{
                        fontSize: `${labelBasePx}px`,
                        transform: `scale(${halfLabelScale})`,
                        transformOrigin: 'bottom center',
                      }}
                    >
                      {displayHalf}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Time Indicator Needle (behind squares, badge above stack) */}
          <div
            className="absolute top-0 bottom-0 -translate-x-1/2 z-10 pointer-events-none flex flex-col items-center"
            style={{ left: `${currentPercent}%` }}
          >
            <div
              className="rounded-md px-2 py-0.5 font-mono font-black tracking-wide tabular-nums text-white whitespace-nowrap leading-none z-30"
              style={{
                marginTop: `-${pillPullUpPx}px`,
                fontSize: `${pillFontPx}px`,
                background: 'linear-gradient(180deg, #fb7185 0%, #e11d48 55%, #be123c 100%)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -2px 0 rgba(0,0,0,0.32), 0 4px 10px rgba(225,29,72,0.48)',
              }}
            >
              {`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`}
            </div>
            <div className="w-[2px] flex-1 bg-rose-500/85 shadow-[0_0_6px_rgba(244,63,94,0.65)]" />
          </div>

          {/* Today's Shift Fault Markers (all 100% crisp & visible for shift handover visibility) */}
          {faultMarkers.map(({ fault, percent, timeShort, shiftNumber, lane }) => {
            const isOpen = openFaultIds ? openFaultIds.has(fault.id) : true;
            const isNewest = newestFaultId === fault.id;

            return (
              <button
                key={fault.id}
                type="button"
                data-ruler-fault-id={fault.id}
                onClick={() => onSelectFault(fault)}
                onMouseEnter={() =>
                  setHoveredMarker({ fault, shiftNumber, timeShort, percent, isOpen })
                }
                onMouseLeave={() => setHoveredMarker(null)}
                onFocus={() =>
                  setHoveredMarker({ fault, shiftNumber, timeShort, percent, isOpen })
                }
                onBlur={() => setHoveredMarker(null)}
                style={{
                  left: `${percent}%`,
                  bottom: `${BASE_BOTTOM_OFFSET_PX + lane * LANE_STEP_PX}px`,
                  backgroundColor: `rgb(${fault.typeInfo.bgRgb})`,
                  backgroundImage:
                    'linear-gradient(145deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.06) 48%, rgba(0,0,0,0.22) 100%)',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.68), inset 0 -2px 0 rgba(0,0,0,0.32), 0 3px 5px rgba(0,0,0,0.42)',
                  color: fault.typeInfo.fgHex,
                }}
                title={`#${shiftNumber} · ${timeShort} · ${fault.machine} (${fault.typeInfo.label})${isOpen ? '' : ` [${fault.technician}]`} — ${fault.description}`}
                aria-label={`#${shiftNumber} ${timeShort} ${fault.machine} (${fault.typeInfo.label}) arıza detayı`}
                className={`absolute -translate-x-1/2 flex h-4 min-w-[16px] px-[2px] items-center justify-center rounded-[3px] font-mono text-[9.5px] font-black leading-none tabular-nums opacity-100 transition-transform hover:scale-125 hover:z-30 cursor-pointer ${
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

          {hoveredMarker && (
            <div
              role="tooltip"
              className="pointer-events-none absolute bottom-full mb-2 z-40 max-w-[280px] rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface)] px-2.5 py-1.5 text-[11px] text-[var(--hub-text)] shadow-xl"
              style={{
                left: `${Math.max(12, Math.min(88, hoveredMarker.percent))}%`,
                transform: 'translateX(-50%)',
              }}
            >
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};





