import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AppNotification, NotificationSettings } from '@/lib/types';
import { notificationsApi } from '@/lib/api/notifications-api';

const NOTIFICATIONS_KEY = (workspaceId: string, skip: number) => ['notifications', workspaceId, skip];
const UNREAD_KEY = (workspaceId: string) => ['notifications-unread', workspaceId];
const SETTINGS_KEY = ['notification-settings'];

export function useNotificationsQuery(
  workspaceId: string | null | undefined,
  options?: { enabled?: boolean; skip?: number; take?: number }
) {
  const isEnabled = options?.enabled ?? true;
  const skip = options?.skip ?? 0;
  const take = options?.take ?? 50;
  return useQuery({
    queryKey: NOTIFICATIONS_KEY(workspaceId ?? '', skip),
    queryFn: () => notificationsApi.list(workspaceId!, skip, take),
    enabled: !!workspaceId && isEnabled,
    refetchInterval: isEnabled ? 60_000 : false,
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
      // Optimistically update all pages
      qc.setQueriesData<AppNotification[]>(
        { queryKey: ['notifications', workspaceId ?? ''] },
        (old) => old?.map((n) => n.id === id ? { ...n, read: true } : n),
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
      qc.setQueriesData<AppNotification[]>(
        { queryKey: ['notifications', workspaceId ?? ''] },
        (old) => old?.map((n) => ({ ...n, read: true })),
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
      qc.setQueriesData<AppNotification[]>(
        { queryKey: ['notifications', workspaceId ?? ''] },
        (old) => old?.filter((n) => n.id !== id),
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
      qc.setQueriesData<AppNotification[]>(
        { queryKey: ['notifications', workspaceId ?? ''] },
        () => [],
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
