import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppNotification, NotificationSettings } from '@/lib/types';
import { notificationsApi } from '@/lib/api/notifications-api';

export type NotificationsPage = { items: AppNotification[]; total: number };

// Include take in key so different page sizes cache separately
const NOTIFICATIONS_KEY = (workspaceId: string, skip: number, take: number) =>
  ['notifications', workspaceId, skip, take] as const;

// Partial key used for broad invalidations / setQueriesData
const NOTIFICATIONS_PREFIX = (workspaceId: string) => ['notifications', workspaceId] as const;

const UNREAD_KEY = (workspaceId: string) => ['notifications-unread', workspaceId] as const;
const SETTINGS_KEY = ['notification-settings'] as const;

export function useNotificationsQuery(
  workspaceId: string | null | undefined,
  options?: { enabled?: boolean; skip?: number; take?: number; refetchWhenOpen?: boolean },
) {
  const skip = options?.skip ?? 0;
  const take = options?.take ?? 50;
  const isEnabled = (options?.enabled ?? true) && !!workspaceId;
  return useQuery<NotificationsPage>({
    queryKey: NOTIFICATIONS_KEY(workspaceId ?? '', skip, take),
    queryFn: () => notificationsApi.list(workspaceId!, skip, take),
    enabled: isEnabled,
    staleTime: 30_000,
    refetchInterval: options?.refetchWhenOpen ? 60_000 : false,
    placeholderData: (prev) => prev,
  });
}

export function useUnreadCountQuery(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: UNREAD_KEY(workspaceId ?? ''),
    queryFn: () => notificationsApi.unreadCount(workspaceId!),
    enabled: !!workspaceId,
    refetchInterval: 30_000,
  });
}

export function useMarkReadMutation(workspaceId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(workspaceId!, id),
    onSuccess: (_data, id) => {
      qc.setQueriesData<NotificationsPage>(
        { queryKey: NOTIFICATIONS_PREFIX(workspaceId ?? '') },
        (old) => old ? { ...old, items: old.items.map((n) => n.id === id ? { ...n, read: true } : n) } : old,
      );
      qc.invalidateQueries({ queryKey: UNREAD_KEY(workspaceId ?? '') });
    },
  });
}

export function useMarkAllReadMutation(workspaceId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(workspaceId!),
    onSuccess: () => {
      qc.setQueriesData<NotificationsPage>(
        { queryKey: NOTIFICATIONS_PREFIX(workspaceId ?? '') },
        (old) => old ? { ...old, items: old.items.map((n) => ({ ...n, read: true })) } : old,
      );
      qc.invalidateQueries({ queryKey: UNREAD_KEY(workspaceId ?? '') });
    },
  });
}

export function useDismissMutation(workspaceId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.dismiss(workspaceId!, id),
    onSuccess: (_data, id) => {
      qc.setQueriesData<NotificationsPage>(
        { queryKey: NOTIFICATIONS_PREFIX(workspaceId ?? '') },
        (old) => old ? { items: old.items.filter((n) => n.id !== id), total: Math.max(0, old.total - 1) } : old,
      );
      qc.invalidateQueries({ queryKey: UNREAD_KEY(workspaceId ?? '') });
    },
  });
}

export function useDismissAllMutation(workspaceId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.dismissAll(workspaceId!),
    onSuccess: () => {
      qc.setQueriesData<NotificationsPage>(
        { queryKey: NOTIFICATIONS_PREFIX(workspaceId ?? '') },
        () => ({ items: [], total: 0 }),
      );
      qc.invalidateQueries({ queryKey: UNREAD_KEY(workspaceId ?? '') });
    },
  });
}

export function useNotificationSettingsQuery() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => notificationsApi.getSettings(),
  });
}

export function useUpdateNotificationSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<NotificationSettings>) => notificationsApi.updateSettings(dto),
    onSuccess: (data) => {
      qc.setQueryData(SETTINGS_KEY, data);
    },
  });
}
