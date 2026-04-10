"use client";

import { useState, useEffect } from "react";
import { User, Bell, Palette, Lock, Monitor, Sun, Moon, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Switch } from "@/app/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { useUpdateMeMutation } from "@/app/hooks/useAuthApi";
import { useNotificationSettingsQuery, useUpdateNotificationSettingsMutation } from "@/app/hooks/useNotificationsApi";
import { notificationsApi } from "@/lib/api/notifications-api";

export function Settings() {
  const { user } = useAuth();
  const updateMutation = useUpdateMeMutation({
    onSuccess: () => toast.success("Settings saved"),
    onError: (err) => toast.error(err.message),
  });

  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name ?? "");

  // Notification settings
  const { data: notifSettings } = useNotificationSettingsQuery();
  const updateNotifSettings = useUpdateNotificationSettingsMutation();
  const [pushLoading, setPushLoading] = useState(false);

  async function handlePushToggle(enabled: boolean) {
    if (!enabled) {
      // Unsubscribe
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await notificationsApi.deletePushSubscription(sub.endpoint);
          await sub.unsubscribe();
        }
        updateNotifSettings.mutate({ push: false });
      } catch {
        toast.error("Failed to disable push notifications");
      }
      return;
    }

    // Request permission + subscribe
    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied. Enable it in your browser settings.");
        return;
      }
      const vapidKey = await notificationsApi.getVapidPublicKey();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = sub.toJSON();
      const keys = json.keys as { p256dh: string; auth: string };
      await notificationsApi.savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
      updateNotifSettings.mutate({ push: true });
      toast.success("Push notifications enabled");
    } catch (err) {
      toast.error("Failed to enable push notifications");
      console.error(err);
    } finally {
      setPushLoading(false);
    }
  }

  // Keep form in sync if user data loads after mount
  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  const handleSave = () => {
    updateMutation.mutate({ name: name.trim() || undefined });
  };

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("") || "?";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Profile
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="size-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-medium">
              {initials}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={user?.email ?? ""}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Email cannot be changed — it is used for sign-in.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Notifications
          </CardTitle>
          <CardDescription>Choose how you want to be notified about tasks and reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* In-app */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">In-app notifications</Label>
              <p className="text-xs text-muted-foreground">Show a notification bell in the header</p>
            </div>
            <Switch
              checked={notifSettings?.inApp ?? true}
              onCheckedChange={(v) => updateNotifSettings.mutate({ inApp: v })}
              disabled={updateNotifSettings.isPending}
            />
          </div>

          <Separator />

          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Email notifications</Label>
              <p className="text-xs text-muted-foreground">Receive reminders by email at {user?.email}</p>
            </div>
            <Switch
              checked={notifSettings?.email ?? false}
              onCheckedChange={(v) => updateNotifSettings.mutate({ email: v })}
              disabled={updateNotifSettings.isPending}
            />
          </div>

          <Separator />

          {/* Push */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Browser push notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive alerts even when the tab is in the background
              </p>
            </div>
            {pushLoading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                checked={notifSettings?.push ?? false}
                onCheckedChange={handlePushToggle}
                disabled={updateNotifSettings.isPending || pushLoading}
              />
            )}
          </div>

          <Separator />

          {/* What triggers notifications */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              You will be notified about
            </Label>
            <ul className="text-xs text-muted-foreground space-y-1 ml-1">
              <li className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary flex-shrink-0" />
                Daily agenda at 8:00 AM (tasks due today + overdue count)
              </li>
              <li className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                Afternoon reminder at 2:00 PM for tasks due today
              </li>
              <li className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-destructive flex-shrink-0" />
                Daily overdue check at 9:00 AM
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <div className="flex gap-2">
              {(
                [
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    theme === value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security — UI only (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-5" />
            Privacy &amp; Security
          </CardTitle>
          <CardDescription>Manage your privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Security options coming soon.
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setName(user?.name ?? "")}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
