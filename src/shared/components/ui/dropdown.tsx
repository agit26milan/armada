import {
  memo,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, KeyboardEvent, ReactElement } from "react";

import { ChevronDownIcon, SearchIcon } from "@/shared/components/icons";
import { cn } from "@/shared/lib/cn";

const TRIGGER_CLASSES =
  "inline-flex h-10 w-full items-center gap-2.5 rounded-control border border-line bg-surface px-3.5 text-left shadow-card transition-colors hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-55";

const MENU_CLASSES =
  "absolute top-[calc(100%+6px)] z-40 flex max-h-64 w-full min-w-0 flex-col overflow-y-auto rounded-card border border-line bg-surface p-1 shadow-float";

const OPTION_CLASSES =
  "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink transition-colors";

const EMPTY_FOOTER_CLASSES =
  "flex h-9 shrink-0 items-center justify-center gap-2 text-[11px] font-medium text-ink-subtle";

const SPINNER_CLASSES =
  "size-3 animate-spin rounded-full border-2 border-ink-subtle border-r-transparent";

const SEARCH_WRAPPER_CLASSES =
  "sticky top-0 z-10 -mx-1 -mt-1 mb-1 border-b border-line bg-surface px-1 pt-1 pb-1.5";

const SEARCH_FIELD_CLASSES =
  "flex h-8 items-center gap-2 rounded-lg bg-surface-muted px-2";

const SEARCH_INPUT_CLASSES =
  "h-full w-full min-w-0 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-subtle";

export interface DropdownOption<TValue extends string | number> {
  value: TValue;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface DropdownBaseProps<TValue extends string | number> {
  options: readonly DropdownOption<TValue>[];
  label?: string;
  placeholder?: string;
  emptyText?: string;
  loadingText?: string;
  loadingMoreText?: string;
  fallbackLabel?: string;
  hasMore?: boolean;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  align?: "start" | "end";
  ariaLabel?: string;
  className?: string;
  menuClassName?: string;
  search?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export interface SingleDropdownProps<
  TValue extends string | number,
> extends DropdownBaseProps<TValue> {
  multipleSelect?: false;
  value: TValue | null;
  onChange: (value: TValue) => void;
}

export interface MultiDropdownProps<
  TValue extends string | number,
> extends DropdownBaseProps<TValue> {
  multipleSelect: true;
  value: readonly TValue[];
  onChange: (value: TValue[]) => void;
  maxSelected?: number;
}

export type DropdownProps<TValue extends string | number> =
  SingleDropdownProps<TValue> | MultiDropdownProps<TValue>;

interface DropdownComponent {
  <TValue extends string | number>(props: SingleDropdownProps<TValue>): ReactElement;
  <TValue extends string | number>(props: MultiDropdownProps<TValue>): ReactElement;
}

function toSelectedValues<TValue extends string | number>(
  props: DropdownProps<TValue>,
): readonly TValue[] {
  if (props.multipleSelect) {
    return props.value;
  }

  return props.value === null ? [] : [props.value];
}

function filterOptions<TValue extends string | number>(
  options: readonly DropdownOption<TValue>[],
  query: string,
): readonly DropdownOption<TValue>[] {
  const needle = query.trim().toLowerCase();

  if (needle.length === 0) {
    return options;
  }

  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(needle) ||
      (option.description?.toLowerCase().includes(needle) ?? false),
  );
}

function firstEnabledIndex<TValue extends string | number>(
  options: readonly DropdownOption<TValue>[],
): number {
  return options.findIndex((option) => !option.disabled);
}

function DropdownBase<TValue extends string | number>(
  props: DropdownProps<TValue>,
) {
  const {
    options,
    label,
    placeholder = "Select",
    emptyText = "No options",
    loadingText = "Loading…",
    loadingMoreText = "Loading more…",
    fallbackLabel,
    hasMore = false,
    isLoading = false,
    isLoadingMore = false,
    onLoadMore,
    onOpenChange,
    disabled = false,
    align = "start",
    ariaLabel,
    className,
    menuClassName,
    search = false,
    searchPlaceholder = "Search…",
    onSearch,
  } = props;

  const multiple = props.multipleSelect === true;
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestedLengthRef = useRef(-1);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [query, setQuery] = useState("");

  const selectedValues = useMemo(() => toSelectedValues(props), [props]);
  const selectedSet = useMemo(
    () => new Set<TValue>(selectedValues),
    [selectedValues],
  );
  const hasQuery = query.trim().length > 0;
  const serverFiltered = onSearch !== undefined;
  const visibleOptions = useMemo(
    () => (search && !serverFiltered ? filterOptions(options, query) : options),
    [options, query, search, serverFiltered],
  );
  const hasOptions = visibleOptions.length > 0;

  const selectedLabel = useMemo(() => {
    if (selectedValues.length === 0) {
      return fallbackLabel;
    }

    const labels = selectedValues.map((selectedValue) => {
      const option = options.find((item) => item.value === selectedValue);

      return option?.label ?? String(selectedValue);
    });
    return labels.join(", ");
  }, [fallbackLabel, options, selectedValues]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
    setQuery("");
    onSearch?.("");
    onOpenChange?.(false);
  }, [onOpenChange, onSearch]);

