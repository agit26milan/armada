import { httpRequest } from "@/shared/api/http-client";
import type { QueryParams } from "@/shared/api/http-client";

import type {
  GetRouteQuery,
  GetStopQuery,
  GetTripQuery,
  GetVehicleQuery,
  RouteListResponse,
  RouteTripsResponse,
  StopListResponse,
  TripListResponse,
  VehicleDetailResponse,
  VehicleListResponse,
} from "../types/armada";

function toVehicleParams(query: GetVehicleQuery): QueryParams {
  const params: QueryParams = {};

  if (query.include) {
    params.include = query.include;
  }

  if (query.limit !== undefined) {
    params["page[limit]"] = query.limit;
  }

  if (query.offset !== undefined) {
    params["page[offset]"] = query.offset;
  }

  if (query.id) {
    params["filter[id]"] = query.id;
  }

  if (query.vehicle) {
    params["filter[id]"] = query.vehicle;
  }

  if (query.label) {
    params["filter[label]"] = query.label;
  }

  if (query.route) {
    params["filter[route]"] = query.route;
  }

  if (query.direction_id !== undefined) {
    params["filter[direction_id]"] = query.direction_id;
  }

  if (query.route_type !== undefined) {
    params["filter[route_type]"] = query.route_type;
  }

  if (query.revenue) {
    params["filter[revenue]"] = query.revenue;
  }

  if (query.trip) {
    params["filter[trip]"] = query.trip;
  }

  return params;
}

export function getVehicles(
  query: GetVehicleQuery = {},
  signal?: AbortSignal,
): Promise<VehicleListResponse> {
  return httpRequest<VehicleListResponse>("/vehicles", {
    query: toVehicleParams(query),
    signal,
  });
}

function toRouteParams(query: GetRouteQuery): QueryParams {
  const params: QueryParams = {};

  if (query.limit !== undefined) {
    params["page[limit]"] = query.limit;
  }

  if (query.offset !== undefined) {
    params["page[offset]"] = query.offset;
  }

  if (query.id) {
    params["filter[id]"] = query.id;
  }

  if (query.direction_id !== undefined) {
    params["filter[direction_id]"] = query.direction_id;
  }

  if (query.route_type !== undefined) {
    params["filter[route_type]"] = query.route_type;
  }

  if (query.sort) {
    params.sort = query.sort;
  }

  return params;
}

export function getRoutes(
  query: GetRouteQuery = {},
  signal?: AbortSignal,
): Promise<RouteListResponse> {
  return httpRequest<RouteListResponse>("/routes", {
    query: toRouteParams(query),
    signal,
  });
}

function toStopParams(query: GetStopQuery): QueryParams {
  const params: QueryParams = {};

  if (query.include) {
    params.include = query.include;
  }

  if (query.limit !== undefined) {
    params["page[limit]"] = query.limit;
  }

  if (query.offset !== undefined) {
    params["page[offset]"] = query.offset;
  }

  if (query.id) {
    params["filter[id]"] = query.id;
  }

  if (query.route) {
    params["filter[route]"] = query.route;
  }

  if (query.direction_id !== undefined) {
    params["filter[direction_id]"] = query.direction_id;
  }

  if (query.route_type !== undefined) {
    params["filter[route_type]"] = query.route_type;
  }

  if (query.location_type !== undefined) {
    params["filter[location_type]"] = query.location_type;
  }

  if (query.latitude !== undefined) {
    params["filter[latitude]"] = query.latitude;
  }

  if (query.longitude !== undefined) {
    params["filter[longitude]"] = query.longitude;
  }

  if (query.radius !== undefined) {
    params["filter[radius]"] = query.radius;
  }

  if (query.sort) {
    params.sort = query.sort;
  }

  if (query.name) {
    params["filter[name]"] = query.name;
  }

  return params;
}

export function getStops(
  query: GetStopQuery = {},
  signal?: AbortSignal,
): Promise<StopListResponse> {
  return httpRequest<StopListResponse>("/stops", {
    query: toStopParams(query),
    signal,
  });
}

export function getTrip(query: GetTripQuery = {}, signal?: AbortSignal): Promise<TripListResponse> {
  return httpRequest<TripListResponse>("/trips", {
    query: toStopParams(query),
    signal,
  });
}

export function getVehicleDetail(
  vehicleId: string,
  signal?: AbortSignal,
): Promise<VehicleDetailResponse> {
  return httpRequest<VehicleDetailResponse>(
    `/vehicles/${encodeURIComponent(vehicleId)}`,
    { signal },
  );
}

export function getRouteTrips(
  route: string,
  signal?: AbortSignal,
): Promise<RouteTripsResponse> {
  return httpRequest<RouteTripsResponse>("/vehicles", {
    query: {
      "filter[route]": route,
      include: "trip",
      "page[limit]": 100,
    },
    signal,
  });
}