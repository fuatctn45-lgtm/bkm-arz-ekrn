import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Uygulamayı Yükle</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--hub-text)] hover:bg-[var(--hub-surface-alt)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Share className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Ana Ekrana Ekle</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-xl border border-[var(--hub-border)] bg-[var(--hub-surface)] p-6 text-[var(--hub-text)] shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <h3 id="ios-install-title" className="text-base font-bold">
                  iPhone / iPad Kurulumu
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1.5 text-[var(--hub-text-muted)] hover:bg-[var(--hub-surface-alt)] cursor-pointer"
                  aria-label="Kapat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="mt-4 space-y-2 text-sm text-[var(--hub-text-muted)] list-decimal list-inside">
                <li>
                  Safari araç çubuğundaki <strong className="text-[var(--hub-text)]">Paylaş</strong> simgesine dokunun.
                </li>
                <li>
                  Aşağı kaydırıp <strong className="text-[var(--hub-text)]">Ana Ekrana Ekle</strong> seçeneğini seçin.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[var(--hub-surface-alt)] py-2.5 text-sm font-semibold text-[var(--hub-text)] hover:opacity-90 cursor-pointer"
              >
                Tamam
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
