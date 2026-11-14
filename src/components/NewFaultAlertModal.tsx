import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
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

  useEffect(() => {
    if (!fault) return;
    setTimeLeft(ALERT_TIMEOUT_SEC);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fault, onClose]);

  if (!fault) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="new-fault-alert-title"
    >
      <div className="w-full max-w-xl rounded-xl border-2 border-red-500 bg-[var(--hub-surface)] p-6 sm:p-8 text-[var(--hub-text)] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--hub-border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-500/15 text-red-500">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 id="new-fault-alert-title" className="text-xl font-extrabold text-red-500">
                Yeni Arıza Kaydı
              </h2>
              <p className="text-xs text-[var(--hub-text-muted)]">
                {fault.typeInfo.label} · {fault.datePart} {fault.timePart}
              </p>
            </div>
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
            Bu uyarı {timeLeft} saniye içinde kapanacaktır.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-500 cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
