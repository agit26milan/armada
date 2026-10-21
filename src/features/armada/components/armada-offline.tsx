import React from "react";

interface ArmadaOfflineProps {
  onRetry: () => void;
  isFetching: boolean;
}

const ArmadaOffline = ({ onRetry, isFetching }: ArmadaOfflineProps) => {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-line bg-surface px-4 py-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        <p className="text-[13px] font-semibold text-ink dark:text-white">
          You're offline
        </p>
        <p className="text-[11.5px] text-ink-subtle">
          This page hasn't been downloaded yet. Reconnect and the vehicles will
          load automatically.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={isFetching}
        className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px] font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
      >
        {isFetching ? "Loading…" : "Try again"}
      </button>
    </div>
  );
};

export const ArmadaOfflineNotice = () => {
  return (
    <p
      role="status"
      className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
    >
      You're offline. Showing the last loaded data.
    </p>
  );
};

export default React.memo(ArmadaOffline);
