import { useQuery } from "@tanstack/react-query";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";

import { ArrowUpRightIcon } from "@/shared/components/icons";
import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";
import { cn } from "@/shared/lib/cn";

import {
  detailVehicleQueryOptions,
  routeQueryOptions,
  stopQueryOptions,
  tripQueryOptions,
} from "../api/armada.queries";
import {
  formatBearing,
  formatClock,
  formatCoordinate,
  formatRelativeTime,
  formatSpeed,
  getBikeLabel,
  getDirectionLabel,
  getOccupancyView,
  getRevenueLabel,
  getRouteColor,
  getRouteTypeLabel,
  getStatusView,
  getWheelchairLabel,
} from "../lib/vehicle-view";
import type { VehicleTone } from "../lib/vehicle-view";
import {
  DEFAULT_MAP_ZOOM,
  MAX_MAP_ZOOM,
  MIN_MAP_ZOOM,
  TILE_SIZE,
  getMapLayout,
  getTileUrl,
  project,
  unproject,
} from "../lib/map-projection";
import type { LatLng } from "../lib/map-projection";
import type { Route, Stop, Trip, Vehicle } from "../types/armada";

const FALLBACK_ROUTE_COLOR = "#FFC72C";

const DOT_TONE_CLASSES: Record<VehicleTone, string> = {
  neutral: "bg-slate-900 dark:bg-slate-200",
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
};

const MAP_GRID_CLASSES =
  "bg-[linear-gradient(to_right,rgba(148,163,184,0.28)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.28)_1px,transparent_1px)]";

const MAP_GRID_SIZE = 28;

const MAP_ZOOM_STEP = 1;

const MAP_HEIGHT_CLASSES = "h-56 sm:h-[300px]";

const HEADING_RAY_LENGTH = 84;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);

    return true;
  } catch {
    try {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();

      return copied;
    } catch {
      return false;
    }
  }
}

interface ArmadaDetailProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
}

interface DetailRowProps {
  label: string;
  value: ReactNode;
  mono?: boolean;
  pending?: boolean;
}

interface DetailSectionProps {
  title: string;
  children: ReactNode;
}

interface ToneValueProps {
  tone: VehicleTone;
  label: string;
}

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  bearing: number | null | undefined;
  routeColor: string;
}

interface VehicleOverviewProps {
  vehicle: Vehicle;
  route?: Route;
  trip?: Trip;
  stop?: Stop;
  isRelatedLoading: boolean;
}

function SkeletonBar({ className }: { className?: string }) {
  return (
    <span
      className={cn("block animate-pulse rounded-full bg-surface-muted", className)}
    />
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-surface-muted px-1 py-px font-mono text-[10px] text-ink-muted">
      {children}
    </code>
  );
}

function ToneDot({ tone }: { tone: VehicleTone }) {
  return (
    <span
      className={cn("size-1.5 shrink-0 rounded-full", DOT_TONE_CLASSES[tone])}
      aria-hidden="true"
    />
  );
}

function ToneValue({ tone, label }: ToneValueProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <ToneDot tone={tone} />
      {label}
    </span>
  );
}

function DetailRow({ label, value, mono = false, pending = false }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-[3px]">
      <dt className="shrink-0 text-[11px] leading-4 text-ink-subtle">{label}</dt>
      <dd
        className={cn(
          "min-w-0 text-right text-[11.5px] leading-4 font-semibold text-ink dark:text-slate-100",
          mono && "font-mono text-[11px] font-medium",
        )}
      >
        {pending ? <SkeletonBar className="ml-auto h-2.5 w-20" /> : value}
      </dd>
    </div>
  );
}

function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <section className="border-t border-line pt-3 first:border-t-0 first:pt-0">
      <h3 className="mb-1 text-[10px] font-bold tracking-[0.08em] text-ink-subtle uppercase">
        {title}
      </h3>
      <dl>{children}</dl>
    </section>
  );
}

