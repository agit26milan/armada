export interface VehicleAttributes {
  bearing: number
  carriages: unknown[]
  current_status: string
  current_stop_sequence: number
  direction_id: number
  label: string
  latitude: number
  longitude: number
  occupancy_status: string | null
  revenue: string
  speed: number | null
  updated_at: string
}

export interface ResourceLinks {
  self: string
}

export interface ResourceRef<TType extends string> {
  data: {
    id: string
    type: TType
  }
}

export interface VehicleRelationships {
  route: ResourceRef<'route'>
  stop: ResourceRef<'stop'>
  trip: ResourceRef<'trip'>
}

export interface Vehicle {
  attributes: VehicleAttributes
  id: string
  links: ResourceLinks
  relationships: VehicleRelationships
  type: string
}

export interface RouteAttributes {
  color: string
  direction_destinations: string[]
  direction_names: string[]
  long_name: string
  short_name: string
  text_color: string
  type: number
}

export interface Route {
  attributes: RouteAttributes
  id: string
  type: string
}

export interface TripAttributes {
  bike_allowed: boolean
  block_id: string | null
  direction_id: number
  headsign: string | null
  name: string
  wheelchair_accessible: number
}

export interface TripRelationships {
  route: ResourceRef<'route'>
  service: ResourceRef<'service'>
  shape: ResourceRef<'shape'>
}

export interface Trip {
  attributes: TripAttributes
  id: string
  links: ResourceLinks
  relationships: TripRelationships
  type: string
}

export interface TripListResponse {
  data: Trip[]
  links?: ResourceListLinks
}

export interface GetTripQuery {
  date?: string
  direction_id?: number
  id?: string
  include?: string
  limit?: number
  name?: string
  offset?: number
  route?: string
  sort?: string
}

export interface ResourceListLinks {
  first: string
  last: string
  next?: string
  prev?: string
}

export interface VehicleListResponse {
  data: Vehicle[]
  links?: ResourceListLinks
}

export interface VehicleDetailResponse {
  data: Vehicle
}

export interface StopListResponse {
  data: Stop[]
  links?: ResourceListLinks
}

export interface GetRouteQuery {
  direction_id?: number
  id?: string
  limit?: number
  offset?: number
  route_type?: number
  sort?: string
}

export interface RouteListResponse {
  data: Route[]
  links?: ResourceListLinks
}

export interface GetVehicleQuery {
  offset?: number
  limit?: number
  vehicle?: string
  include?: string
  id?: string
  label?: string
  route?: string
  direction_id?: number
  route_type?: number
  revenue?: string
  trip?: string
}

export interface StopAttributes {
  address: string | null
  at_street: string | null
  description: string | null
  latitude: number
  location_type: number
  longitude: number
  municipality: string
  name: string
  on_street: string | null
  platform_code: string | null
  platform_name: string | null
  vehicle_type: number | null
  wheelchair_boarding: number
}

export interface StopRelationshipLinks {
  related: string
  self: string
}

export interface StopResourceRef<TType extends string> {
  data: {
    id: string
    type: TType
  } | null
  links: StopRelationshipLinks
}

export interface StopRelationships {
  parent_station: StopResourceRef<'stop'>
}

export interface Stop {
  attributes: StopAttributes
  id: string
  links: ResourceLinks
  relationships: StopRelationships
  type: string
}

export interface GetStopQuery {
  direction_id?: number
  id?: string
  include?: string
  latitude?: number
  limit?: number
  location_type?: number
  longitude?: number
  offset?: number
  radius?: number
  route?: string
  route_type?: number
  sort?: string
  stop?: string
  name?: string
}
