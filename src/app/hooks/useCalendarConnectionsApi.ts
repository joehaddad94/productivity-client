import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calendarConnectionsApi } from "@/lib/api/calendar-connections-api";

const CONNECTIONS_KEY = ["calendar-connections"];
const EVENTS_KEY = (start: string, end: string) => ["calendar-events", start, end];

export function useCalendarConnectionsQuery() {
  return useQuery({
    queryKey: CONNECTIONS_KEY,
    queryFn: () => calendarConnectionsApi.list(),
  });
}

export function useDisconnectCalendarMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: "google" | "microsoft") =>
      calendarConnectionsApi.disconnect(provider),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONNECTIONS_KEY });
    },
  });
}

export function useCalendarEventsQuery(start: string, end: string, enabled = true) {
  return useQuery({
    queryKey: EVENTS_KEY(start, end),
    queryFn: () => calendarConnectionsApi.getEvents(start, end),
    enabled,
    staleTime: 5 * 60_000, // 5 minutes
  });
}
