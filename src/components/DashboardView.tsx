import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bolt,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  History,
  Maximize2,
  Minimize2,
  RefreshCw,
  Settings,
  ShieldAlert,
  Sliders,
  User,
  Wrench,
  X,
} from 'lucide-react';
import type {
  DashboardStats,
  DisplaySettings,
  FaultCategory,
  FaultRecord,
} from '../types';
import { CATEGORY_GROUP_ORDER, isLightTheme } from '../utils/faultHelpers';
import { PWAInstallButton } from './PWAInstallButton';
import { ScaledBlock } from './ScaledBlock';
import { ShiftTimelineRuler, useActiveShiftTimeline } from './ShiftTimelineRuler';

interface DashboardViewProps {
  todayOpenFaults: FaultRecord[];
  pendingFaults: FaultRecord[];
  allFaults: FaultRecord[];
  stats: DashboardStats;
  isLoading: boolean;
  error: string | null;
  lastSyncText: string;
  refreshCountdown: number;
  isFullscreen: boolean;
  settings: DisplaySettings;
  onRefresh: () => void;
  onToggleFullscreen: () => void;
  onOpenSettings: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  todayOpenFaults,
  pendingFaults,
  allFaults,
  stats,
  isLoading,
  error,
  lastSyncText,
  refreshCountdown,
  isFullscreen,
  settings,
  onRefresh,
  onToggleFullscreen,
  onOpenSettings,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [selectedFault, setSelectedFault] = useState<FaultRecord | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState<boolean>(true);
  const timeline = useActiveShiftTimeline(allFaults);
  const boardContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomMenuRef = useRef<HTMLDivElement | null>(null);
  const isMenuHoveredRef = useRef<boolean>(false);
  const hideTimerRef = useRef<number | null>(null);
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const [faultConnectors, setFaultConnectors] = useState<
    {
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      lane: number;
      laneCount: number;
      color: string;
    }[]
  >([]);
  const [connectorTopSpacePx, setConnectorTopSpacePx] = useState<number>(0);
  const [busTopY, setBusTopY] = useState<number>(0);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHideMenu = useCallback(() => {
    clearHideTimer();
    if (isMenuHoveredRef.current) return;
    hideTimerRef.current = window.setTimeout(() => {
      if (!isMenuHoveredRef.current) {
        if (
          bottomMenuRef.current &&
          document.activeElement instanceof HTMLElement &&
          bottomMenuRef.current.contains(document.activeElement)
        ) {
          document.activeElement.blur();
        }
        setIsMenuVisible(false);
      }
    }, 4000);
  }, [clearHideTimer]);

  useEffect(() => {
    const activateMenu = () => {
      setIsMenuVisible(true);
      scheduleHideMenu();
    };

    const handlePointerMove = (e: PointerEvent) => {
      // Ignore touch/synthetic pointermove jitter so Android touch devices hide reliably
      if (e.pointerType === 'touch') return;
      const prev = lastPointerPosRef.current;
      if (prev && Math.abs(e.clientX - prev.x) < 4 && Math.abs(e.clientY - prev.y) < 4) {
        return;
      }
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
      activateMenu();
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Ignore synthetic mousemove fired without actual cursor displacement (e.g. after tap or layout shift)
      const prev = lastPointerPosRef.current;
      if (prev && Math.abs(e.clientX - prev.x) < 4 && Math.abs(e.clientY - prev.y) < 4) {
        return;
      }
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
      activateMenu();
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') {
        // Never keep hover lock active from synthetic touch events on Android
        isMenuHoveredRef.current = false;
      }
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
      activateMenu();
    };

    const handleTouchStart = () => {
      isMenuHoveredRef.current = false;
      activateMenu();
    };

    const handleKeyDown = () => {
      activateMenu();
    };

    scheduleHideMenu();

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearHideTimer();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [clearHideTimer, scheduleHideMenu]);

  const groupedPending = useMemo(() => {
    return CATEGORY_GROUP_ORDER.map((group) => ({
      ...group,
      items: pendingFaults.filter((item) => item.typeInfo.category === group.category),
    })).filter((group) => group.items.length > 0);
  }, [pendingFaults]);

  const groupPlannedByTechnician = useCallback((items: FaultRecord[]) => {
    const map = new Map<string, FaultRecord[]>();
    for (const item of items) {
      const techName = item.technician.trim() || 'Personel Atanmadı';
      const existing = map.get(techName);
      if (existing) {
        existing.push(item);
      } else {
        map.set(techName, [item]);
      }
    }
    return Array.from(map.entries())
      .map(([technician, techItems]) => ({
        technician,
        isUnassigned: technician === 'Personel Atanmadı',
        items: techItems,
      }))
      .sort((a, b) => {
        if (a.isUnassigned !== b.isUnassigned) return a.isUnassigned ? -1 : 1;
        return a.technician.localeCompare(b.technician, 'tr');
      });
  }, []);

