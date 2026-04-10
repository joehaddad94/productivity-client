import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationSettings } from '@/lib/types';
import { notificationsApi } from '@/lib/api/notifications-api';

const NOTIFICATIONS_KEY = (workspaceId: string) => ['notifications', workspaceId];
const UNREAD_KEY = (workspaceId: string) => ['notifications-unread', workspaceId];
const SETTINGS_KEY = ['notification-settings'];

export function useNotificationsQuery(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY(workspaceId ?? ''),
    queryFn: () => notificationsApi.list(workspaceId!),
    enabled: !!workspaceId,
    refetchInterval: 60_000, // poll every 60s
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY(workspaceId ?? '') });
      qc.invalidateQueries({ queryKey: UNREAD_KEY(workspaceId ?? '') });
    },
  });
}

export function useMarkAllReadMutation(workspaceId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(workspaceId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY(workspaceId ?? '') });
      qc.invalidateQueries({ queryKey: UNREAD_KEY(workspaceId ?? '') });
    },
  });
}

export function useDismissMutation(workspaceId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.dismiss(workspaceId!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY(workspaceId ?? '') });
      qc.invalidateQueries({ queryKey: UNREAD_KEY(workspaceId ?? '') });
    },
  });
}

export function useDismissAllMutation(workspaceId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.dismissAll(workspaceId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY(workspaceId ?? '') });
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
