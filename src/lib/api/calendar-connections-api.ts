/**
 * Calendar Connections API client.
 * Base: {NEXT_PUBLIC_API_URL}/calendar-connections
 */
import { api, getMessage, parseJson, throwApiError } from "./client";

export interface CalendarConnectionInfo {
  id: string;
  provider: "google" | "microsoft";
  createdAt: string;
  expiresAt: string | null;
}

export interface ExternalCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  provider: "google" | "microsoft";
  url?: string;
}

export const calendarConnectionsApi = {
  list: async (): Promise<CalendarConnectionInfo[]> => {
    const res = await api("/calendar-connections");
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return data as CalendarConnectionInfo[];
  },

  getGoogleAuthUrl: async (): Promise<string> => {
    const res = await api("/calendar-connections/google/auth");
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { url: string }).url;
  },

  getMicrosoftAuthUrl: async (): Promise<string> => {
    const res = await api("/calendar-connections/microsoft/auth");
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return (data as { url: string }).url;
  },

  disconnect: async (provider: "google" | "microsoft"): Promise<void> => {
    const res = await api(`/calendar-connections/${provider}`, {
      method: "DELETE",
    });
    if (res.ok) return;
    const data = await parseJson(res);
    throw new Error(getMessage(data));
  },

  getEvents: async (start: string, end: string): Promise<ExternalCalendarEvent[]> => {
    const qs = new URLSearchParams({ start, end });
    const res = await api(`/calendar-connections/events?${qs}`);
    const data = await parseJson(res);
    if (!res.ok) throwApiError(res, data);
    return data as ExternalCalendarEvent[];
  },
};
