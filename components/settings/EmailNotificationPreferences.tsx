'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Mail, Loader2 } from 'lucide-react';

export default function EmailNotificationPreferences() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    email_everyone_mentions: true,
    email_username_mentions: true,
    email_new_members: true,
  });

  useEffect(() => {
    fetch('/api/settings/notification-preferences')
      .then((res) => res.ok ? res.json() : Promise.reject(new Error('Failed to load')))
      .then((data) => {
        setPrefs({
          email_everyone_mentions: data.email_everyone_mentions ?? true,
          email_username_mentions: data.email_username_mentions ?? true,
          email_new_members: data.email_new_members ?? true,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updatePref = async (key: keyof typeof prefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      const res = await fetch('/api/settings/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) setPrefs(prefs);
    } catch {
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold mb-1 flex items-center gap-2">
        <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
        Email and Notification Preferences
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Choose when you want to receive emails.
      </p>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="space-y-0.5 flex-1 min-w-0">
            <Label htmlFor="everyone" className="text-sm">Receive emails for @everyone mentions</Label>
            <p className="text-xs text-muted-foreground">When someone mentions @everyone in a channel you’re in</p>
          </div>
          <div className="flex justify-end sm:justify-start">
            <Switch
              id="everyone"
              checked={prefs.email_everyone_mentions}
              onCheckedChange={(v) => updatePref('email_everyone_mentions', v)}
              disabled={saving}
              className="flex-shrink-0"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="space-y-0.5 flex-1 min-w-0">
            <Label htmlFor="username" className="text-sm">Receive emails for @username mentions</Label>
            <p className="text-xs text-muted-foreground">When someone mentions you (@your username)</p>
          </div>
          <div className="flex justify-end sm:justify-start">
            <Switch
              id="username"
              checked={prefs.email_username_mentions}
              onCheckedChange={(v) => updatePref('email_username_mentions', v)}
              disabled={saving}
              className="flex-shrink-0"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="space-y-0.5 flex-1 min-w-0">
            <Label htmlFor="newmembers" className="text-sm">Receive emails for new members</Label>
            <p className="text-xs text-muted-foreground">When new members join channels or communities you’re part of</p>
          </div>
          <div className="flex justify-end sm:justify-start">
            <Switch
              id="newmembers"
              checked={prefs.email_new_members}
              onCheckedChange={(v) => updatePref('email_new_members', v)}
              disabled={saving}
              className="flex-shrink-0"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
