import type { AppNotification, NotificationSettings } from '@/lib/types';

const API_BASE =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '';

function api(path: string, options: RequestInit = {}) {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  return fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',
  });
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

function getMessage(data: unknown): string {
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
  }
  return 'Request failed';
}

export const notificationsApi = {
  list: async (workspaceId: string): Promise<AppNotification[]> => {
    const res = await api(`/workspaces/${workspaceId}/notifications`);
    if (res.status === 401) return [];
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return data as AppNotification[];
  },

  unreadCount: async (workspaceId: string): Promise<number> => {
    const res = await api(`/workspaces/${workspaceId}/notifications/unread-count`);
    if (!res.ok) return 0;
    const data = await parseJson(res) as { count: number };
    return data.count ?? 0;
  },

  markRead: async (workspaceId: string, id: string): Promise<void> => {
    await api(`/workspaces/${workspaceId}/notifications/${id}/read`, { method: 'PATCH' });
  },

  markAllRead: async (workspaceId: string): Promise<void> => {
    await api(`/workspaces/${workspaceId}/notifications/read-all`, { method: 'POST' });
  },

  dismiss: async (workspaceId: string, id: string): Promise<void> => {
    await api(`/workspaces/${workspaceId}/notifications/${id}`, { method: 'DELETE' });
  },

  dismissAll: async (workspaceId: string): Promise<void> => {
    await api(`/workspaces/${workspaceId}/notifications`, { method: 'DELETE' });
  },

  getSettings: async (): Promise<NotificationSettings> => {
    const res = await api('/notifications/settings');
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return data as NotificationSettings;
  },

  updateSettings: async (dto: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    const res = await api('/notifications/settings', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
    const data = await parseJson(res);
    if (!res.ok) throw new Error(getMessage(data));
    return data as NotificationSettings;
  },

  getVapidPublicKey: async (): Promise<string> => {
    const res = await api('/notifications/vapid-public-key');
    if (!res.ok) return '';
    const data = await parseJson(res) as { publicKey: string };
    return data.publicKey ?? '';
  },

  savePushSubscription: async (sub: { endpoint: string; p256dh: string; auth: string }): Promise<void> => {
    await api('/notifications/push-subscription', {
      method: 'POST',
      body: JSON.stringify(sub),
    });
  },

  deletePushSubscription: async (endpoint: string): Promise<void> => {
    await api('/notifications/push-subscription', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    });
  },
};