  const openFaultIdSet = useMemo(
    () => new Set(todayOpenFaults.map((f) => f.id)),
    [todayOpenFaults]
  );

  const newestOpenFaultId =
    todayOpenFaults.length > 0
      ? todayOpenFaults[todayOpenFaults.length - 1].id
      : null;

  const toggleGroup = (category: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const renderCategoryIcon = (category: FaultCategory) => {
    switch (category) {
      case 'mekanik':
        return <Wrench className="w-[1.15em] h-[1.15em] shrink-0" aria-hidden="true" />;
      case 'elektrik':
        return <Bolt className="w-[1.15em] h-[1.15em] shrink-0" aria-hidden="true" />;
      case 'isg':
        return <ShieldAlert className="w-[1.15em] h-[1.15em] shrink-0" aria-hidden="true" />;
      case 'planli':
        return <CalendarClock className="w-[1.15em] h-[1.15em] shrink-0" aria-hidden="true" />;
      default:
        return <Settings className="w-[1.15em] h-[1.15em] shrink-0" aria-hidden="true" />;
    }
  };

  const BASE_FONT_PX = 12;
  const cardScale = settings.cardFontSize < BASE_FONT_PX ? settings.cardFontSize / BASE_FONT_PX : 1;
  const effectiveCardFont = settings.cardFontSize < BASE_FONT_PX ? BASE_FONT_PX : settings.cardFontSize;
  const cardPadPx = Math.max(8, Math.round(effectiveCardFont * 0.72));
  const cardGapPx = Math.max(4, Math.round(effectiveCardFont * 0.35));

  const rowScale = settings.rowFontSize < BASE_FONT_PX ? settings.rowFontSize / BASE_FONT_PX : 1;
  const effectiveRowFont = settings.rowFontSize < BASE_FONT_PX ? BASE_FONT_PX : settings.rowFontSize;
  const rowPadY = Math.max(2, Math.round(effectiveRowFont * 0.22));

  const getConnectorStrokeColor = useCallback(
    (category: FaultCategory, bgRgb: string) => {
      if (isLightTheme(settings.theme)) {
        switch (category) {
          case 'mekanik':
            return '#0891b2';
          case 'elektrik':
            return '#ca8a04';
          case 'isg':
            return '#dc2626';
          case 'planli':
            return '#ea580c';
          case 'is':
            return '#a25586';
          default:
            return '#475569';
        }
      }
      return `rgba(${bgRgb}, 0.92)`;
    },
    [settings.theme]
  );

  const measureConnectors = useCallback(() => {
    const container = boardContainerRef.current;
    if (!container || todayOpenFaults.length === 0) {
      setFaultConnectors([]);
      setConnectorTopSpacePx(0);
      return;
    }

    const scale = settings.pageScale > 0 ? settings.pageScale : 1;
    const containerRect = container.getBoundingClientRect();
    const rulerEl = container.querySelector<HTMLElement>('[data-ruler-root="true"]');
    const rulerBottomY = rulerEl
      ? (rulerEl.getBoundingClientRect().bottom - containerRect.top) / scale
      : 0;

    const rawItems: {
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
    }[] = [];

    for (const fault of todayOpenFaults) {
      const escapedId =
        typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
          ? CSS.escape(fault.id)
          : fault.id.replace(/["\\]/g, '\\$&');
      const cardEl = container.querySelector<HTMLElement>(
        `[data-open-fault-id="${escapedId}"]`
      );
      const markerEl = container.querySelector<HTMLElement>(
        `[data-ruler-fault-id="${escapedId}"]`
      );
      if (!cardEl || !markerEl) continue;

      const cardRect = cardEl.getBoundingClientRect();
      const markerRect = markerEl.getBoundingClientRect();
      if (cardRect.width === 0 || markerRect.width === 0) continue;

      const anchorEl =
        container.querySelector<HTMLElement>(`[data-card-anchor-id="${escapedId}"]`) ?? cardEl;
      const anchorRect = anchorEl.getBoundingClientRect();

      const x1 = (anchorRect.left + anchorRect.width / 2 - containerRect.left) / scale;
      const y1 = (anchorRect.top - containerRect.top) / scale - 1;
      const x2 = (markerRect.left + markerRect.width / 2 - containerRect.left) / scale;
      const y2 = (markerRect.bottom - containerRect.top) / scale + 2;

      if (y1 <= y2 + 4) continue;

      rawItems.push({
        id: fault.id,
        x1,
        y1,
        x2,
        y2,
        color: getConnectorStrokeColor(fault.typeInfo.category, fault.typeInfo.bgRgb),
      });
    }

    if (rawItems.length === 0) {
      setFaultConnectors([]);
      setConnectorTopSpacePx(0);
      return;
    }

    // Sort shortest horizontal spans first so inner traces stay closest to cards and outer traces arc cleanly above
    const orderedItems = [...rawItems].sort(
      (a, b) => Math.abs(a.x2 - a.x1) - Math.abs(b.x2 - b.x1)
    );

    // Assign non-overlapping horizontal bus lanes so parallel lines stay cleanly separated
    const laneIntervals: Array<Array<{ minX: number; maxX: number }>> = [];
    const assignedItems = orderedItems.map((item) => {
      const spanMin = Math.min(item.x1, item.x2) - 10;
      const spanMax = Math.max(item.x1, item.x2) + 10;
      let assignedLane = 0;

      while (assignedLane < laneIntervals.length) {
        const collides = laneIntervals[assignedLane].some(
          (seg) => !(spanMax < seg.minX || spanMin > seg.maxX)
        );
        if (!collides) break;
        assignedLane++;
      }

      if (!laneIntervals[assignedLane]) {
        laneIntervals[assignedLane] = [];
      }
      laneIntervals[assignedLane].push({ minX: spanMin, maxX: spanMax });

      return {
        ...item,
        lane: assignedLane,
      };
    });

    const laneCount = Math.max(1, laneIntervals.length);
    const withLanes = assignedItems.map((item) => ({
      ...item,
      laneCount,
    }));
    const maxArrowTipY = Math.max(...withLanes.map((c) => c.y2));
    const desiredExtraSpace = Math.min(60, laneCount * 7 + 8);
    setBusTopY(Math.max(rulerBottomY + 2, maxArrowTipY + 12));
    setConnectorTopSpacePx(desiredExtraSpace);
    setFaultConnectors(withLanes);
  }, [todayOpenFaults, settings.pageScale, getConnectorStrokeColor]);

  useEffect(() => {
    let rafId = window.requestAnimationFrame(measureConnectors);
    const container = boardContainerRef.current;

    let ro: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        window.cancelAnimationFrame(rafId);
        rafId = window.requestAnimationFrame(measureConnectors);
      });
      ro.observe(container);
    }

    const handleResize = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(measureConnectors);
    };

    window.addEventListener('resize', handleResize);
    const settleTimer = window.setTimeout(measureConnectors, 60);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(settleTimer);
      ro?.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [measureConnectors, allFaults, settings.cardFontSize, settings.rulerFontSize]);

