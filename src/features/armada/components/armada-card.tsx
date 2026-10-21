import { memo } from "react";
import type { KeyboardEvent } from "react";

import { ArrowUpRightIcon } from "@/shared/components/icons";
import { cn } from "@/shared/lib/cn";

import {
  formatCoordinates,
  formatRelativeTime,
  getDirectionLabel,
  getOccupancyView,
  getStatusView,
  getStopLabel,
} from "../lib/vehicle-view";
import type { Route, Stop, Vehicle } from "../types/armada";
import type { VehicleTone } from "../lib/vehicle-view";

export interface ArmadaCardProps {
  vehicle: Vehicle;
  route?: Route;
  stop?: Stop;
  className?: string;
  onDetailClick?: () => void;
}

const STATUS_TONE_CLASSES: Record<VehicleTone, string> = {
  neutral: "text-ink-muted dark:text-slate-300",
  amber:
    "rounded-full bg-amber-100 px-2 py-[3px] text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  blue: "rounded-full bg-blue-100 px-2 py-[3px] text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  green: "text-ink-muted dark:text-slate-300",
  red: "text-ink-muted dark:text-slate-300",
};

const STATUS_DOT_CLASSES: Record<VehicleTone, string> = {
  neutral: "bg-slate-900 dark:bg-slate-200",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
};

const OCCUPANCY_DOT_CLASSES: Record<VehicleTone, string> = {
  neutral: "bg-slate-300 dark:bg-slate-600",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
};

function ArmadaCardBase({ vehicle, route, stop, className, onDetailClick }: ArmadaCardProps) {
  const { attributes, id } = vehicle;
  const routeId = vehicle.relationships.route.data.id;
  const routeShortName = route?.attributes.short_name || route?.id || routeId;
  const routeTitle =
    route?.attributes.long_name || routeShortName || "Route unavailable";
  const showRouteBadge =
    routeShortName.length > 0 && routeShortName.length <= 3;
  const directionId = attributes.direction_id;
  const direction =
    route?.attributes.direction_names?.[directionId] ||
    getDirectionLabel(directionId);
  const destination =
    route?.attributes.direction_destinations?.[directionId] ?? null;

  const status = getStatusView(attributes.current_status);
  const occupancy = getOccupancyView(attributes.occupancy_status);
  const vehicleLabel = attributes.label || id;
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onDetailClick?.();
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Vehicle ${vehicleLabel}. Open details.`}
      onClick={onDetailClick}
      onKeyDown={onDetailClick ? handleKeyDown : undefined}
      className={cn(
        "flex cursor-pointer flex-col gap-[7px] rounded-xl border border-line bg-surface px-3 py-2.5 shadow-card",
        "dark:border-slate-800 dark:bg-slate-900",
        "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        {showRouteBadge ? (
          <span className="grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-[5px] bg-surface-muted px-1 text-[10px] font-bold text-ink dark:bg-slate-800 dark:text-slate-100">
            {routeShortName}
          </span>
        ) : null}

        <p className="min-w-0 truncate text-[11.5px] font-semibold text-ink-muted dark:text-slate-300">
          {routeTitle}
        </p>

        <span
          className={cn(
            "ml-auto flex shrink-0 items-center gap-1.5 text-[10.5px] font-medium whitespace-nowrap",
            STATUS_TONE_CLASSES[status.tone],
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              STATUS_DOT_CLASSES[status.tone],
            )}
          />
          {status.label}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-[19px] leading-none font-bold tracking-[-0.015em] text-ink tabular-nums dark:text-white">
          {vehicleLabel}
        </p>
        <p className="shrink-0 truncate text-[10px] text-ink-subtle tabular-nums">
          {id}
        </p>
      </div>

      <p className="text-[10px] text-ink-subtle tabular-nums">
        {formatCoordinates(attributes.latitude, attributes.longitude)}
      </p>

      <div className="mt-auto flex items-center gap-2.5 text-[10.5px]">
        <span className="inline-flex min-w-0 flex-1 items-center gap-1 text-ink-muted dark:text-slate-300">
          <ArrowUpRightIcon className="size-2.5 shrink-0" />
          <span className="truncate">
            {destination ? `${direction} → ${destination}` : direction}
          </span>
        </span>

        <span className="inline-flex shrink-0 items-center gap-1.5 text-ink-subtle">
          <span
            className={cn(
              "size-1.5 rounded-full",
              OCCUPANCY_DOT_CLASSES[occupancy.tone],
            )}
          />
          <span className="truncate">{occupancy.label}</span>
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 text-[10px] text-ink-subtle">
        <span className="truncate">
          {stop?.attributes.name ?? getStopLabel(vehicle)}
        </span>
        <span className="shrink-0 tabular-nums">
          {formatRelativeTime(attributes.updated_at)}
        </span>
      </div>
    </article>
  );
}

export const ArmadaCard = memo(ArmadaCardBase);

ArmadaCard.displayName = "ArmadaCard";
