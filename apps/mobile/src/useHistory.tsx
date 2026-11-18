import React, { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  errorMessage,
  historyPageSize,
  type HistoryCursor,
} from "../../../shared/contracts";
import { Action, Note } from "./ui";

export function useHistory<T extends HistoryCursor>(
  loader: (after?: HistoryCursor) => Promise<T[]>,
  deps: React.DependencyList,
) {
  // Callers supply the API, actor and filters that identify this history.
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  const fetchPage = useCallback(loader, deps);
  const [value, setValue] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const busy = useRef(true);
  const cursor = useRef<HistoryCursor | undefined>(undefined);
  useFocusEffect(
    useCallback(() => {
      const current = ++generation.current;
      void revision;
      busy.current = true;
      cursor.current = undefined;
      setValue(null);
      setLoading(true);
      setError("");
      setLoadingMore(false);
      setMoreError("");
      setHasMore(false);
      void fetchPage()
        .then((page) => {
          if (generation.current !== current) return;
          setValue(page);
          cursor.current = page.length
            ? { id: page.at(-1)!.id, createdAt: page.at(-1)!.createdAt }
            : undefined;
          setHasMore(page.length === historyPageSize);
        })
        .catch((e) => {
          if (generation.current === current) setError(errorMessage(e));
        })
        .finally(() => {
          if (generation.current === current) {
            busy.current = false;
            setLoading(false);
          }
        });
      return () => {
        generation.current++;
      };
    }, [fetchPage, revision]),
  );
  const more = async () => {
    if (busy.current || !hasMore || !cursor.current) return;
    const current = generation.current;
    busy.current = true;
    setLoadingMore(true);
    setMoreError("");
    try {
      const page = await fetchPage(cursor.current);
      if (current !== generation.current) return;
      setValue((items) => {
        const ids = new Set(items?.map((item) => item.id));
        return [...(items ?? []), ...page.filter((item) => !ids.has(item.id))];
      });
      if (page.length)
        cursor.current = {
          id: page.at(-1)!.id,
          createdAt: page.at(-1)!.createdAt,
        };
      setHasMore(page.length === historyPageSize);
    } catch (e) {
      if (current === generation.current) setMoreError(errorMessage(e));
    } finally {
      if (current === generation.current) {
        busy.current = false;
        setLoadingMore(false);
      }
    }
  };
  return {
    value,
    loading,
    error,
    reload: () => setRevision((x) => x + 1),
    more,
    hasMore,
    loadingMore,
    moreError,
    update: (id: string, changes: Partial<T>) =>
      setValue(
        (items) =>
          items?.map((item) =>
            item.id === id ? { ...item, ...changes } : item,
          ) ?? null,
      ),
  };
}

export function HistoryMore({
  hasMore,
  loadingMore,
  moreError,
  more,
}: {
  hasMore: boolean;
  loadingMore: boolean;
  moreError: string;
  more: () => Promise<void>;
}) {
  return (
    <>
      {!!moreError && <Note error>{moreError}</Note>}
      {hasMore && (
        <Action secondary busy={loadingMore} onPress={() => void more()}>
          {moreError ? "Coba muat lagi" : "Muat lebih banyak"}
        </Action>
      )}
    </>
  );
}
