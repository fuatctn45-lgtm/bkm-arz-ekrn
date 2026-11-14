import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import type { FaultRecord } from '../types';
import { ALERT_TIMEOUT_SEC } from '../utils/faultHelpers';

interface NewFaultAlertModalProps {
  fault: FaultRecord | null;
  onClose: () => void;
}

export const NewFaultAlertModal: React.FC<NewFaultAlertModalProps> = ({
  fault,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(ALERT_TIMEOUT_SEC);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!fault) return;

    const startedAt = Date.now();
    setTimeLeft(ALERT_TIMEOUT_SEC);

    const interval = window.setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, ALERT_TIMEOUT_SEC - elapsedSec);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        window.clearInterval(interval);
        onCloseRef.current();
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [fault]);

  if (!fault) return null;

  const progressPct = Math.max(0, Math.min(100, (timeLeft / ALERT_TIMEOUT_SEC) * 100));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="new-fault-alert-title"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border-2 border-red-500 bg-[var(--hub-surface)] p-6 sm:p-8 text-[var(--hub-text)] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hub-border)] pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-500">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="new-fault-alert-title" className="text-xl font-extrabold text-red-500">
                Yeni Arıza Kaydı
              </h2>
              <p className="text-xs text-[var(--hub-text-muted)]">
                {fault.typeInfo.label} · {fault.datePart} {fault.timePart}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/15 px-2.5 py-1.5 font-mono text-sm font-extrabold tabular-nums text-red-500"
              aria-live="polite"
            >
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>{timeLeft} sn</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[var(--hub-text-muted)] hover:bg-[var(--hub-surface-alt)] cursor-pointer"
              aria-label="Uyarıyı kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-4 rounded-lg border border-[var(--hub-border)] bg-[var(--hub-surface-alt)] p-5">
          <div>
            <div className="text-xs font-semibold text-[var(--hub-text-muted)]">Makine / Bölüm</div>
            <div className="mt-1 text-xl font-extrabold text-[var(--hub-text)]">
              {fault.machine}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-[var(--hub-text-muted)]">
              Arıza Açıklaması
            </div>
            <div className="mt-1 text-base font-bold leading-relaxed text-[var(--hub-text)] underline decoration-red-500/60 underline-offset-4">
              {fault.description}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[var(--hub-text-muted)]">
            <span>
              Bildiren: <strong className="text-[var(--hub-text)]">{fault.reporterFull}</strong>
            </span>
            {fault.shift && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  Vardiya: <strong className="text-[var(--hub-text)]">{fault.shift}</strong>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-[var(--hub-text-muted)] font-mono tabular-nums">
            Bu bildirim <strong className="text-red-500">{timeLeft}</strong> saniye içinde otomatik kapanacaktır.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-500 cursor-pointer"
          >
            Kapat ({timeLeft})
          </button>
        </div>

        {/* 30-second countdown progress bar */}
        <div
          className="absolute inset-x-0 bottom-0 h-1.5 bg-red-500/15"
          aria-hidden="true"
        >
          <div
            className="h-full bg-red-500 transition-[width] duration-300 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
};