  const openMenu = useCallback(
    (preferredIndex: number) => {
      if (disabled) {
        return;
      }

      const selectedIndex = visibleOptions.findIndex((option) =>
        selectedSet.has(option.value),
      );
      const requested = preferredIndex >= 0 ? preferredIndex : selectedIndex;
      const target =
        requested >= 0 && !visibleOptions[requested]?.disabled
          ? requested
          : firstEnabledIndex(visibleOptions);

      setOpen(true);
      setActiveIndex(target);
      onOpenChange?.(true);
    },
    [disabled, onOpenChange, selectedSet, visibleOptions],
  );

  const requestMore = useCallback(() => {
    if (!open || !hasMore || isLoading || isLoadingMore || !onLoadMore) {
      return;
    }

    if (search && !serverFiltered && hasQuery) {
      return;
    }

    if (requestedLengthRef.current === options.length) {
      return;
    }

    requestedLengthRef.current = options.length;
    onLoadMore();
  }, [
    hasMore,
    hasQuery,
    isLoading,
    isLoadingMore,
    onLoadMore,
    open,
    options.length,
    search,
    serverFiltered,
  ]);

  const moveActive = useCallback(
    (step: 1 | -1) => {
      if (!hasOptions) {
        return;
      }

      const start = activeIndex < 0 ? (step > 0 ? -1 : 0) : activeIndex;

      for (let offset = 1; offset <= visibleOptions.length; offset += 1) {
        const next =
          (((start + step * offset) % visibleOptions.length) +
            visibleOptions.length) %
          visibleOptions.length;

        if (!visibleOptions[next].disabled) {
          setActiveIndex(next);

          return;
        }
      }
    },
    [activeIndex, hasOptions, visibleOptions],
  );

  const moveToEdge = useCallback(
    (edge: "start" | "end") => {
      if (!hasOptions) {
        return;
      }

      for (let step = 0; step < visibleOptions.length; step += 1) {
        const index =
          edge === "start" ? step : visibleOptions.length - 1 - step;

        if (!visibleOptions[index].disabled) {
          setActiveIndex(index);

          return;
        }
      }
    },
    [hasOptions, visibleOptions],
  );

  const selectIndex = useCallback(
    (index: number) => {
      const option = visibleOptions[index];

      if (!option || option.disabled) {
        return;
      }

      if (props.multipleSelect) {
        const isSelected = selectedSet.has(option.value);
        const next = isSelected
          ? selectedValues.filter(
              (selectedValue) => selectedValue !== option.value,
            )
          : [...selectedValues, option.value];

        if (
          !isSelected &&
          props.maxSelected !== undefined &&
          next.length > props.maxSelected
        ) {
          return;
        }

        props.onChange(next);

        return;
      }

      props.onChange(option.value);
      closeMenu();
      triggerRef.current?.focus();
    },
    [closeMenu, props, selectedSet, selectedValues, visibleOptions],
  );

  const handleQueryChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextQuery = event.target.value;
      setQuery(nextQuery);
      if (onSearch) {
        setActiveIndex(-1);
        onSearch(nextQuery);

        return;
      }

