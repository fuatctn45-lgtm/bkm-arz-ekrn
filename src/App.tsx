import { useCallback, useEffect, useRef, useState } from 'react';
import { DashboardView } from './components/DashboardView';
import { NewFaultAlertModal } from './components/NewFaultAlertModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SettingsModal } from './components/SettingsModal';
import type {
  ApiConfig,
  DashboardStats,
  DisplaySettings,
  FaultRecord,
  ThemePreset,
} from './types';
import {
  DEFAULT_DASHBOARD_API_URL,
  DEFAULT_DISPLAY_SETTINGS,
  playAlertChime,
  processDashboardRows,
  REFRESH_INTERVAL_SEC,
} from './utils/faultHelpers';

function readStoredSettings(): DisplaySettings {
  try {
    const raw = localStorage.getItem('hub-display-settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_DISPLAY_SETTINGS,
        ...parsed,
        cardFontSize: Number.isFinite(parsed.cardFontSize) ? Math.max(4, parsed.cardFontSize) : DEFAULT_DISPLAY_SETTINGS.cardFontSize,
        rowFontSize: Number.isFinite(parsed.rowFontSize) ? Math.max(4, parsed.rowFontSize) : DEFAULT_DISPLAY_SETTINGS.rowFontSize,
        rulerFontSize: Number.isFinite(parsed.rulerFontSize) ? Math.max(4, parsed.rulerFontSize) : DEFAULT_DISPLAY_SETTINGS.rulerFontSize,
      };
    }
    const legacyTheme = (localStorage.getItem('hub-theme') as ThemePreset) || 'dark';
    const legacyCardFs = parseFloat(localStorage.getItem('hub-card-fs') || '14');
    const legacyRowFs = parseFloat(localStorage.getItem('hub-row-fs') || '12');
    const legacyOpacity = parseFloat(localStorage.getItem('hub-card-opacity') || '1');
    const legacyScale = parseFloat(localStorage.getItem('hub-scale') || '1');
    return {
      ...DEFAULT_DISPLAY_SETTINGS,
      theme: ['dark', 'blue', 'gray', 'white'].includes(legacyTheme) ? legacyTheme : 'dark',
      cardFontSize: Number.isFinite(legacyCardFs) ? Math.max(4, legacyCardFs) : 14,
      rowFontSize: Number.isFinite(legacyRowFs) ? Math.max(4, legacyRowFs) : 12,
      cardOpacity: Number.isFinite(legacyOpacity) ? legacyOpacity : 1,
      pageScale: Number.isFinite(legacyScale) ? legacyScale : 1,
    };
  } catch {
    return DEFAULT_DISPLAY_SETTINGS;
  }
}

function readStoredApiConfig(): ApiConfig {
  try {
    const raw = localStorage.getItem('hub-api-config');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        dashboardUrl: parsed.dashboardUrl || DEFAULT_DASHBOARD_API_URL,
      };
    }
  } catch {
    // fallback to defaults
  }
  return {
    dashboardUrl: DEFAULT_DASHBOARD_API_URL,
  };
}

function applyThemeToDocument(theme: ThemePreset, settings: DisplaySettings) {
  const root = document.documentElement;
  if (theme === 'white') {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  } else {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  }
  root.setAttribute('data-hub-theme', theme);
  root.style.setProperty('--hub-font-family', `'${settings.fontFamily}', sans-serif`);
  document.body.setAttribute('data-thickness', settings.fontWeight);
}

