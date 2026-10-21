import type { Vehicle } from '../types/armada'

export type VehicleTone = 'neutral' | 'amber' | 'blue' | 'green' | 'red'

export interface VehicleStateView {
  label: string
  tone: VehicleTone
}

const STATUS_VIEWS: Record<string, VehicleStateView> = {
  STOPPED_AT: { label: 'Stopped at stop', tone: 'neutral' },
  INCOMING_AT: { label: 'Approaching stop', tone: 'amber' },
  IN_TRANSIT_TO: { label: 'In transit', tone: 'blue' },
}

const OCCUPANCY_VIEWS: Record<string, VehicleStateView> = {
  EMPTY: { label: 'Empty', tone: 'green' },
  MANY_SEATS_AVAILABLE: { label: 'Many seats available', tone: 'green' },
  FEW_SEATS_AVAILABLE: { label: 'Few seats available', tone: 'green' },
  STANDING_ROOM_ONLY: { label: 'Standing room only', tone: 'amber' },
  CRUSHED_STANDING_ROOM_ONLY: { label: 'Severely crowded', tone: 'amber' },
  FULL: { label: 'Full', tone: 'red' },
  NOT_ACCEPTING_PASSENGERS: { label: 'Not accepting passengers', tone: 'neutral' },
}

const UNKNOWN_STATUS: VehicleStateView = { label: 'Status unknown', tone: 'neutral' }

const UNKNOWN_OCCUPANCY: VehicleStateView = { label: 'Occupancy unavailable', tone: 'neutral' }

export function getStatusView(status: string | null | undefined): VehicleStateView {
  if (!status) {
    return UNKNOWN_STATUS
  }

  return STATUS_VIEWS[status] ?? UNKNOWN_STATUS
}

export function getOccupancyView(status: string | null | undefined): VehicleStateView {
  if (!status) {
    return UNKNOWN_OCCUPANCY
  }

  return OCCUPANCY_VIEWS[status] ?? UNKNOWN_OCCUPANCY
}

export function getDirectionLabel(directionId: number | null | undefined): string {
  if (directionId === 1) {
    return 'Inbound'
  }

  if (directionId === 0) {
    return 'Outbound'
  }

  return 'Direction unavailable'
}

export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
}

export function formatCoordinate(value: number): string {
  return value.toFixed(6).replace(/\.?0+$/, '')
}

const CLOCK_FORMATTER = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZone: 'America/New_York',
  timeZoneName: 'short',
})

export function formatClock(value: string): string {
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? 'Time unavailable' : CLOCK_FORMATTER.format(date)
}

const COMPASS_POINTS = [
  'north',
  'north-east',
  'east',
  'south-east',
  'south',
  'south-west',
  'west',
  'north-west',
] as const

export function getCompassPoint(bearing: number): string {
  const normalized = ((bearing % 360) + 360) % 360

  return COMPASS_POINTS[Math.round(normalized / 45) % COMPASS_POINTS.length]
}

export function formatBearing(bearing: number | null | undefined): string {
  if (bearing === null || bearing === undefined || !Number.isFinite(bearing)) {
    return 'Unavailable'
  }

  return `${Math.round(bearing)}° ${getCompassPoint(bearing)}`
}

export function formatSpeed(speed: number | null | undefined): string {
  if (speed === null || speed === undefined || !Number.isFinite(speed)) {
    return 'Unavailable'
  }

  return `${Math.round(speed)} mph`
}

const ROUTE_TYPE_LABELS: Record<number, string> = {
  0: 'Light rail',
  1: 'Subway',
  2: 'Commuter rail',
  3: 'Bus',
  4: 'Ferry',
}

export function getRouteTypeLabel(type: number | null | undefined): string {
  if (type === null || type === undefined) {
    return 'Unknown'
  }

  return ROUTE_TYPE_LABELS[type] ?? 'Unknown'
}

export function getWheelchairLabel(accessible: number | null | undefined): string {
  if (accessible === 1) {
    return 'Accessible'
  }

  if (accessible === 2) {
    return 'Not accessible'
  }

  return 'No information'
}

export function getBikeLabel(allowed: boolean | null | undefined): string {
  return allowed ? 'Allowed' : 'Not allowed'
}

export function getRevenueLabel(revenue: string | null | undefined): string {
  if (revenue === 'REVENUE') {
    return 'Fare-paying passengers'
  }

  if (revenue === 'NON_REVENUE') {
    return 'Non-revenue'
  }

  return revenue?.trim() ? revenue : 'Unavailable'
}

export function getRouteColor(color: string | null | undefined): string | undefined {
  return color && /^[0-9a-f]{6}$/i.test(color) ? `#${color}` : undefined
}

export function formatRelativeTime(value: string, now = Date.now()): string {
  const timestamp = new Date(value).getTime()

  if (Number.isNaN(timestamp)) {
    return 'Time unavailable'
  }

  const minutes = Math.max(0, Math.round((now - timestamp) / 60_000))

  if (minutes < 1) {
    return 'just now'
  }

  if (minutes < 60) {
    return `${minutes} min ago`
  }

  const hours = Math.round(minutes / 60)

  if (hours < 24) {
    return `${hours} hr ago`
  }

  return `${Math.round(hours / 24)} d ago`
}

export function getStopLabel(vehicle: Vehicle): string {
  const stopId = vehicle.relationships?.stop?.data?.id ?? ''

  return stopId.length > 0 ? `Stop ${stopId}` : 'Stop unavailable'
}
