import React from "react";
import { useEffect, useRef, useState } from "react";

import { getErrorView, getRateLimitCooldownMs } from "@/shared/lib/error-view";

interface ArmadaErrorProps {
  error: unknown;
  onRetry: () => void;
  onCooldownEnd?: () => void;
  isFetching: boolean;
}

const ArmadaError = ({ error, onRetry, onCooldownEnd, isFetching }: ArmadaErrorProps) => {
  const view = getErrorView(error, "fleet data");
  const cooldownMs = getRateLimitCooldownMs(error);
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    cooldownMs === null ? 0 : Math.ceil(cooldownMs / 1000),
  );
  const autoRetriedRef = useRef<unknown>(null);

  useEffect(() => {
    if (cooldownMs === null) {
      setRemainingSeconds(0);

      return;
    }

    const deadline = Date.now() + cooldownMs;
    let timer = 0;

    setRemainingSeconds(Math.ceil(cooldownMs / 1000));

    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));

      setRemainingSeconds(next);

      if (next === 0) {
        window.clearInterval(timer);
      }
    };

    timer = window.setInterval(tick, 500);

    return () => window.clearInterval(timer);
  }, [cooldownMs, error]);

  useEffect(() => {
    if (cooldownMs === null || remainingSeconds > 0) {
      return;
    }

    if (autoRetriedRef.current === error) {
      return;
    }

    autoRetriedRef.current = error;
    onCooldownEnd?.();
  }, [cooldownMs, error, onCooldownEnd, remainingSeconds]);

  const waiting = remainingSeconds > 0;
  const label = isFetching
    ? "Loading…"
    : waiting
      ? `Try again in ${remainingSeconds}s`
      : "Try again";

  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-line bg-surface px-4 py-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        <p className="text-[13px] font-semibold text-ink dark:text-white">
          {view.title}
        </p>
        <p className="text-[11.5px] text-ink-subtle">{view.description}</p>
      </div>
      {view.canRetry ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={isFetching || waiting}
          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px] font-semibold text-ink tabular-nums transition-colors hover:bg-surface-muted disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
        >
          {label}
        </button>
      ) : null}
    </div>
  );
};

export default React.memo(ArmadaError);
