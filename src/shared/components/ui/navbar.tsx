import { memo, type ReactNode } from "react";

import { MoonIcon, SunIcon } from "@/shared/components/icons";
import { useDarkMode } from "@/shared/hooks/use-dark-mode";
import { cn } from "@/shared/lib/cn";
export interface NavbarProps {
  title: string;
  actions?: ReactNode;
  sticky?: boolean;
  className?: string;
  logo?: string;
}

function NavbarBase({ title, actions, sticky = false, className, logo }: NavbarProps) {
  const { isDark, toggleMode } = useDarkMode();

  return (
    <header
      className={cn(
        "border-b border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900",
        sticky && "sticky top-0 z-30",
        className,
      )}
    >
      <div className="mx-auto flex h-[78px] w-full max-w-[1180px] items-center gap-3 px-[22px] md:h-11 md:gap-0 md:px-6">
        <div className="flex min-w-0 items-center gap-3 md:gap-2.5">
          <div className="min-w-0">
            {logo && <img src={logo} alt={title} className="size-20" />}
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-3 md:gap-2">
          {actions}

          <button
            type="button"
            onClick={toggleMode}
            aria-label={isDark ? "Enable light mode" : "Enable dark mode"}
            aria-pressed={isDark}
            title={isDark ? "Light mode" : "Dark mode"}
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-slate-900 transition-colors hover:bg-slate-50 active:translate-y-px",
              "md:size-[26px] md:rounded-[7px]",
              "dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800",
            )}
          >
            {isDark ? (
              <SunIcon className="size-[18px] md:size-[13px]" />
            ) : (
              <MoonIcon className="size-[18px] md:size-[13px]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export const Navbar = memo(NavbarBase);

Navbar.displayName = "Navbar";
