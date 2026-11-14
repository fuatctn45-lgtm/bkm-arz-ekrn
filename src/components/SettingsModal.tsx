import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Minus, Plus, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import type {
  ApiConfig,
  DisplaySettings,
  FontFamilyPreset,
  FontWeightPreset,
  ThemePreset,
} from '../types';
import {
  DEFAULT_DASHBOARD_API_URL,
  DEFAULT_DISPLAY_SETTINGS,
} from '../utils/faultHelpers';

interface SettingsModalProps {
  isOpen: boolean;
  settings: DisplaySettings;
  apiConfig: ApiConfig;
  onClose: () => void;
  onSave: (nextSettings: DisplaySettings, nextApiConfig: ApiConfig) => void;
  onPreviewSettings: (nextSettings: DisplaySettings) => void;
}

const THEME_OPTIONS: { id: ThemePreset; label: string; swatch: string }[] = [
  { id: 'dark', label: 'Koyu Tema', swatch: '#020617' },
  { id: 'blue', label: 'Lacivert Tema', swatch: '#082f49' },
  { id: 'gray', label: 'Gri Tema', swatch: '#1e293b' },
  { id: 'white', label: 'Beyaz Tema', swatch: '#f1f5f9' },
];

const MIN_FONT_SIZE = 4;
const MAX_FONT_SIZE = 24;

