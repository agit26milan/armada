export const TILE_SIZE = 256

export const DEFAULT_MAP_ZOOM = 16

export const MIN_MAP_ZOOM = 13

export const MAX_MAP_ZOOM = 18

const MAX_MERCATOR_LATITUDE = 85.05112878

export interface LatLng {
  latitude: number
  longitude: number
}

export interface Point {
  x: number
  y: number
}

export interface MapTile {
  key: string
  x: number
  y: number
  left: number
  top: number
}

export interface MapLayout {
  centerPixel: Point
  tiles: MapTile[]
}

function clampLatitude(latitude: number): number {
  return Math.max(-MAX_MERCATOR_LATITUDE, Math.min(MAX_MERCATOR_LATITUDE, latitude))
}

export function normalizeLongitude(longitude: number): number {
  return ((((longitude + 180) % 360) + 360) % 360) - 180
}

export function project(latitude: number, longitude: number, zoom: number): Point {
  const scale = TILE_SIZE * 2 ** zoom
  const sin = Math.sin((clampLatitude(latitude) * Math.PI) / 180)

  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  }
}

export function unproject(point: Point, zoom: number): LatLng {
  const scale = TILE_SIZE * 2 ** zoom
  const n = Math.PI - (2 * Math.PI * point.y) / scale

  return {
    latitude: (180 / Math.PI) * Math.atan(Math.sinh(n)),
    longitude: normalizeLongitude((point.x / scale) * 360 - 180),
  }
}

export function getMapLayout(
  center: LatLng,
  zoom: number,
  width: number,
  height: number,
): MapLayout {
  const centerPixel = project(center.latitude, center.longitude, zoom)
  const tileCount = 2 ** zoom
  const firstColumn = Math.floor((centerPixel.x - width / 2) / TILE_SIZE)
  const lastColumn = Math.floor((centerPixel.x + width / 2) / TILE_SIZE)
  const firstRow = Math.max(0, Math.floor((centerPixel.y - height / 2) / TILE_SIZE))
  const lastRow = Math.min(tileCount - 1, Math.floor((centerPixel.y + height / 2) / TILE_SIZE))
  const tiles: MapTile[] = []

  for (let column = firstColumn; column <= lastColumn; column += 1) {
    const wrappedColumn = ((column % tileCount) + tileCount) % tileCount

    for (let row = firstRow; row <= lastRow; row += 1) {
      tiles.push({
        key: `${column}:${row}`,
        x: wrappedColumn,
        y: row,
        left: column * TILE_SIZE - centerPixel.x + width / 2,
        top: row * TILE_SIZE - centerPixel.y + height / 2,
      })
    }
  }

  return { centerPixel, tiles }
}

export function getTileUrl(zoom: number, x: number, y: number): string {
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`
}
