import React from "react";

interface ArmadaErrorProps {
  onRetry: () => void;
  isFetching: boolean;
}

const ArmadaError = ({ onRetry, isFetching }: ArmadaErrorProps) => {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-line bg-surface px-4 py-5 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <p className="text-[13px] font-semibold text-ink dark:text-white">
          Failed to load fleet data
        </p>
        <p className="text-[11.5px] text-ink-subtle">
          Check your connection or reload this page.
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

export default React.memo(ArmadaError);