export default function App() {
  const [settings, setSettings] = useState<DisplaySettings>(readStoredSettings);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(readStoredApiConfig);

  const [todayOpenFaults, setTodayOpenFaults] = useState<FaultRecord[]>([]);
  const [pendingFaults, setPendingFaults] = useState<FaultRecord[]>([]);
  const [allFaults, setAllFaults] = useState<FaultRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    mekanik: 0,
    elektrik: 0,
    isg: 0,
    recurring: 0,
    planli: 0,
    unassignedTotal: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncText, setLastSyncText] = useState<string>('SON: --:--:--');
  const [refreshCountdown, setRefreshCountdown] = useState<number>(REFRESH_INTERVAL_SEC);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [previewSettings, setPreviewSettings] = useState<DisplaySettings | null>(null);
  const [alertFault, setAlertFault] = useState<FaultRecord | null>(null);

  const activeSettings = previewSettings ?? settings;

  const settingsRef = useRef(settings);
  settingsRef.current = activeSettings;

  useEffect(() => {
    applyThemeToDocument(activeSettings.theme, activeSettings);
  }, [activeSettings]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const separator = apiConfig.dashboardUrl.includes('?') ? '&' : '?';
      const res = await fetch(`${apiConfig.dashboardUrl}${separator}_t=${Date.now()}`);
      if (!res.ok) throw new Error(`Ağ hatası: ${res.status}`);

      const text = await res.text();
      if (text.startsWith('<')) {
        throw new Error(
          "Google Giriş Ekranı geldi! Makro yetkisi 'Herkes (Anyone)' olarak ayarlanmamış."
        );
      }

      const data = JSON.parse(text);
      let rawRows: unknown = data;
      if (data && data.arizalar) {
        rawRows = data.arizalar;
      } else if (data && Array.isArray(data.value)) {
        rawRows = data.value;
      }

      let savedKeys: string[] = [];
      try {
        savedKeys = JSON.parse(localStorage.getItem('hub-alerts') || '[]');
      } catch {
        savedKeys = [];
      }
      const prevSet = new Set<string>(savedKeys);
      const wasMemoryEmpty = savedKeys.length === 0;

      const processed = processDashboardRows(rawRows, prevSet, wasMemoryEmpty);
      setTodayOpenFaults(processed.todayOpenFaults);
      setPendingFaults(processed.pendingFaults);
      setAllFaults(processed.allFaults);
      setStats(processed.stats);

      localStorage.setItem('hub-alerts', JSON.stringify(processed.allKeys));

      if (processed.latestAlertCandidate) {
        setAlertFault((prev) => prev || processed.latestAlertCandidate);
        if (settingsRef.current.soundEnabled) {
          playAlertChime();
        }
      }

      const nowStr = new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSyncText(`SON: ${nowStr}`);
      setRefreshCountdown(REFRESH_INTERVAL_SEC);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri bağlantısı başarısız oldu.');
      setLastSyncText('BAĞLANTI HATASI');
    } finally {
      setIsLoading(false);
    }
  }, [apiConfig.dashboardUrl]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchDashboardData();
          return REFRESH_INTERVAL_SEC;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSaveSettings = (nextSettings: DisplaySettings, nextApiConfig: ApiConfig) => {
    setSettings(nextSettings);
    setPreviewSettings(null);
    setApiConfig(nextApiConfig);
    localStorage.setItem('hub-display-settings', JSON.stringify(nextSettings));
    localStorage.setItem('hub-api-config', JSON.stringify(nextApiConfig));
    setIsSettingsOpen(false);
  };

  const handleCloseSettings = () => {
    setPreviewSettings(null);
    setIsSettingsOpen(false);
  };

  const handlePreviewSettings = (nextSettings: DisplaySettings) => {
    setPreviewSettings(nextSettings);
  };

  const handleCloseAlert = useCallback(() => {
    setAlertFault(null);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--hub-bg)] text-[var(--hub-text)] transition-colors duration-150">
      <main>
        <DashboardView
          todayOpenFaults={todayOpenFaults}
          pendingFaults={pendingFaults}
          allFaults={allFaults}
          stats={stats}
          isLoading={isLoading}
          error={error}
          lastSyncText={lastSyncText}
          refreshCountdown={refreshCountdown}
          isFullscreen={isFullscreen}
          settings={activeSettings}
          onRefresh={fetchDashboardData}
          onToggleFullscreen={handleToggleFullscreen}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        apiConfig={apiConfig}
        onClose={handleCloseSettings}
        onSave={handleSaveSettings}
        onPreviewSettings={handlePreviewSettings}
      />

      <NewFaultAlertModal
        fault={alertFault}
        onClose={handleCloseAlert}
      />

      <OfflineIndicator />
    </div>
  );
}
