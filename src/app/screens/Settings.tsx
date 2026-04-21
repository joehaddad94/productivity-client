"use client";

import { useState, useEffect, useRef } from "react";
import { User, Bell, Palette, Lock, Monitor, Sun, Moon, Loader2, CalendarDays, Check, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Switch } from "@/app/components/ui/switch";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/components/ui/utils";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { useUpdateMeMutation } from "@/app/hooks/useAuthApi";
import { useNotificationSettingsQuery, useUpdateNotificationSettingsMutation } from "@/app/hooks/useNotificationsApi";
import { notificationsApi } from "@/lib/api/notifications-api";
import { useCalendarConnectionsQuery, useDisconnectCalendarMutation } from "@/app/hooks/useCalendarConnectionsApi";
import { calendarConnectionsApi } from "@/lib/api/calendar-connections-api";

type TabId = "profile" | "notifications" | "calendars" | "appearance" | "security";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "calendars", label: "Calendars", icon: CalendarDays },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: Lock },
];

export function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const updateMutation = useUpdateMeMutation({
    onSuccess: () => toast.success("Settings saved"),
    onError: (err) => toast.error(err.message),
  });

  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name ?? "");

  const { data: calendarConnections = [] } = useCalendarConnectionsQuery();
  const disconnectMutation = useDisconnectCalendarMutation();

  const calendarToastShown = useRef(false);
  useEffect(() => {
    if (calendarToastShown.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendar") === "connected") {
      const provider = params.get("provider");
      const label = provider === "google" ? "Google" : provider === "microsoft" ? "Microsoft" : "Calendar";
      toast.success(`${label} Calendar connected`);
      calendarToastShown.current = true;
      const url = new URL(window.location.href);
      url.searchParams.delete("calendar");
      url.searchParams.delete("provider");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const { data: notifSettings } = useNotificationSettingsQuery();
  const updateNotifSettings = useUpdateNotificationSettingsMutation();
  const [pushLoading, setPushLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  async function handleSendTestPush() {
    setTestLoading(true);
    try {
      await notificationsApi.sendTestPush();
      toast.success("Test notification sent — check your browser");
    } catch {
      toast.error("Failed to send test notification");
    } finally {
      setTestLoading(false);
    }
  }

  async function handlePushToggle(enabled: boolean) {
    if (!enabled) {
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

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0].toUpperCase())
      .slice(0, 2)
      .join("") || "?";

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <div className="flex gap-8">
        {/* Left nav */}
        <nav className="flex flex-col gap-0.5 w-40 shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer",
                activeTab === id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Profile */}
          {activeTab === "profile" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold mb-0.5">Profile</h2>
                <p className="text-xs text-muted-foreground">Update your personal information</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-medium">
                  {initials}
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="display-name" className="text-xs font-medium">Display Name</Label>
                  <Input id="display-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Email</Label>
                  <Input type="email" value={user?.email ?? ""} disabled className="opacity-60 cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed — it is used for sign-in.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button onClick={() => updateMutation.mutate({ name: name.trim() || undefined })} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                  Save changes
                </Button>
                <Button variant="ghost" onClick={() => setName(user?.name ?? "")}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold mb-0.5">Notifications</h2>
                <p className="text-xs text-muted-foreground">Choose how you want to be notified</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">In-app notifications</p>
                    <p className="text-xs text-muted-foreground">Show a notification bell in the header</p>
                  </div>
                  <Switch
                    checked={notifSettings?.inApp ?? true}
                    onCheckedChange={(v) => updateNotifSettings.mutate({ inApp: v })}
                    disabled={updateNotifSettings.isPending}
                  />
                </div>
                <Separator className="opacity-40" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Email notifications</p>
                    <p className="text-xs text-muted-foreground">Receive reminders at {user?.email}</p>
                  </div>
                  <Switch
                    checked={notifSettings?.email ?? false}
                    onCheckedChange={(v) => updateNotifSettings.mutate({ email: v })}
                    disabled={updateNotifSettings.isPending}
                  />
                </div>
                <Separator className="opacity-40" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Browser push</p>
                    <p className="text-xs text-muted-foreground">Alerts even when the tab is in background</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notifSettings?.push && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleSendTestPush}
                        disabled={testLoading}
                      >
                        {testLoading ? <Loader2 className="size-3 animate-spin" /> : "Send test"}
                      </Button>
                    )}
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
                </div>
              </div>

              <Separator className="opacity-40" />

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Daily agenda time</p>
                  <p className="text-xs text-muted-foreground mb-2">When to send your daily task summary</p>
                  <input
                    type="time"
                    value={notifSettings?.dailyAgendaTime ?? "08:00"}
                    onChange={(e) => updateNotifSettings.mutate({ dailyAgendaTime: e.target.value })}
                    className="h-8 rounded-md border border-border bg-input-background px-3 text-xs [color-scheme:light] dark:[color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium">Quiet hours</p>
                  <p className="text-xs text-muted-foreground mb-2">Suppress push notifications during these hours</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={notifSettings?.quietHoursStart ?? ""}
                      onChange={(e) => updateNotifSettings.mutate({ quietHoursStart: e.target.value || null })}
                      className="h-8 rounded-md border border-border bg-input-background px-3 text-xs [color-scheme:light] dark:[color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <input
                      type="time"
                      value={notifSettings?.quietHoursEnd ?? ""}
                      onChange={(e) => updateNotifSettings.mutate({ quietHoursEnd: e.target.value || null })}
                      className="h-8 rounded-md border border-border bg-input-background px-3 text-xs [color-scheme:light] dark:[color-scheme:dark] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    />
                    {(notifSettings?.quietHoursStart || notifSettings?.quietHoursEnd) && (
                      <button
                        type="button"
                        onClick={() => updateNotifSettings.mutate({ quietHoursStart: null, quietHoursEnd: null })}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">You will be notified about</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary shrink-0" />Daily agenda (at your configured time, in your timezone)</li>
                  <li className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-amber-500 shrink-0" />Afternoon reminder at 2:00 PM local time</li>
                  <li className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-destructive shrink-0" />Overdue check at 9:00 AM local time</li>
                </ul>
              </div>
            </div>
          )}

          {/* Calendars */}
          {activeTab === "calendars" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold mb-0.5">Connected Calendars</h2>
                <p className="text-xs text-muted-foreground">See external events alongside your tasks</p>
              </div>

              <div className="space-y-3">
                {/* Google */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-white border flex items-center justify-center shadow-sm">
                      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Google Calendar</p>
                      {calendarConnections.find((c) => c.provider === "google") ? (
                        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mt-0.5">
                          <Check className="size-2.5 mr-1" /> Connected
                        </Badge>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>
                  {calendarConnections.find((c) => c.provider === "google") ? (
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={disconnectMutation.isPending}
                      onClick={() => disconnectMutation.mutate("google", { onSuccess: () => toast.success("Google Calendar disconnected"), onError: (e) => toast.error(e.message) })}>
                      <Trash2 className="size-3.5 mr-1.5" />Disconnect
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => { window.location.href = calendarConnectionsApi.getGoogleAuthUrl(); }}>Connect</Button>
                  )}
                </div>

                {/* Microsoft */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-white border flex items-center justify-center shadow-sm">
                      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                        <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                        <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
                        <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
                        <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Microsoft Calendar</p>
                      {calendarConnections.find((c) => c.provider === "microsoft") ? (
                        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mt-0.5">
                          <Check className="size-2.5 mr-1" /> Connected
                        </Badge>
                      ) : (
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>
                  {calendarConnections.find((c) => c.provider === "microsoft") ? (
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={disconnectMutation.isPending}
                      onClick={() => disconnectMutation.mutate("microsoft", { onSuccess: () => toast.success("Microsoft Calendar disconnected"), onError: (e) => toast.error(e.message) })}>
                      <Trash2 className="size-3.5 mr-1.5" />Disconnect
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => { window.location.href = calendarConnectionsApi.getMicrosoftAuthUrl(); }}>Connect</Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === "appearance" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold mb-0.5">Appearance</h2>
                <p className="text-xs text-muted-foreground">Customize the look and feel</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Theme</Label>
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
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border transition-colors cursor-pointer",
                        theme === value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === "security" && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold mb-0.5">Privacy &amp; Security</h2>
                <p className="text-xs text-muted-foreground">Manage your privacy settings</p>
              </div>
              <p className="text-sm text-muted-foreground">Security options coming soon.</p>
            </div>
          )}
        </div>
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