function MapPreview({ latitude, longitude, bearing, routeColor }: MapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: LatLng;
  } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState<number>(DEFAULT_MAP_ZOOM);
  const [center, setCenter] = useState<LatLng>({ latitude, longitude });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;

      if (!rect) {
        return;
      }

      setSize({ width: rect.width, height: rect.height });
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const width = Math.round(size.width);
  const height = Math.round(size.height);
  const isReady = width > 0 && height > 0;
  const layout = isReady
    ? getMapLayout(center, zoom, width, height)
    : { centerPixel: { x: 0, y: 0 }, tiles: [] };
  const vehiclePixel = project(latitude, longitude, zoom);
  const markerLeft = vehiclePixel.x - layout.centerPixel.x + width / 2;
  const markerTop = vehiclePixel.y - layout.centerPixel.y + height / 2;
  const isCentered =
    Math.abs(markerLeft - width / 2) < 0.5 && Math.abs(markerTop - height / 2) < 0.5;
  const normalizedBearing =
    bearing !== null && bearing !== undefined && Number.isFinite(bearing)
      ? ((bearing % 360) + 360) % 360
      : null;

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        origin: center,
      };

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (error) {
        if (error instanceof Error && error.name !== "NotFoundError") {
          throw error;
        }
      }

      setIsDragging(true);
    },
    [center],
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const state = dragRef.current;

      if (!state || state.pointerId !== event.pointerId) {
        return;
      }

      const origin = project(state.origin.latitude, state.origin.longitude, zoom);
      const next = unproject(
        {
          x: origin.x - (event.clientX - state.startX),
          y: origin.y - (event.clientY - state.startY),
        },
        zoom,
      );

      setCenter({ latitude: next.latitude, longitude: next.longitude });
    },
    [zoom],
  );

  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;

    if (!state || state.pointerId !== event.pointerId) {
      return;
    }

    dragRef.current = null;
    setIsDragging(false);
  }, []);

  const handleRecenter = useCallback(() => {
    setCenter({ latitude, longitude });
  }, [latitude, longitude]);

  const controlClasses =
    "grid size-7 place-items-center text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40";

  const hasValidPosition =
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;

  if (!hasValidPosition) {
    return (
      <div
        className={cn(
          "grid place-items-center rounded-xl border border-dashed border-line-strong bg-surface-muted text-[11.5px] text-ink-subtle",
          MAP_HEIGHT_CLASSES,
        )}
      >
        Location unavailable
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative select-none overflow-hidden rounded-xl border border-line bg-[#eef3f9] dark:bg-[#0f1728]",
        MAP_HEIGHT_CLASSES,
      )}
    >
      <div
        aria-hidden="true"
        className={cn("absolute inset-0", MAP_GRID_CLASSES)}
        style={{ backgroundSize: `${MAP_GRID_SIZE}px ${MAP_GRID_SIZE}px` }}
      />

      <div
        ref={containerRef}
        role="img"
        aria-label={`Map showing the vehicle at latitude ${formatCoordinate(
          latitude,
        )}, longitude ${formatCoordinate(longitude)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={cn(
          "absolute inset-0 touch-none",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        {layout.tiles.map((tile) => (
          <img
            key={tile.key}
            src={getTileUrl(zoom, tile.x, tile.y)}
            alt=""
            aria-hidden="true"
            draggable={false}
            decoding="async"
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden";
            }}
            className="pointer-events-none absolute max-w-none bg-surface-muted select-none dark:invert dark:hue-rotate-180"
            style={{
              left: tile.left,
              top: tile.top,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
          />
        ))}

        {isReady ? (
          <div
            data-map-marker=""
            className="pointer-events-none absolute"
            style={{ left: markerLeft, top: markerTop }}
          >
            {normalizedBearing === null ? null : (
              <span
                className="absolute h-[3px] origin-left rounded-full opacity-95 shadow-[0_0_0_1px_rgba(255,255,255,0.8)] dark:shadow-[0_0_0_1px_rgba(15,23,42,0.8)]"
                style={{
                  top: -1.5,
                  width: HEADING_RAY_LENGTH,
                  backgroundColor: routeColor,
                  transform: `rotate(${normalizedBearing - 90}deg)`,
                }}
              />
            )}
            <span className="absolute size-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900/10 dark:bg-white/15" />
            <span className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900 ring-[3px] ring-white dark:bg-white dark:ring-slate-900" />
          </div>
        ) : null}
      </div>

      <div className="absolute top-2.5 right-2.5 flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-card">
        <button
          type="button"
          onClick={() => setZoom((value) => Math.min(MAX_MAP_ZOOM, value + MAP_ZOOM_STEP))}
          disabled={zoom >= MAX_MAP_ZOOM}
          aria-label="Zoom in map"
          className={cn(controlClasses, "text-[13px] leading-none font-bold")}
        >
          +
        </button>
        <span className="h-px bg-line" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setZoom((value) => Math.max(MIN_MAP_ZOOM, value - MAP_ZOOM_STEP))}
          disabled={zoom <= MIN_MAP_ZOOM}
          aria-label="Zoom out map"
          className={cn(controlClasses, "text-[13px] leading-none font-bold")}
        >
          −
        </button>
        {isCentered ? null : (
          <>
            <span className="h-px bg-line" aria-hidden="true" />
            <button
              type="button"
              onClick={handleRecenter}
              aria-label="Recenter map on vehicle"
              className={controlClasses}
            >
              <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
                <circle
                  cx="8"
                  cy="8"
                  r="5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <circle cx="8" cy="8" r="1.6" fill="currentColor" />
              </svg>
            </button>
          </>
        )}
      </div>

      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-2 left-2.5 rounded bg-surface/85 px-1.5 py-0.5 text-[10px] text-slate-600 backdrop-blur-sm dark:bg-slate-900/75 dark:text-slate-300"
      >
        © OpenStreetMap contributors
      </a>

      <span className="sr-only">
        Drag the map to pan. Zoom level {zoom}. Position from the latitude and longitude
        attributes.
      </span>
    </div>
  );
}

function VehicleOverview({
  vehicle,
  route,
  trip,
  stop,
  isRelatedLoading,
}: VehicleOverviewProps) {
  const { attributes } = vehicle;
  const routeAttributes = route?.attributes;
  const tripAttributes = trip?.attributes;
  const directionId = attributes.direction_id;
  const tripDirectionId = tripAttributes?.direction_id ?? directionId;
  const routeShortName =
    routeAttributes?.short_name || route?.id || vehicle.relationships.route.data.id;
  const routeTitle = routeAttributes?.long_name || routeShortName || "Route unavailable";
  const routeColor = getRouteColor(routeAttributes?.color) ?? FALLBACK_ROUTE_COLOR;
  const directionName =
    routeAttributes?.direction_names?.[tripDirectionId] ||
    getDirectionLabel(tripDirectionId);
  const destination =
    routeAttributes?.direction_destinations?.[tripDirectionId] ||
    tripAttributes?.headsign ||
    "Unavailable";
  const status = getStatusView(attributes.current_status);
  const occupancy = getOccupancyView(attributes.occupancy_status);
  const stopName = stop
    ? [stop.attributes.name, stop.attributes.platform_code]
        .filter(Boolean)
        .join(" ")
    : undefined;
  const carriageCount = attributes.carriages?.length ?? 0;
  const routeTypeLabel = getRouteTypeLabel(routeAttributes?.type);
  const lastSeen = formatRelativeTime(attributes.updated_at);
  const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${attributes.latitude}&mlon=${attributes.longitude}#map=17/${attributes.latitude}/${attributes.longitude}`;

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        <MapPreview
          key={vehicle.id}
          latitude={attributes.latitude}
          longitude={attributes.longitude}
          bearing={attributes.bearing}
          routeColor={routeColor}
        />

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <a
            href={openStreetMapUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-control border border-line bg-surface px-2.5 text-[11.5px] font-semibold text-ink shadow-card transition-colors hover:bg-surface-muted"
          >
            Open in map
            <ArrowUpRightIcon className="size-3" />
          </a>
          <span className="text-[11px] text-ink-subtle">
            Last position {lastSeen}
          </span>
        </div>

        <div className="mt-2.5 space-y-2 text-[10.5px] leading-relaxed text-ink-subtle">
          <p className="rounded-lg bg-surface-muted px-2.5 py-2">
            Tiles and the marker are projected from the <Code>latitude</Code> and{" "}
            <Code>longitude</Code> attributes with Web Mercator, so the pin sits on the
            real location. Drag to pan, or use zoom.
          </p>
          <p className="rounded-lg bg-surface-muted px-2.5 py-2">
            The short line shows the vehicle heading from <Code>bearing</Code>. Its color
            comes from <Code>routes.color</Code> (
            {routeAttributes?.color ?? FALLBACK_ROUTE_COLOR.slice(1)} for route{" "}
            {routeShortName}), not a fixed color.
          </p>
        </div>
      </div>

      <div className="min-w-0 space-y-3">
        <DetailSection title="Status & position">
          <DetailRow
            label="Status"
            value={
              <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
                <ToneValue tone={status.tone} label={status.label} />
              </span>
            }
          />
          <DetailRow label="Latitude" value={formatCoordinate(attributes.latitude)} />
          <DetailRow label="Longitude" value={formatCoordinate(attributes.longitude)} />
          <DetailRow
            label="Last stop"
            value={stopName ?? "Unavailable"}
            pending={isRelatedLoading && !stop}
          />
          <DetailRow label="Stop sequence" value={attributes.current_stop_sequence} />
          <DetailRow
            label="Last update"
            value={`${lastSeen} · ${formatClock(attributes.updated_at)}`}
          />
        </DetailSection>

        <DetailSection title="Occupancy & motion">
          <DetailRow
            label="Occupancy"
            value={<ToneValue tone={occupancy.tone} label={occupancy.label} />}
          />
          <DetailRow label="Heading" value={formatBearing(attributes.bearing)} />
          <DetailRow label="Speed" value={formatSpeed(attributes.speed)} />
          <DetailRow
            label="Carriages"
            value={
              carriageCount > 0
                ? `${carriageCount} carriages`
                : `No carriage data (${routeTypeLabel})`
            }
          />
          <DetailRow
            label="Revenue"
            value={
              <span className="inline-flex flex-wrap items-center justify-end gap-1.5">
                {getRevenueLabel(attributes.revenue)}
              </span>
            }
          />
        </DetailSection>

        <DetailSection title="Route">
          <DetailRow
            label="Route"
            value={
              <span className="inline-flex flex-wrap items-baseline justify-end gap-1.5">
                {routeTitle}
                <span className="font-mono text-[10px] font-normal text-ink-subtle">
                  {routeShortName}
                </span>
              </span>
            }
            pending={isRelatedLoading && !route}
          />
          <DetailRow
            label="Type"
            value={routeTypeLabel}
            pending={isRelatedLoading && !route}
          />
          <DetailRow
            label="Destination"
            value={`${directionName} → ${destination}`}
            pending={isRelatedLoading && !route}
          />
        </DetailSection>

        <DetailSection title="Trip">
          <DetailRow
            label="Trip"
            value={trip?.id ?? vehicle.relationships.trip.data?.id ?? "Unavailable"}
            mono
            pending={isRelatedLoading && !trip}
          />
          <DetailRow
            label="Headsign"
            value={tripAttributes?.headsign ?? "Unavailable"}
            pending={isRelatedLoading && !trip}
          />
          <DetailRow
            label="Direction"
            value={`${directionName}`}
            pending={isRelatedLoading && !trip}
          />
          <DetailRow
            label="Block"
            value={tripAttributes?.block_id ?? "Unavailable"}
            mono
            pending={isRelatedLoading && !trip}
          />
          <DetailRow
            label="Bike"
            value={getBikeLabel(tripAttributes?.bike_allowed)}
            pending={isRelatedLoading && !trip}
          />
          <DetailRow
            label="Wheelchair"
            value={getWheelchairLabel(tripAttributes?.wheelchair_accessible)}
            pending={isRelatedLoading && !trip}
          />
        </DetailSection>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading vehicle detail"
      className="grid gap-4 md:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <div className="min-w-0 space-y-2.5">
        <div
          className={cn(
            "animate-pulse rounded-xl bg-surface-muted",
            MAP_HEIGHT_CLASSES,
          )}
        />
        <div className="flex items-center gap-2">
          <SkeletonBar className="h-8 w-28 rounded-lg" />
          <SkeletonBar className="h-2.5 w-32" />
        </div>
        <div className="h-12 animate-pulse rounded-lg bg-surface-muted" />
        <div className="h-12 animate-pulse rounded-lg bg-surface-muted" />
      </div>

      <div className="min-w-0 space-y-4">
        {[4, 5, 3, 6].map((rows, sectionIndex) => (
          <div key={sectionIndex} className="space-y-2">
            <SkeletonBar className="h-2 w-24" />
            {Array.from({ length: rows }, (_, rowIndex) => (
              <div key={rowIndex} className="flex justify-between gap-3">
                <SkeletonBar className="h-2 w-16" />
                <SkeletonBar className="h-2 w-20" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailError({
  message,
  onRetry,
  isRetrying,
}: {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong px-4 py-12 text-center"
    >
      <p className="text-[13px] font-bold text-ink">Failed to load vehicle detail</p>
      <p className="max-w-sm text-[11.5px] text-ink-muted">{message}</p>
      <Button
        variant="secondary"
        size="sm"
        className="mt-1"
        isLoading={isRetrying}
        onClick={onRetry}
      >
        Try again
      </Button>
    </div>
  );
}

const ArmadaDetailBase = ({ open, onClose, vehicleId }: ArmadaDetailProps) => {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const copyTimerRef = useRef<number | undefined>(undefined);

  const vehicleQuery = useQuery({
    ...detailVehicleQueryOptions(vehicleId),
    enabled: open && vehicleId.length > 0,
  });
  const vehicle = vehicleQuery.data?.data;

  const routeId = vehicle?.relationships.route.data?.id ?? "";
  const stopId = vehicle?.relationships.stop.data?.id ?? "";
  const tripId = vehicle?.relationships.trip.data?.id ?? "";

  const routeQuery = useQuery({
    ...routeQueryOptions(routeId),
    enabled: open && routeId.length > 0,
  });
  const stopQuery = useQuery({
    ...stopQueryOptions(stopId),
    enabled: open && stopId.length > 0,
  });
  const tripQuery = useQuery({
    ...tripQueryOptions(tripId),
    enabled: open && tripId.length > 0,
  });

  const route = routeQuery.data?.data[0];
  const stop = stopQuery.data?.data[0];
  const trip = tripQuery.data?.data[0];

  const isRelatedLoading =
    routeQuery.isLoading || stopQuery.isLoading || tripQuery.isLoading;

  useEffect(
    () => () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
    },
    [],
  );

  const handleCopy = useCallback(async () => {
    if (!vehicle) {
      return;
    }

    const text = `${formatCoordinate(vehicle.attributes.latitude)}, ${formatCoordinate(
      vehicle.attributes.longitude,
    )}`;

    const settle = (state: "copied" | "failed") => {
      setCopyState(state);

      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }

      copyTimerRef.current = window.setTimeout(() => setCopyState("idle"), 2000);
    };

    const copied = await copyText(text);
    settle(copied ? "copied" : "failed");
  }, [vehicle]);

  const routeShortName =
    route?.attributes.short_name || route?.id || vehicleId;
  const routeColor = getRouteColor(route?.attributes.color);
  const routeTextColor = getRouteColor(route?.attributes.text_color);
  const status = vehicle ? getStatusView(vehicle.attributes.current_status) : null;
  const copyLabel =
    copyState === "copied"
      ? "Coordinates copied"
      : copyState === "failed"
        ? "Copy failed"
        : "Copy coordinates";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      ariaLabel="Vehicle detail"
      className="sm:max-w-[980px]"
      title={
        vehicle ? (
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                "grid h-6 min-w-6 shrink-0 place-items-center rounded-md px-1 text-[11px] font-bold",
                !routeColor && "bg-surface-muted text-ink",
              )}
              style={
                routeColor
                  ? { backgroundColor: routeColor, color: routeTextColor ?? "#ffffff" }
                  : undefined
              }
            >
              {routeShortName || "—"}
            </span>
            <span className="truncate text-[19px] leading-none font-bold tracking-[-0.015em] text-ink tabular-nums">
              {vehicle.attributes.label || vehicle.id}
            </span>
          </span>
        ) : (
          <span className="flex items-center gap-2.5">
            <SkeletonBar className="size-6 rounded-md" />
            <SkeletonBar className="h-4 w-20" />
          </span>
        )
      }
      headerActions={
        status ? (
          <span className="inline-flex max-w-[42vw] min-w-0 items-center gap-1.5 truncate text-[11.5px] font-semibold text-ink-muted sm:max-w-none">
            <ToneDot tone={status.tone} />
            <span className="truncate">{status.label}</span>
          </span>
        ) : null
      }
      footerNote={
        <>
          Data from MBTA API v3 · ID{" "}
          <span className="font-mono text-[11px]">{vehicle?.id ?? "—"}</span>
        </>
      }
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void handleCopy()}
            disabled={!vehicle}
          >
            {copyLabel}
          </Button>
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      {vehicle ? (
        <VehicleOverview
          vehicle={vehicle}
          route={route}
          trip={trip}
          stop={stop}
          isRelatedLoading={isRelatedLoading}
        />
      ) : vehicleQuery.isError ? (
        <DetailError
          message={
            vehicleQuery.error instanceof Error
              ? vehicleQuery.error.message
              : "Something went wrong while requesting the vehicle."
          }
          isRetrying={vehicleQuery.isFetching}
          onRetry={() => void vehicleQuery.refetch()}
        />
      ) : (
        <DetailSkeleton />
      )}
    </Modal>
  );
};

export const ArmadaModal = memo(ArmadaDetailBase);

ArmadaModal.displayName = "ArmadaModal";
