import { infiniteQueryOptions, keepPreviousData, queryOptions } from '@tanstack/react-query'

import { getRoutes, getStops, getTrip, getVehicleDetail, getVehicles } from './armada.api'
import type { GetStopQuery, GetTripQuery, GetVehicleQuery } from '../types/armada'

export const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (query: GetVehicleQuery) => [...vehicleKeys.lists(), query] as const,
  detail: (vehicleId: string) => [...vehicleKeys.all, 'detail', vehicleId] as const,
}

export const routeKeys = {
  all: ['routes'] as const,
  lists: () => [...routeKeys.all, 'list'] as const,
  list: (limit: number) => [...routeKeys.lists(), limit] as const,
  detail: (routeId: string) => [...routeKeys.all, 'detail', routeId] as const,
  infinite: (limit: number) => [...routeKeys.all, 'infinite', limit] as const,
}

export const stopKeys = {
  all: ['stops'] as const,
  lists: () => [...stopKeys.all, 'list'] as const,
  list: (query: GetStopQuery) => [...stopKeys.lists(), query] as const,
  detail: (stopId: string) => [...stopKeys.all, 'detail', stopId] as const,
}

export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (query: GetTripQuery) => [...tripKeys.lists(), query] as const,
  detail: (tripId: string) => [...tripKeys.all, 'detail', tripId] as const,
  infinite: (query: GetTripQuery) => [...tripKeys.all, 'infinite', query] as const,
}

export const vehiclesQueryOptions = (query: GetVehicleQuery = {}) =>
  queryOptions({
    queryKey: vehicleKeys.list(query),
    queryFn: ({ signal }) => getVehicles(query, signal),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  })

export const routesQueryOptions = (limit = 200) =>
  queryOptions({
    queryKey: routeKeys.list(limit),
    queryFn: ({ signal }) => getRoutes({ limit }, signal),
    staleTime: 10 * 60_000,
  })

export const routeQueryOptions = (routeId: string) =>
  queryOptions({
    queryKey: routeKeys.detail(routeId),
    queryFn: ({ signal }) => getRoutes({ id: routeId }, signal),
    staleTime: 10 * 60_000,
    enabled: routeId.length > 0,
  })

export const routesInfiniteQueryOptions = (limit = 20) =>
  infiniteQueryOptions({
    queryKey: routeKeys.infinite(limit),
    queryFn: ({ pageParam, signal }) => getRoutes({ limit, offset: pageParam, sort: 'id' }, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.links?.next ? allPages.length * limit : undefined,
    staleTime: 10 * 60_000,
  })

export const stopsQueryOptions = (query: GetStopQuery = {}) =>
  queryOptions({
    queryKey: stopKeys.list(query),
    queryFn: ({ signal }) => getStops(query, signal),
    staleTime: 10 * 60_000,
  })

export const stopQueryOptions = (stopId: string) =>
  queryOptions({
    queryKey: stopKeys.detail(stopId),
    queryFn: ({ signal }) => getStops({ id: stopId }, signal),
    staleTime: 10 * 60_000,
    enabled: stopId.length > 0,
  })

export const tripsQueryOptions = (query: GetTripQuery = {}) =>
  queryOptions({
    queryKey: tripKeys.list(query),
    queryFn: ({ signal }) => getTrip(query, signal),
    staleTime: 10 * 60_000,
  })

export const tripQueryOptions = (tripId: string) =>
  queryOptions({
    queryKey: tripKeys.detail(tripId),
    queryFn: ({ signal }) => getTrip({ id: tripId }, signal),
    staleTime: 10 * 60_000,
    enabled: tripId.length > 0,
  })

export const tripsInfiniteQueryOptions = (query: GetTripQuery = {}) =>
  infiniteQueryOptions({
    queryKey: tripKeys.infinite(query),
    queryFn: ({ pageParam, signal }) => getTrip({ ...query, offset: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.links?.next ? allPages.length * (query.limit ?? 20) : undefined,
    staleTime: 10 * 60_000,
  })


export const detailVehicleQueryOptions = (vehicleId: string) =>
  queryOptions({
    queryKey: vehicleKeys.detail(vehicleId),
    queryFn: ({ signal }) => getVehicleDetail(vehicleId, signal),
    staleTime: 30_000,
    enabled: vehicleId.length > 0,
  })