  const minCardTopY =
    faultConnectors.length > 0
      ? Math.min(...faultConnectors.map((c) => c.y1))
      : 0;

  return (
    <div className="w-full overflow-x-hidden">
      <ScaledBlock scale={settings.pageScale}>
      <div
        ref={boardContainerRef}
        className={
          isFullscreen
            ? 'relative w-full px-1.5 sm:px-3 pt-1 pb-16 space-y-2 sm:space-y-3'
            : 'relative w-full px-2 sm:px-4 pt-1.5 pb-16 space-y-2 sm:space-y-3'
        }
      >
      {faultConnectors.length > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible z-[5]"
          aria-hidden="true"
        >
          {faultConnectors.map(({ id, x1, y1, x2, y2, lane, laneCount, color }) => {
            const dx = x2 - x1;
            const absDx = Math.abs(dx);
            const laneTopBound = Math.max(y2 + 12, busTopY);
            const laneBottomBound = Math.max(laneTopBound + 4, minCardTopY - 6);
            // Invert lane vertically: lane 0 (shortest span) sits lowest near cards, outer spans arc higher above
            const visualStep = laneCount - 1 - lane;
            const rawLaneY = laneTopBound + visualStep * 7;
            const yLane = Math.min(laneBottomBound, rawLaneY);

            let linePath: string;
            if (absDx < 4) {
              linePath = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${(y2 + 1.5).toFixed(1)}`;
            } else {
              const dir = dx > 0 ? 1 : -1;
              const r = Math.min(
                10,
                absDx / 2,
                Math.max(2, (y1 - yLane) * 0.8),
                Math.max(2, (yLane - y2) * 0.45)
              );
              linePath = [
                `M ${x1.toFixed(1)} ${y1.toFixed(1)}`,
                `L ${x1.toFixed(1)} ${(yLane + r).toFixed(1)}`,
                `Q ${x1.toFixed(1)} ${yLane.toFixed(1)}, ${(x1 + dir * r).toFixed(1)} ${yLane.toFixed(1)}`,
                `L ${(x2 - dir * r).toFixed(1)} ${yLane.toFixed(1)}`,
                `Q ${x2.toFixed(1)} ${yLane.toFixed(1)}, ${x2.toFixed(1)} ${(yLane - r).toFixed(1)}`,
                `L ${x2.toFixed(1)} ${(y2 + 1.5).toFixed(1)}`,
              ].join(' ');
            }

            const roundedArrowPath = `M ${(x2 - 4).toFixed(1)} ${(y2 + 5.5).toFixed(1)} C ${(x2 - 2).toFixed(1)} ${(y2 + 2.6).toFixed(1)}, ${(x2 - 1).toFixed(1)} ${(y2 + 0.5).toFixed(1)}, ${x2.toFixed(1)} ${(y2 + 0.5).toFixed(1)} C ${(x2 + 1).toFixed(1)} ${(y2 + 0.5).toFixed(1)}, ${(x2 + 2).toFixed(1)} ${(y2 + 2.6).toFixed(1)}, ${(x2 + 4).toFixed(1)} ${(y2 + 5.5).toFixed(1)}`;

            return (
              <g key={id}>
                {/* Subtle background halo for clean separation over ticks and hour labels */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="var(--hub-bg)"
                  strokeWidth={3.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={0.75}
                />
                <path
                  d={roundedArrowPath}
                  fill="none"
                  stroke="var(--hub-bg)"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={0.75}
                />

                {/* Smooth rounded bus line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={0.9}
                />

                {/* Rounded anchor dot on open fault card */}
                <circle
                  cx={x1}
                  cy={y1}
                  r={2.8}
                  fill={color}
                  fillOpacity={0.95}
                />

                {/* Rounded arrowhead pointing to bar indicator */}
                <path
                  d={roundedArrowPath}
                  fill="none"
                  stroke={color}
                  strokeWidth={2.1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={0.95}
                />
              </g>
            );
          })}
        </svg>
      )}
      {/* Flush Shift Timeline Ruler pinned at top */}
      <div>
        <ShiftTimelineRuler
          timeline={timeline}
          fontSize={settings.rulerFontSize}
          openFaultIds={openFaultIdSet}
          newestFaultId={newestOpenFaultId}
          onSelectFault={setSelectedFault}
        />
      </div>

      {/* Error State */}
      {error && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-500/50 bg-red-500/10 p-3 sm:p-4 text-xs sm:text-sm text-red-600 dark:text-red-300"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold">Veri bağlantısı başarısız oldu</p>
              <p className="text-xs opacity-90 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Section 1: Bugünün Açık Arızaları */}
      <section
        aria-label="Bugünün Açık Arızaları"
        className="relative z-10"
        style={
          connectorTopSpacePx > 0
            ? { marginTop: `${connectorTopSpacePx}px` }
            : undefined
        }
      >
        {isLoading && todayOpenFaults.length === 0 ? (
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 sm:h-36 animate-pulse rounded-xl border border-[var(--hub-border)] bg-[var(--hub-surface)] p-4"
              />
            ))}
          </div>
        ) : todayOpenFaults.length === 0 ? (
          <div className="rounded-xl border border-[var(--hub-border)] bg-[var(--hub-surface)] px-4 py-6 text-center">
            <p className="text-xs sm:text-sm font-semibold text-[var(--hub-text)]">
              Bugün bekleyen açık arıza kaydı bulunmuyor.
            </p>
            <p className="mt-1 text-[11px] sm:text-xs text-[var(--hub-text-muted)]">
              Yeni bir arıza bildirildiğinde pano otomatik olarak güncellenecektir.
            </p>
          </div>
        ) : (
          <ScaledBlock scale={cardScale}>
          <div
            className="flex flex-wrap items-stretch gap-x-1.5 gap-y-[1.15em] sm:gap-x-2 pt-[0.85em]"
            style={{
              fontSize: `${effectiveCardFont}px`,
              lineHeight: 1.2,
              WebkitTextSizeAdjust: '100%',
              textSizeAdjust: '100%',
            }}
          >
            {todayOpenFaults.map((fault) => {
              const timeShort = fault.timePart ? fault.timePart.substring(0, 5) : '--:--';
              const shiftNumber = timeline.shiftNumberById.get(fault.id);
              const lowOpacityDark = settings.cardOpacity < 0.55 && !isLightTheme(settings.theme);
              const fgColor = lowOpacityDark ? '#f8fafc' : fault.typeInfo.fgHex;
              const mutedColor = lowOpacityDark
                ? 'rgba(248, 250, 252, 0.8)'
                : fault.typeInfo.mutedFgHex;
              const pillBorder =
                fault.typeInfo.fgHex === '#ffffff' || lowOpacityDark
                  ? 'rgba(255, 255, 255, 0.35)'
                  : 'rgba(2, 6, 23, 0.28)';

              return (
                <button
                  key={fault.id}
                  type="button"
                  data-open-fault-id={fault.id}
                  onClick={() => setSelectedFault(fault)}
                  style={{
                    backgroundColor: `rgba(${fault.typeInfo.bgRgb}, ${settings.cardOpacity})`,
                    color: fgColor,
                    borderColor: pillBorder,
                    fontSize: `${effectiveCardFont}px`,
                    lineHeight: 1.2,
                    padding: `${cardPadPx}px`,
                    gap: `${cardGapPx}px`,
                    width: 'fit-content',
                    minWidth: '10.5em',
                    maxWidth: 'min(17em, 100%)',
                    maxHeight: '999999px',
                    WebkitTextSizeAdjust: '100%',
                    textSizeAdjust: '100%',
                  }}
                  className="group relative text-left rounded-lg sm:rounded-xl border shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:brightness-95 cursor-pointer flex flex-col min-w-0"
                >
                  {shiftNumber !== undefined && (
                    <span
                      data-card-anchor-id={fault.id}
                      style={{
                        backgroundColor: `rgb(${fault.typeInfo.bgRgb})`,
                        color: fault.typeInfo.fgHex,
                        borderColor: pillBorder,
                        boxShadow: '0 0 0 2px var(--hub-bg)',
                        fontSize: '0.84em',
                      }}
                      className="absolute -top-[0.8em] left-1/2 -translate-x-1/2 z-20 inline-flex h-[1.55em] min-w-[1.55em] items-center justify-center rounded-full border px-[0.35em] font-mono font-black leading-none tabular-nums shadow-sm"
                    >
                      {shiftNumber}
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-2 w-full min-w-0">
                    <span
                      className="inline-flex items-center gap-1 font-extrabold uppercase tracking-wide min-w-0"
                      style={{ fontSize: '0.82em', color: fgColor }}
                    >
                      {renderCategoryIcon(fault.typeInfo.category)}
                      <span className="truncate">{fault.typeInfo.label}</span>
                    </span>
                    <span
                      className="font-mono font-extrabold tabular-nums px-1.5 py-[1px] rounded border shrink-0"
                      style={{
                        fontSize: '0.78em',
                        color: fgColor,
                        borderColor: pillBorder,
                        backgroundColor:
                          fault.typeInfo.fgHex === '#ffffff' || lowOpacityDark
                            ? 'rgba(0, 0, 0, 0.22)'
                            : 'rgba(255, 255, 255, 0.35)',
                      }}
                    >
                      {timeShort}
                    </span>
                  </div>

                  <div
                    className="font-extrabold truncate w-full"
                    style={{ fontSize: '1.05em', color: fgColor }}
                  >
                    {fault.machine}
                  </div>

                  <div
                    className="flex items-center justify-between gap-2 w-full min-w-0"
                    style={{ fontSize: '0.76em', color: mutedColor }}
                  >
                    <span className="font-bold truncate">Bildiren: {fault.reporter}</span>
                    {fault.shift && <span className="font-bold truncate max-w-[7em]">{fault.shift}</span>}
                  </div>

                  <p
                    className="font-extrabold leading-snug underline underline-offset-2 line-clamp-2 w-full"
                    style={{
                      fontSize: '0.92em',
                      color: fgColor,
                      maxHeight: '999999px',
                    }}
                  >
                    {fault.description}
                  </p>
                </button>
              );
            })}
          </div>
          </ScaledBlock>
        )}
      </section>

      {/* Section 2: Eski Bekleyen ve Geçmiş Kayıtlar (faded when mouse is idle, normal when mouse moves) */}
      <section
        aria-labelledby="pending-faults-heading"
        className={`space-y-2 sm:space-y-3 transition-opacity duration-300 ${
          isMenuVisible ? 'opacity-100' : 'opacity-45'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--hub-border)] pb-1.5 sm:pb-2">
          <h2
            id="pending-faults-heading"
            className="text-xs sm:text-base font-extrabold tracking-tight text-[var(--hub-text)]"
          >
            Bekleyen ve Geçmiş Kayıtlar
          </h2>
          <span className="font-mono text-[11px] sm:text-xs font-bold tabular-nums text-[var(--hub-text-muted)]">
            {pendingFaults.length} kayıt
          </span>
        </div>

        {isLoading && pendingFaults.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-10 animate-pulse rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface)]"
              />
            ))}
          </div>
        ) : groupedPending.length === 0 ? (
          <div className="rounded-xl border border-[var(--hub-border)] bg-[var(--hub-surface)] px-6 py-8 text-center">
            <p className="text-xs sm:text-sm font-semibold text-[var(--hub-text)]">
              Filtreye uygun geçmiş veya bekleyen kayıt bulunamadı.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2">
            {groupedPending.map((group) => {
              const isCollapsed = !!collapsedGroups[group.category];
              const sampleInfo = group.items[0].typeInfo;
              const lowOpacityDark = settings.cardOpacity < 0.55 && !isLightTheme(settings.theme);
              const headerFg = lowOpacityDark ? '#f8fafc' : sampleInfo.fgHex;

              return (
                <div
                  key={group.category}
                  className="overflow-hidden rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface)]"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.category)}
                    style={{
                      backgroundColor: `rgba(${sampleInfo.bgRgb}, ${settings.cardOpacity})`,
                      color: headerFg,
                    }}
                    className="flex w-full items-center justify-between gap-3 px-2.5 sm:px-3 py-1 text-left transition-all hover:brightness-95 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wide">
                        {group.title}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] sm:text-xs font-extrabold tabular-nums">
                      {group.items.length}
                    </span>
                  </button>

                  {!isCollapsed && group.category === 'planli' && (
                    <ScaledBlock scale={rowScale}>
                      <div
                        className="w-full divide-y divide-[var(--hub-border)]"
                        style={{
                          fontSize: `${effectiveRowFont}px`,
                          lineHeight: 1.2,
                          WebkitTextSizeAdjust: '100%',
                          textSizeAdjust: '100%',
                          maxHeight: '999999px',
                        }}
                      >
                        {groupPlannedByTechnician(group.items).map((techGroup) => {
                          const rem3 = techGroup.items.length % 3;
                          const fillerCountMd = rem3 === 0 ? 0 : 3 - rem3;
                          const hasOddSm = techGroup.items.length % 2 === 1;

                          return (
                            <div key={techGroup.technician} className="w-full">
                              <div
                                className="flex items-center justify-between gap-2 border-b border-[var(--hub-border)] bg-[var(--hub-surface-alt)] px-2 sm:px-3 py-1 font-bold uppercase tracking-wider text-[var(--hub-text)]"
                                style={{ fontSize: '0.88em' }}
                              >
                                <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                                  <User className="w-[1em] h-[1em] shrink-0 text-orange-500" aria-hidden="true" />
                                  <span className="truncate">{techGroup.technician}</span>
                                </span>
                                <span className="font-mono text-[0.95em] font-extrabold tabular-nums text-[var(--hub-text-muted)] shrink-0">
                                  {techGroup.items.length} kayıt
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[1px] bg-black/20 dark:bg-white/15">
                                {techGroup.items.map((item, idx) => {
                                  const rowFg = lowOpacityDark ? '#f8fafc' : item.typeInfo.fgHex;
                                  const rowMuted = lowOpacityDark
                                    ? 'rgba(248, 250, 252, 0.85)'
                                    : item.typeInfo.mutedFgHex;
                                  const rowNum = idx + 1;

                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => setSelectedFault(item)}
                                      title={`${rowNum}. ${item.datePart} ${item.timePart} · ${item.machine} · ${item.description} (${item.technician})`}
                                      style={{
                                        backgroundColor: `rgba(${item.typeInfo.bgRgb}, ${settings.cardOpacity})`,
                                        color: rowFg,
                                        fontSize: `${effectiveRowFont}px`,
                                        lineHeight: 1.2,
                                        paddingTop: `${rowPadY}px`,
                                        paddingBottom: `${rowPadY}px`,
                                        maxHeight: '999999px',
                                        WebkitTextSizeAdjust: '100%',
                                        textSizeAdjust: '100%',
                                      }}
                                      className="flex w-full items-center gap-1.5 px-2 text-left transition-all hover:brightness-95 cursor-pointer min-w-0"
                                    >
                                      <span
                                        className="font-mono font-black tabular-nums whitespace-nowrap shrink-0 leading-none"
                                        style={{ fontSize: '1.3em', fontWeight: 900 }}
                                      >
                                        {rowNum}.
                                      </span>
                                      <span
                                        className="font-mono font-bold tabular-nums whitespace-nowrap shrink-0"
                                        style={{ color: rowMuted }}
                                      >
                                        <span className="lg:hidden">
                                          {item.datePart.slice(0, 5)}
                                        </span>
                                        <span className="hidden lg:inline">
                                          {item.datePart}
                                        </span>
                                      </span>
                                      <span className="font-bold whitespace-nowrap shrink-0 opacity-90">
                                        {item.reporter}
                                      </span>
                                      <span className="font-extrabold whitespace-nowrap shrink-0 max-w-[32%] truncate">
                                        {item.machine}
                                        {item.isRecurring && (
                                          <span className="ml-1 font-mono text-[0.85em] font-extrabold opacity-80">
                                            ({item.machineFaultCount}x)
                                          </span>
                                        )}
                                      </span>
                                      <span className="font-extrabold underline underline-offset-2 min-w-0 flex-1 truncate">
                                        {item.description}
                                      </span>
                                    </button>
                                  );
                                })}

                                {hasOddSm && (
                                  <div
                                    aria-hidden="true"
                                    className="hidden sm:block md:hidden bg-[var(--hub-surface)]"
                                  />
                                )}
                                {Array.from({ length: fillerCountMd }).map((_, fIdx) => (
                                  <div
                                    key={`filler-${fIdx}`}
                                    aria-hidden="true"
                                    className="hidden md:block bg-[var(--hub-surface)]"
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScaledBlock>
                  )}

                  {!isCollapsed && group.category !== 'planli' && (
                    <ScaledBlock scale={rowScale}>
                    <div className="w-full overflow-x-auto">
                      <table
                        className="w-full border-collapse text-left"
                        style={{
                          fontSize: `${effectiveRowFont}px`,
                          lineHeight: 1.2,
                          WebkitTextSizeAdjust: '100%',
                          textSizeAdjust: '100%',
                          maxHeight: '999999px',
                        }}
                      >
                        <thead style={{ fontSize: '0.85em' }}>
                          <tr className="border-b border-[var(--hub-border)] bg-[var(--hub-surface-alt)] font-bold uppercase tracking-wider text-[var(--hub-text-muted)]">
                            <th className="px-1.5 sm:px-2.5 py-1 whitespace-nowrap">Tarih</th>
                            <th className="px-1.5 sm:px-2.5 py-1 whitespace-nowrap">Bildiren</th>
                            <th className="px-1.5 sm:px-2.5 py-1 whitespace-nowrap">Makine</th>
                            <th className="hidden md:table-cell px-2.5 py-1 whitespace-nowrap">Arıza Tipi</th>
                            <th className="px-1.5 sm:px-2.5 py-1 w-full">Arıza Açıklaması</th>
                            <th className="px-1.5 sm:px-2.5 py-1 text-right whitespace-nowrap">Görevli</th>
                          </tr>
                        </thead>
                        <tbody style={{ fontSize: '1em' }}>
                          {group.items.map((item) => {
                            const rowFg = lowOpacityDark ? '#f8fafc' : item.typeInfo.fgHex;
                            const rowMuted = lowOpacityDark
                              ? 'rgba(248, 250, 252, 0.85)'
                              : item.typeInfo.mutedFgHex;
                            const cellStyle: React.CSSProperties = {
                              fontSize: `${effectiveRowFont}px`,
                              lineHeight: 1.2,
                              paddingTop: `${rowPadY}px`,
                              paddingBottom: `${rowPadY}px`,
                              maxHeight: '999999px',
                              WebkitTextSizeAdjust: '100%',
                              textSizeAdjust: '100%',
                            };

                            return (
                              <tr
                                key={item.id}
                                onClick={() => setSelectedFault(item)}
                                style={{
                                  backgroundColor: `rgba(${item.typeInfo.bgRgb}, ${settings.cardOpacity})`,
                                  color: rowFg,
                                  borderBottom: '1px solid rgba(2, 6, 23, 0.18)',
                                }}
                                className="transition-all hover:brightness-95 cursor-pointer"
                              >
                                <td
                                  className="px-1.5 sm:px-2.5 font-mono font-bold tabular-nums whitespace-nowrap"
                                  style={{ ...cellStyle, color: rowMuted }}
                                >
                                  <span className="sm:hidden">
                                    {item.datePart.slice(0, 5)} {item.timePart.slice(0, 5)}
                                  </span>
                                  <span className="hidden sm:inline">
                                    {item.datePart} {item.timePart}
                                  </span>
                                </td>
                                <td
                                  className="px-1.5 sm:px-2.5 font-bold whitespace-nowrap"
                                  style={cellStyle}
                                >
                                  {item.reporter}
                                </td>
                                <td
                                  className="px-1.5 sm:px-2.5 font-extrabold whitespace-nowrap"
                                  style={cellStyle}
                                >
                                  {item.machine}
                                  {item.isRecurring && (
                                    <span className="ml-1 font-mono text-[0.85em] font-extrabold opacity-80">
                                      ({item.machineFaultCount}x)
                                    </span>
                                  )}
                                </td>
                                <td
                                  className="hidden md:table-cell px-2.5 font-extrabold whitespace-nowrap"
                                  style={cellStyle}
                                >
                                  {item.typeInfo.label}
                                </td>
                                <td
                                  className="px-1.5 sm:px-2.5 w-full font-extrabold underline underline-offset-2"
                                  style={cellStyle}
                                >
                                  {item.description}
                                </td>
                                <td
                                  className="px-1.5 sm:px-2.5 text-right font-extrabold whitespace-nowrap"
                                  style={cellStyle}
                                >
                                  {item.technician}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    </ScaledBlock>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
      </div>
      </ScaledBlock>

      {/* Bottom Docked KPI & Status Menu (auto-hides on mouse/touch idle) */}
      <div
        ref={bottomMenuRef}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') {
            isMenuHoveredRef.current = true;
            clearHideTimer();
          }
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') {
            isMenuHoveredRef.current = false;
            scheduleHideMenu();
          }
        }}
        aria-hidden={!isMenuVisible}
        className={`fixed bottom-2 inset-x-2 sm:inset-x-4 z-40 transition-all duration-300 ease-out ${
          isMenuVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <section
          aria-label="Anlık arıza özeti"
          className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 rounded-xl border border-[var(--hub-border)] bg-[var(--hub-surface)] px-2.5 sm:px-4 py-1.5 sm:py-2 shadow-2xl"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-5">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-[var(--hub-text-muted)]">Toplam</span>
              <span className="font-mono text-sm sm:text-lg font-extrabold tabular-nums text-[var(--hub-text)]">
                {stats.total}
              </span>
            </div>

            <div className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
              <Wrench className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Mek</span>
              <span className="font-mono text-sm sm:text-lg font-extrabold tabular-nums text-[var(--hub-text)]">
                {stats.mekanik}
              </span>
            </div>

            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Bolt className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Elek</span>
              <span className="font-mono text-sm sm:text-lg font-extrabold tabular-nums text-[var(--hub-text)]">
                {stats.elektrik}
              </span>
            </div>

            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <ShieldAlert className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">İSG</span>
              <span className="font-mono text-sm sm:text-lg font-extrabold tabular-nums text-[var(--hub-text)]">
                {stats.isg}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[var(--hub-text-muted)]">
              <History className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">Tekrar</span>
              <span className="font-mono text-sm sm:text-lg font-extrabold tabular-nums text-[var(--hub-text)]">
                {stats.recurring}
              </span>
            </div>

            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <CalendarClock className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
              <span className="text-[10px] sm:text-xs font-bold uppercase">P.Bakım</span>
              <span className="font-mono text-sm sm:text-lg font-extrabold tabular-nums text-[var(--hub-text)]">
                {stats.planli}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            <PWAInstallButton />
            <span className="font-mono text-[10px] sm:text-xs font-semibold tabular-nums text-[var(--hub-text-muted)] pr-0.5 sm:pr-1">
              {lastSyncText} · {refreshCountdown}s
            </span>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] p-1.5 sm:p-2 text-[var(--hub-text)] hover:opacity-90 disabled:opacity-60 cursor-pointer"
              title="Şimdi Yenile"
              aria-label="Şimdi Yenile"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] p-1.5 sm:p-2 text-[var(--hub-text)] hover:opacity-90 cursor-pointer"
              title="Görünüm ve Tema Ayarları"
              aria-label="Görünüm ve Tema Ayarları"
            >
              <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onToggleFullscreen}
              className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] p-1.5 sm:p-2 text-[var(--hub-text)] hover:opacity-90 cursor-pointer"
              title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
              aria-label={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </section>
      </div>

      {/* Fault Detail Modal */}
      {selectedFault && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fault-detail-title"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[var(--hub-border)] bg-[var(--hub-surface)] text-[var(--hub-text)] shadow-2xl">
            <div
              className="flex items-start justify-between gap-4 px-6 py-4"
              style={{
                backgroundColor: `rgba(${selectedFault.typeInfo.bgRgb}, 0.95)`,
                color: selectedFault.typeInfo.fgHex,
              }}
            >
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wide">
                  {selectedFault.typeInfo.label}
                </div>
                <h3 id="fault-detail-title" className="mt-1 text-lg font-extrabold">
                  {selectedFault.machine}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFault(null)}
                className="rounded-lg p-1.5 opacity-80 hover:opacity-100 cursor-pointer"
                style={{ color: selectedFault.typeInfo.fgHex }}
                aria-label="Detayı kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] p-4">
                <div className="text-xs font-semibold text-[var(--hub-text-muted)]">
                  Arıza Açıklaması
                </div>
                <p className="mt-1 font-bold leading-relaxed text-[var(--hub-text)]">
                  {selectedFault.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] p-3">
                  <div className="text-[var(--hub-text-muted)]">Tarih / Saat</div>
                  <div className="mt-1 font-mono font-bold tabular-nums">
                    {selectedFault.datePart} {selectedFault.timePart}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] p-3">
                  <div className="text-[var(--hub-text-muted)]">Bildiren / Vardiya</div>
                  <div className="mt-1 font-bold">
                    {selectedFault.reporterFull}
                    {selectedFault.shift ? ` · ${selectedFault.shift}` : ''}
                  </div>
                </div>
                <div className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] p-3">
                  <div className="text-[var(--hub-text-muted)]">Görevli Teknisyen</div>
                  <div className="mt-1 font-bold">{selectedFault.technician}</div>
                </div>
                <div className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] p-3">
                  <div className="text-[var(--hub-text-muted)]">Makine Arıza Sayısı</div>
                  <div className="mt-1 font-mono font-bold tabular-nums">
                    {selectedFault.machineFaultCount} kayıt
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end border-t border-[var(--hub-border)] pt-4">
              <button
                type="button"
                onClick={() => setSelectedFault(null)}
                className="rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] px-5 py-2 text-xs font-semibold text-[var(--hub-text)] hover:opacity-90 cursor-pointer"
              >
                Kapat
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
