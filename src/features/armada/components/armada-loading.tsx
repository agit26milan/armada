import React from "react";

const ArmadaLoading = () => {
  return (
    <div className="flex animate-pulse flex-col gap-[7px] rounded-xl border border-line bg-surface px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <div className="size-[18px] rounded-[5px] bg-surface-muted dark:bg-slate-800" />
        <div className="h-2.5 w-32 rounded-full bg-surface-muted dark:bg-slate-800" />
        <div className="ml-auto h-2.5 w-20 rounded-full bg-surface-muted dark:bg-slate-800" />
      </div>
      <div className="h-5 w-16 rounded bg-surface-muted dark:bg-slate-800" />
      <div className="h-2 w-28 rounded-full bg-surface-muted dark:bg-slate-800" />
      <div className="h-2.5 w-full rounded-full bg-surface-muted dark:bg-slate-800" />
      <div className="flex items-center justify-between">
        <div className="h-2 w-14 rounded-full bg-surface-muted dark:bg-slate-800" />
        <div className="h-2 w-12 rounded-full bg-surface-muted dark:bg-slate-800" />
      </div>
    </div>
  );
};

export default React.memo(ArmadaLoading);
