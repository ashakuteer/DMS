import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { fetchWithAuth } from "@/lib/auth";
import type { TimelineItem } from "../types";

const PAGE_SIZE = 20;

export function useDonorTimeline(donorId: string, enabled: boolean = false) {
  const [allItems, setAllItems] = useState<TimelineItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const [timelineStartDate, setTimelineStartDate] = useState("");
  const [timelineEndDate, setTimelineEndDate] = useState("");
  const [timelineTypeFilter, setTimelineTypeFilter] = useState<string[]>([]);
  const [timelinePage, setTimelinePage] = useState(1);

  const hasFetched = useRef(false);

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (timelineStartDate) {
      items = items.filter((i) => i.date >= timelineStartDate);
    }
    if (timelineEndDate) {
      items = items.filter((i) => i.date <= timelineEndDate);
    }
    if (timelineTypeFilter.length > 0) {
      items = items.filter((i) => timelineTypeFilter.includes(i.type));
    }
    return items;
  }, [allItems, timelineStartDate, timelineEndDate, timelineTypeFilter]);

  const timelineTotal = filteredItems.length;
  const timelineTotalPages = Math.max(1, Math.ceil(timelineTotal / PAGE_SIZE));
  const timelineItems = filteredItems.slice(
    (timelinePage - 1) * PAGE_SIZE,
    timelinePage * PAGE_SIZE
  );

  const timelineTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allItems.forEach((i) => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });
    return counts;
  }, [allItems]);

  const fetchTimeline = useCallback(async (
    _page?: number,
    _types?: string[],
    _startDate?: string,
    _endDate?: string,
  ) => {
    setTimelineLoading(true);
    try {
      const res = await fetchWithAuth(`/api/donors/${donorId}/timeline?limit=500`);
      if (res.ok) {
        const data = await res.json();
        setAllItems(data.items || []);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setTimelineLoading(false);
    }
  }, [donorId]);

  useEffect(() => {
    if (enabled && !hasFetched.current) {
      hasFetched.current = true;
      fetchTimeline();
    }
  }, [enabled, fetchTimeline]);

  return {
    timelineItems,
    timelineLoading,
    timelineStartDate,
    timelineEndDate,
    timelineTypeFilter,
    timelineTypeCounts,
    timelinePage,
    timelineTotal,
    timelineTotalPages,
    setTimelineStartDate,
    setTimelineEndDate,
    setTimelineTypeFilter,
    fetchTimeline,
  };
}