function clampFontSize(val: number): number {
  const rounded = Math.round(val * 2) / 2;
  return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, rounded));
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  apiConfig,
  onClose,
  onSave,
  onPreviewSettings,
}) => {
  const [draft, setDraft] = useState<DisplaySettings>(settings);
  const [draftApi, setDraftApi] = useState<ApiConfig>(apiConfig);
  const [showApiSection, setShowApiSection] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(settings);
      setDraftApi(apiConfig);
      setShowApiSection(false);
    }
  }, [isOpen, settings, apiConfig]);

  if (!isOpen) return null;

  const updateDraft = (updater: (prev: DisplaySettings) => DisplaySettings) => {
    setDraft((prev) => {
      const next = updater(prev);
      onPreviewSettings(next);
      return next;
    });
  };

  const handleCancel = () => {
    onClose();
  };

  const handleReset = () => {
    setDraft(DEFAULT_DISPLAY_SETTINGS);
    onPreviewSettings(DEFAULT_DISPLAY_SETTINGS);
    setDraftApi({
      dashboardUrl: DEFAULT_DASHBOARD_API_URL,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-2.5 sm:p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-xl border border-[var(--hub-border)] bg-[var(--hub-surface)] p-4 sm:p-6 text-[var(--hub-text)] shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--hub-border)] pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <SlidersHorizontal className="w-5 h-5 text-cyan-500 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h2 id="settings-modal-title" className="text-sm sm:text-base font-bold truncate">
                Görünüm ve Pano Ayarları
              </h2>
              <p className="text-[11px] sm:text-xs text-[var(--hub-text-muted)] truncate">
                Ekran ölçeği, tema ve yazı boyutlarını özelleştirin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg p-2 text-[var(--hub-text-muted)] hover:bg-[var(--hub-surface-alt)] cursor-pointer shrink-0"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 sm:space-y-5">
          <div>
            <div className="text-xs font-bold text-[var(--hub-text)] mb-2">Hızlı Ekran Modu</div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  updateDraft((prev) => ({
                    ...prev,
                    pageScale: 0.6,
                    cardFontSize: 10,
                    rowFontSize: 8.5,
                  }))
                }
                className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  draft.pageScale <= 0.7
                    ? 'border-cyan-500 bg-cyan-500/15 text-[var(--hub-text)]'
                    : 'border-[var(--hub-border)] bg-[var(--hub-surface-alt)] text-[var(--hub-text-muted)] hover:text-[var(--hub-text)]'
                }`}
              >
                TV Modu
              </button>
              <button
                type="button"
                onClick={() =>
                  updateDraft((prev) => ({
                    ...prev,
                    pageScale: 1,
                    cardFontSize: 14,
                    rowFontSize: 12,
                  }))
                }
                className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  draft.pageScale === 1 && draft.rowFontSize >= 11
                    ? 'border-cyan-500 bg-cyan-500/15 text-[var(--hub-text)]'
                    : 'border-[var(--hub-border)] bg-[var(--hub-surface-alt)] text-[var(--hub-text-muted)] hover:text-[var(--hub-text)]'
                }`}
              >
                Standart
              </button>
              <button
                type="button"
                onClick={() =>
                  updateDraft((prev) => ({
                    ...prev,
                    pageScale: 0.85,
                    cardFontSize: 10,
                    rowFontSize: 9,
                  }))
                }
                className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  draft.pageScale === 0.85
                    ? 'border-cyan-500 bg-cyan-500/15 text-[var(--hub-text)]'
                    : 'border-[var(--hub-border)] bg-[var(--hub-surface-alt)] text-[var(--hub-text-muted)] hover:text-[var(--hub-text)]'
                }`}
              >
                Android Mobil
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-[var(--hub-text)] mb-2">Arka Plan Teması</div>
            <div className="grid grid-cols-2 gap-2">
              {THEME_OPTIONS.map((t) => {
                const active = draft.theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => updateDraft((prev) => ({ ...prev, theme: t.id }))}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'border-cyan-500 bg-cyan-500/10 text-[var(--hub-text)]'
                        : 'border-[var(--hub-border)] bg-[var(--hub-surface-alt)] text-[var(--hub-text-muted)] hover:text-[var(--hub-text)]'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-slate-400/50 shrink-0"
                      style={{ backgroundColor: t.swatch }}
                    />
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label
                htmlFor="settings-font-family"
                className="block text-xs font-bold text-[var(--hub-text)] mb-1.5"
              >
                Yazı Tipi
              </label>
              <select
                id="settings-font-family"
                value={draft.fontFamily}
                onChange={(e) =>
                  updateDraft((prev) => ({
                    ...prev,
                    fontFamily: e.target.value as FontFamilyPreset,
                  }))
                }
                className="w-full rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] px-2.5 py-2 text-xs font-semibold text-[var(--hub-text)] outline-none focus:border-cyan-500"
              >
                <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                <option value="Outfit">Outfit</option>
                <option value="Manrope">Manrope</option>
                <option value="DM Sans">DM Sans</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="settings-font-weight"
                className="block text-xs font-bold text-[var(--hub-text)] mb-1.5"
              >
                Yazı Kalınlığı
              </label>
              <select
                id="settings-font-weight"
                value={draft.fontWeight}
                onChange={(e) =>
                  updateDraft((prev) => ({
                    ...prev,
                    fontWeight: e.target.value as FontWeightPreset,
                  }))
                }
                className="w-full rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] px-2.5 py-2 text-xs font-semibold text-[var(--hub-text)] outline-none focus:border-cyan-500"
              >
                <option value="normal">Standart</option>
                <option value="thin">İnce</option>
                <option value="thick">Ekstra Kalın</option>
              </select>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <label htmlFor="card-fs-range">Kart Yazı Boyutu (4–24px)</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft((prev) => ({
                        ...prev,
                        cardFontSize: clampFontSize(prev.cardFontSize - 0.5),
                      }))
                    }
                    aria-label="Kart yazı boyutunu küçült"
                    className="flex h-7 w-7 items-center justify-center rounded border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] text-[var(--hub-text)] active:scale-95 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="min-w-[42px] text-center font-mono tabular-nums text-[var(--hub-text)]">
                    {draft.cardFontSize}px
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft((prev) => ({
                        ...prev,
                        cardFontSize: clampFontSize(prev.cardFontSize + 0.5),
                      }))
                    }
                    aria-label="Kart yazı boyutunu büyüt"
                    className="flex h-7 w-7 items-center justify-center rounded border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] text-[var(--hub-text)] active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <input
                id="card-fs-range"
                type="range"
                min={MIN_FONT_SIZE}
                max={MAX_FONT_SIZE}
                step={0.5}
                value={draft.cardFontSize}
                onChange={(e) =>
                  updateDraft((prev) => ({
                    ...prev,
                    cardFontSize: clampFontSize(parseFloat(e.target.value)),
                  }))
                }
                className="w-full h-6 accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <label htmlFor="row-fs-range">Satır Yazı Boyutu (4–24px)</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft((prev) => ({
                        ...prev,
                        rowFontSize: clampFontSize(prev.rowFontSize - 0.5),
                      }))
                    }
                    aria-label="Satır yazı boyutunu küçült"
                    className="flex h-7 w-7 items-center justify-center rounded border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] text-[var(--hub-text)] active:scale-95 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="min-w-[42px] text-center font-mono tabular-nums text-[var(--hub-text)]">
                    {draft.rowFontSize}px
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft((prev) => ({
                        ...prev,
                        rowFontSize: clampFontSize(prev.rowFontSize + 0.5),
                      }))
                    }
                    aria-label="Satır yazı boyutunu büyüt"
                    className="flex h-7 w-7 items-center justify-center rounded border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] text-[var(--hub-text)] active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <input
                id="row-fs-range"
                type="range"
                min={MIN_FONT_SIZE}
                max={MAX_FONT_SIZE}
                step={0.5}
                value={draft.rowFontSize}
                onChange={(e) =>
                  updateDraft((prev) => ({
                    ...prev,
                    rowFontSize: clampFontSize(parseFloat(e.target.value)),
                  }))
                }
                className="w-full h-6 accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <label htmlFor="opacity-range">Kart Opaklığı</label>
                <span className="font-mono tabular-nums text-[var(--hub-text-muted)]">
                  {Math.round(draft.cardOpacity * 100)}%
                </span>
              </div>
              <input
                id="opacity-range"
                type="range"
                min={0.4}
                max={1}
                step={0.05}
                value={draft.cardOpacity}
                onChange={(e) =>
                  updateDraft((prev) => ({ ...prev, cardOpacity: parseFloat(e.target.value) }))
                }
                className="w-full h-6 accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 items-end">
            <div>
              <label
                htmlFor="settings-scale"
                className="block text-xs font-bold text-[var(--hub-text)] mb-1.5"
              >
                Sayfa Ölçeği
              </label>
              <select
                id="settings-scale"
                value={draft.pageScale}
                onChange={(e) =>
                  updateDraft((prev) => ({ ...prev, pageScale: parseFloat(e.target.value) }))
                }
                className="w-full rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] px-2.5 py-2 text-xs font-semibold text-[var(--hub-text)] outline-none focus:border-cyan-500"
              >
                <option value={0.35}>35%</option>
                <option value={0.4}>40%</option>
                <option value={0.5}>50%</option>
                <option value={0.6}>60% (TV)</option>
                <option value={0.7}>70%</option>
                <option value={0.75}>75%</option>
                <option value={0.85}>85%</option>
                <option value={0.9}>90%</option>
                <option value={1}>100%</option>
                <option value={1.15}>115%</option>
                <option value={1.25}>125%</option>
                <option value={1.5}>150%</option>
              </select>
            </div>

            <label className="flex items-center justify-between gap-2 rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] px-3 py-2 cursor-pointer">
              <span className="text-xs font-semibold">Uyarı Sesi</span>
              <input
                type="checkbox"
                checked={draft.soundEnabled}
                onChange={(e) =>
                  updateDraft((prev) => ({ ...prev, soundEnabled: e.target.checked }))
                }
                className="h-4 w-4 accent-cyan-500 cursor-pointer"
              />
            </label>
          </div>

          <div className="border-t border-[var(--hub-border)] pt-3">
            <button
              type="button"
              onClick={() => setShowApiSection((prev) => !prev)}
              className="flex w-full items-center justify-between text-xs font-bold text-[var(--hub-text-muted)] hover:text-[var(--hub-text)] cursor-pointer"
            >
              <span>Veri Kaynağı Bağlantısı</span>
              {showApiSection ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showApiSection && (
              <div className="mt-3 space-y-2">
                <label
                  htmlFor="api-dashboard-url"
                  className="block text-[11px] font-semibold text-[var(--hub-text-muted)]"
                >
                  Canlı Pano API URL (Google Apps Script)
                </label>
                <input
                  id="api-dashboard-url"
                  type="url"
                  value={draftApi.dashboardUrl}
                  onChange={(e) =>
                    setDraftApi((prev) => ({ ...prev, dashboardUrl: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] px-3 py-2 font-mono text-[11px] text-[var(--hub-text)] outline-none focus:border-cyan-500"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-[var(--hub-border)] pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] px-3 py-2.5 text-xs font-semibold text-[var(--hub-text-muted)] hover:text-[var(--hub-text)] cursor-pointer"
            title="Varsayılana Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sıfırla</span>
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] px-4 py-2.5 text-xs font-semibold text-[var(--hub-text)] hover:opacity-90 cursor-pointer"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={() => onSave(draft, draftApi)}
            className="flex-[1.5] rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 cursor-pointer"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

