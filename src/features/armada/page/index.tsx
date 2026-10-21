import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { DropdownOption } from "@/shared/components/ui/dropdown";
import { Dropdown } from "@/shared/components/ui/dropdown";
import { Pagination } from "@/shared/components/ui/pagination";

import {
  routesInfiniteQueryOptions,
  routesQueryOptions,
  stopsQueryOptions,
  tripsInfiniteQueryOptions,
  tripsQueryOptions,
  vehiclesQueryOptions,
} from "../api/armada.queries";
import { ArmadaCard } from "../components/armada-card";
import ArmadaEmpty from "../components/armada-empty";
import ArmadaError from "../components/armada-error";
import ArmadaLoading from "../components/armada-loading";
import type { Route, Stop, Vehicle } from "../types/armada";
import { usePagination } from "@/shared/hooks/use-pagination";
import { ArmadaModal } from "../components/armada-detail";

const GRID_CLASSES = "grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3";

const ROUTE_PAGE_SIZE = 20;

const EMPTY_VEHICLES: Vehicle[] = [];

const EMPTY_ROUTES: string[] = [];

interface SearchPatch {
  page?: number;
  pageSize?: number;
  route?: string[];
  trip?: string;
}

function parseListParam(value?: string): string[] {
  if (!value) {
    return [];
  }

  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

const ArmadaPage = () => {
  const {
    page: requestedPage,
    pageSize,
    route: routeParam,
    trip: tripParam,
  } = useSearch({ from: "/" });
  const navigate = useNavigate();
  const { parseOffset } = usePagination();
  const page = Math.max(0, Math.floor(requestedPage));
  const [armadaModalOpen, setArmadaModalOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const selectedRoutes = routeParam ?? EMPTY_ROUTES;
  const selectedTrips = useMemo(() => parseListParam(tripParam), [tripParam]);
  const routeFilter =
    selectedRoutes.length > 0 ? selectedRoutes.join(",") : undefined;
  const vehiclesQuery = useQuery(
    vehiclesQueryOptions({
      limit: pageSize,
      offset: page * pageSize,
      route: routeFilter,
      include: "trip,route,stop",
      trip: selectedTrips.join(","),
    }),
  );
  const vehicles = vehiclesQuery.data?.data ?? EMPTY_VEHICLES;

  const routesQuery = useQuery(routesQueryOptions());
  const routesInfiniteQuery = useInfiniteQuery({
    ...routesInfiniteQueryOptions(ROUTE_PAGE_SIZE),
  });

  const tripsInfiniteQuery = useInfiniteQuery({
    ...tripsInfiniteQueryOptions({
      limit: ROUTE_PAGE_SIZE,
      route: routeFilter,
    }),
    enabled: routeFilter !== undefined,
  });

  const selectedTripsQuery = useQuery({
    ...tripsQueryOptions({ id: selectedTrips.join(",") }),
    enabled: selectedTrips.length > 0,
  });
  const stopIds = useMemo(() => {
    const ids = new Set<string>();

    for (const vehicle of vehicles) {
      ids.add(vehicle.relationships.stop.data?.id ?? "");
    }

    return [...ids].join(",");
  }, [vehicles]);
  const stopsQuery = useQuery({
    ...stopsQueryOptions({ id: stopIds }),
    enabled: stopIds.length > 0,
  });

  const routesById = useMemo(() => {
    const map = new Map<string, Route>();

    for (const item of routesQuery.data?.data ?? []) {
      map.set(item.id, item);
    }

    return map;
  }, [routesQuery.data]);

  const getRoute = useCallback(
    (routeId: string) => routesById.get(routeId),
    [routesById],
  );

  const routeOptions = useMemo<DropdownOption<string>[]>(() => {
    const seen = new Set<string>();
    const items: DropdownOption<string>[] = [];

    for (const pageData of routesInfiniteQuery.data?.pages ?? []) {
      for (const item of pageData.data) {
        if (seen.has(item.id)) {
          continue;
        }

        seen.add(item.id);
        items.push({
          value: item.id,
          label:
            item.attributes.long_name || item.attributes.short_name || item.id,
        });
      }
    }

    return items;
  }, [routesInfiniteQuery.data]);

  const tripOptions = useMemo<DropdownOption<string>[]>(() => {
    const seen = new Set<string>();
    const items: DropdownOption<string>[] = [];

    const pushTrip = (id: string, headsign: string | null) => {
      if (seen.has(id)) {
        return;
      }

      seen.add(id);
      items.push({ value: id, label: `${headsign ?? "Trip"} - ${id}` });
    };

    for (const item of selectedTripsQuery.data?.data ?? []) {
      pushTrip(item.id, item.attributes.headsign);
    }

    for (const pageData of tripsInfiniteQuery.data?.pages ?? []) {
      for (const item of pageData.data) {
        pushTrip(item.id, item.attributes.headsign);
      }
    }

    return items;
  }, [selectedTripsQuery.data, tripsInfiniteQuery.data]);

  const stopsById = useMemo(() => {
    const map = new Map<string, Stop>();

    for (const stop of stopsQuery.data?.data ?? []) {
      map.set(stop.id, stop);
    }

    return map;
  }, [stopsQuery.data]);

  const getStop = useCallback(
    (stopId: string) => stopsById.get(stopId),
    [stopsById],
  );

  const updateSearch = useCallback(
    (patch: SearchPatch, replace = false) => {
      void navigate({
        to: "/",
        search: {
          page: patch.page ?? page,
          pageSize: patch.pageSize ?? pageSize,
          route: "route" in patch ? patch.route : routeParam,
          trip: "trip" in patch ? patch.trip : tripParam,
        },
        replace,
      });
    },
    [navigate, page, pageSize, routeParam, tripParam],
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const target = Math.max(0, Math.floor(nextPage));

      if (target === page) {
        return;
      }

      updateSearch({ page: target });
    },
    [page, updateSearch],
  );

  const pageOffset = page * pageSize;
  const lastOffset = parseOffset(vehiclesQuery.data?.links?.last);
  const totalItems =
    lastOffset === null || lastOffset === pageOffset
      ? pageOffset + vehicles.length
      : lastOffset + pageSize;
  const lastPage =
    lastOffset === null ? page : Math.floor(lastOffset / pageSize);

  const handlePageSizeChange = useCallback(
    (nextPageSize: number) => {
      if (nextPageSize === pageSize) {
        return;
      }

      updateSearch({ page: 0, pageSize: nextPageSize });
    },
    [pageSize, updateSearch],
  );

  const handleRouteChange = useCallback(
    (nextRoutes: string[]) => {
      updateSearch({
        page: 0,
        route: nextRoutes.length > 0 ? nextRoutes : undefined,
        trip: undefined,
      });
    },
    [updateSearch],
  );

  const handleTripChange = useCallback(
    (nextTrips: string[]) => {
      updateSearch(
        {
          page: 0,
          trip: nextTrips.length > 0 ? nextTrips.join(",") : undefined,
        },
        true,
      );
    },
    [updateSearch],
  );

  useEffect(() => {
    if (vehicles.length === 0 && page > lastPage) {
      updateSearch({ page: lastPage }, true);
    }
  }, [lastPage, page, updateSearch, vehicles.length]);

  const filterBar = (
    <div className="mb-4 space-y-3 sm:flex sm:items-center sm:justify-end sm:gap-3 sm:space-y-0">
      <Dropdown
        label="Route"
        ariaLabel="Filter by route"
        value={selectedRoutes}
        onChange={handleRouteChange}
        options={routeOptions}
        placeholder="All routes"
        emptyText="No routes found"
        isLoading={routesInfiniteQuery.isPending}
        isLoadingMore={routesInfiniteQuery.isFetchingNextPage}
        hasMore={routesInfiniteQuery.hasNextPage}
        onLoadMore={() => void routesInfiniteQuery.fetchNextPage()}
        className="sm:w-[260px]"
        multipleSelect={true}
      />
      <Dropdown
        label="Trip"
        ariaLabel="Filter by trip"
        options={tripOptions}
        value={selectedTrips}
        onChange={handleTripChange}
        placeholder={routeFilter ? "All trips" : "Select a route first"}
        emptyText="No trips found"
        isLoading={tripsInfiniteQuery.isPending}
        isLoadingMore={tripsInfiniteQuery.isFetchingNextPage}
        hasMore={tripsInfiniteQuery.hasNextPage}
        onLoadMore={() => void tripsInfiniteQuery.fetchNextPage()}
        disabled={routeFilter === undefined}
        multipleSelect={true}
      />
    </div>
  );

  return (
    <>
      {filterBar}
      {vehiclesQuery.isPending || vehiclesQuery.isFetching ? (
        <section
          aria-busy="true"
          aria-label="Loading fleet data"
          className={GRID_CLASSES}
        >
          {Array.from({ length: pageSize }, (_, index) => (
            <ArmadaLoading key={index} />
          ))}
        </section>
      ) : vehiclesQuery.isError ? (
        <ArmadaError
          onRetry={() => void vehiclesQuery.refetch()}
          isFetching={vehiclesQuery.isFetching}
        />
      ) : vehicles.length > 0 ? (
        <section aria-label="Fleet list" className={GRID_CLASSES}>
          {vehicles.map((vehicle) => (
            <ArmadaCard
              key={vehicle.id}
              vehicle={vehicle}
              route={getRoute(vehicle.relationships.route.data?.id ?? "")}
              stop={getStop(vehicle.relationships.stop.data?.id ?? "")}
              onDetailClick={() => {
                setArmadaModalOpen(true)
                setVehicleId(vehicle.id)
              }}
            />
          ))}
        </section>
      ) : (
        <ArmadaEmpty />
      )}
      {vehiclesQuery.isPending ||
      vehiclesQuery.isError ||
      vehiclesQuery.isFetching ? null : (
        <div className="mt-6">
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            itemLabel="vehicles"
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
      <ArmadaModal
        open={armadaModalOpen}
        onClose={() => setArmadaModalOpen(false)}
        vehicleId={vehicleId}
      />
    </>
  );
};

export default ArmadaPage;
