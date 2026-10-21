import React from "react";

import { isRateLimitError, getErrorView } from "@/shared/lib/error-view";

interface ArmadaErrorProps {
  error: unknown;
  onRetry: () => void;
  isFetching: boolean;
}

const ArmadaError = ({ error, onRetry, isFetching }: ArmadaErrorProps) => {
  const view = getErrorView(error, "fleet data")
  const rateLimited = isRateLimitError(error)

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
          disabled={isFetching || rateLimited}
          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11.5px] font-semibold text-ink transition-colors hover:bg-surface-muted disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
        >
          {isFetching ? "Loading…" : rateLimited ? "Wait a moment" : "Try again"}
        </button>
      ) : null}
    </div>
  );
};

export default React.memo(ArmadaError);