      const nextOptions = filterOptions(options, nextQuery);
      setActiveIndex(firstEnabledIndex(nextOptions));
    },
    [onSearch, options],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) {
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();

        if (!open) {
          openMenu(-1);

          return;
        }

        moveActive(event.key === "ArrowDown" ? 1 : -1);

        return;
      }

      if (!open) {
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectIndex(activeIndex);

        return;
      }

      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        moveToEdge(event.key === "Home" ? "start" : "end");

        return;
      }

      if (event.key === "Escape" || event.key === "Tab") {
        closeMenu();
      }
    },
    [
      activeIndex,
      closeMenu,
      disabled,
      moveToEdge,
      moveActive,
      open,
      openMenu,
      selectIndex,
    ],
  );

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        moveActive(event.key === "ArrowDown" ? 1 : -1);

        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        selectIndex(activeIndex);

        return;
      }

      if (
        (event.key === "Home" || event.key === "End") &&
        event.currentTarget.value.length === 0
      ) {
        event.preventDefault();
        moveToEdge(event.key === "Home" ? "start" : "end");

        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        triggerRef.current?.focus();

        return;
      }

      if (event.key === "Tab") {
        closeMenu();
      }
    },
    [activeIndex, closeMenu, moveActive, moveToEdge, selectIndex],
  );

  useEffect(() => {
    if (!open) {
      requestedLengthRef.current = -1;

      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        listRef.current?.contains(target)
      ) {
        return;
      }

      closeMenu();
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [closeMenu, open]);

  useEffect(() => {
    if (!open || !search) {
      return;
    }

    searchRef.current?.focus();
  }, [open, search]);

  useEffect(() => {
    setActiveIndex((current) =>
      current >= visibleOptions.length ? -1 : current,
    );
  }, [visibleOptions.length]);

  useEffect(() => {
    if (!open || activeIndex < 0) {
      return;
    }

    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );

    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  useEffect(() => {
    if (
      !open ||
      activeIndex < 0 ||
      !hasMore ||
      activeIndex < visibleOptions.length - 1
    ) {
      return;
    }

    requestMore();
  }, [activeIndex, hasMore, open, requestMore, visibleOptions.length]);

  useEffect(() => {
    const root = listRef.current;
    const sentinel = sentinelRef.current;

    if (!open || !root || !sentinel || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          requestMore();
        }
      },
      { root, rootMargin: "96px 0px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, open, options.length, requestMore]);

  return (
    <div className="relative w-full sm:w-auto">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? closeMenu() : openMenu(-1))}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={
          open && activeIndex >= 0
            ? `${listboxId}-option-${activeIndex}`
            : undefined
        }
        aria-label={ariaLabel ?? label}
        className={cn(TRIGGER_CLASSES, className)}
      >
        {label ? (
          <span className="shrink-0 text-[12px] font-medium text-ink-subtle">
            {label}
          </span>
        ) : null}
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-[13px] font-bold",
            selectedLabel ? "text-ink" : "text-ink-subtle",
          )}
        >
          {selectedLabel ?? placeholder}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-3.5 shrink-0 text-ink-subtle transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          ref={listRef}
          className={cn(
            MENU_CLASSES,
            align === "end" ? "right-0" : "left-0",
            menuClassName,
          )}
        >
          {search ? (
            <div className={SEARCH_WRAPPER_CLASSES}>
              <div className={SEARCH_FIELD_CLASSES}>
                <SearchIcon className="size-3.5 shrink-0 text-ink-subtle" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  aria-controls={listboxId}
                  aria-activedescendant={
                    activeIndex >= 0
                      ? `${listboxId}-option-${activeIndex}`
                      : undefined
                  }
                  aria-autocomplete="list"
                  role="combobox"
                  aria-expanded={open}
                  className={SEARCH_INPUT_CLASSES}
                />
              </div>
            </div>
          ) : null}

          <div
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel ?? label ?? placeholder}
            aria-multiselectable={multiple || undefined}
          >
            {isLoading && !hasOptions ? (
              <div className={EMPTY_FOOTER_CLASSES}>
                <span className={SPINNER_CLASSES} aria-hidden="true" />
                {loadingText}
              </div>
            ) : null}

            {!isLoading && !hasOptions ? (
              <div className={cn(EMPTY_FOOTER_CLASSES, "h-11")}>
                {emptyText}
              </div>
            ) : null}

            {visibleOptions.map((option, index) => {
              const isSelected = selectedSet.has(option.value);

              return (
                <div
                  key={String(option.value)}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  data-index={index}
                  onClick={() => selectIndex(index)}
                  onPointerMove={() => {
                    if (!option.disabled) {
                      setActiveIndex(index);
                    }
                  }}
                  className={cn(
                    OPTION_CLASSES,
                    index === activeIndex &&
                      !option.disabled &&
                      "bg-surface-muted",
                    isSelected && "font-semibold",
                    option.disabled && "cursor-not-allowed opacity-45",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    {option.description ? (
                      <span className="block truncate text-[11px] font-normal text-ink-subtle">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
                  {isSelected ? (
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-[11px] text-accent"
                    >
                      ✓
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {hasMore ? (
            <div ref={sentinelRef} className={EMPTY_FOOTER_CLASSES}>
              {isLoadingMore ? (
                <>
                  <span className={SPINNER_CLASSES} aria-hidden="true" />
                  {loadingMoreText}
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export const Dropdown = memo(DropdownBase) as unknown as DropdownComponent;
