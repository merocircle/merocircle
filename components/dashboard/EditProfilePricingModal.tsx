'use client';

import React, { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { Plus, X, Calculator, Loader2, ArrowRight, ArrowLeft, Check, Crown, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'Technology', 'Education', 'Entertainment', 'Music', 'Art & Design',
  'Gaming', 'Photography', 'Writing', 'Business', 'Health & Fitness',
  'Lifestyle', 'Travel', 'Food & Cooking', 'Fashion & Beauty', 'Comedy',
  'Science', 'Sports', 'Politics & News', 'Religion & Spirituality', 'Other',
];

const SOCIAL = [
  { id: 'facebook', name: 'Facebook', icon: '📘' },
  { id: 'youtube', name: 'YouTube', icon: '📺' },
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'twitter', name: 'Twitter (X)', icon: '🐦' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵' },
  { id: 'website', name: 'Website', icon: '🌐' },
  { id: 'other', name: 'Other', icon: '🔗' },
];

type Tier = { tier_level: number; price: number; tier_name: string; description: string | null; benefits: string[]; extra_perks: string[] };

type Profile = {
  display_name?: string | null;
  bio?: string | null;
  category?: string | null;
  social_links?: Record<string, string>;
  vanity_username?: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  tiers: Tier[];
  onSaved: () => void;
}

export function EditProfilePricingModal({ open, onOpenChange, profile, tiers, onSaved }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('');
  const [vanityUsername, setVanityUsername] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [platformIds, setPlatformIds] = useState<string[]>([]);
  const [tierPrices, setTierPrices] = useState<Record<number, string>>({});
  const [extraPerks, setExtraPerks] = useState<Record<number, string[]>>({ 1: [], 2: [], 3: [] });
  const [estTier2, setEstTier2] = useState('20');
  const [estTier3, setEstTier3] = useState('10');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setDisplayName(profile?.display_name ?? '');
    setBio(profile?.bio ?? '');
    setCategory(profile?.category ?? '');
    setVanityUsername(profile?.vanity_username ?? '');
    const links = profile?.social_links ?? {};
    setSocialLinks(links);
    setPlatformIds(Object.keys(links));
    const prices: Record<number, string> = {};
    const perks: Record<number, string[]> = { 1: [], 2: [], 3: [] };
    (tiers || []).forEach((t) => {
      prices[t.tier_level] = String(t.price);
      perks[t.tier_level] = Array.isArray(t.extra_perks) ? [...t.extra_perks] : [];
    });
    setTierPrices(prices);
    setExtraPerks(perks);
    setErr(null);
  }, [open, profile, tiers]);

  const addPlatform = (id: string) => {
    if (platformIds.includes(id)) return;
    setPlatformIds([...platformIds, id]);
  };
  const removePlatform = (id: string) => {
    setPlatformIds(platformIds.filter((x) => x !== id));
    const next = { ...socialLinks };
    delete next[id];
    setSocialLinks(next);
  };
  const setSocial = (id: string, url: string) => {
    setSocialLinks({ ...socialLinks, [id]: url });
  };
  const addPerk = (level: number) => {
    setExtraPerks({ ...extraPerks, [level]: [...(extraPerks[level] ?? []), ''] });
  };
  const removePerk = (level: number, i: number) => {
    setExtraPerks({ ...extraPerks, [level]: (extraPerks[level] ?? []).filter((_, j) => j !== i) });
  };
  const setPerk = (level: number, i: number, v: string) => {
    const arr = [...(extraPerks[level] ?? [])];
    arr[i] = v;
    setExtraPerks({ ...extraPerks, [level]: arr });
  };

  const monthlyIncome = () => {
    const p2 = (parseFloat(tierPrices[2] ?? '0') || 0) * (parseFloat(estTier2) || 0);
    const p3 = (parseFloat(tierPrices[3] ?? '0') || 0) * (parseFloat(estTier3) || 0);
    return p2 + p3;
  };

  const onSave = async () => {
    setSaving(true);
    setErr(null);
    try {
      const profileRes = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          bio: bio.trim() || null,
          category: category || null,
          vanity_username: vanityUsername.trim() || null,
          social_links: Object.fromEntries(Object.entries(socialLinks).filter(([, v]) => (v ?? '').trim() !== '')),
        }),
      });
      if (!profileRes.ok) {
        const d = await profileRes.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to update profile');
      }
      const payload = [1, 2, 3].map((level) => {
        const t = tiers?.find((x) => x.tier_level === level);
        return {
          tier_level: level,
          price: level === 1 ? 0 : parseFloat(tierPrices[level] ?? '0') || 0,
          tier_name: t?.tier_name ?? (level === 1 ? 'Supporter' : level === 2 ? 'Inner Circle' : 'Core Member'),
          description: t?.description ?? null,
          benefits: t?.benefits ?? [],
          extra_perks: (extraPerks[level] ?? []).filter((p) => p.trim() !== ''),
        };
      });
      const tiersRes = await fetch('/api/creator/tiers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers: payload }),
      });
      if (!tiersRes.ok) {
        const d = await tiersRes.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to update tiers');
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const inputCn = 'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
  const selectCn = 'w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring';
  const availableSocial = SOCIAL.filter((p) => !platformIds.includes(p.id));

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          aria-describedby="edit-profile-pricing-desc"
          className="fixed left-[50%] top-[50%] z-50 flex w-[min(96vw,72rem)] max-w-[72rem] h-[min(88vh,800px)] max-h-[800px] translate-x-[-50%] translate-y-[-50%] flex-col gap-0 overflow-hidden rounded-xl border bg-background p-0 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="shrink-0 flex items-center justify-between border-b px-6 pt-6 pb-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-semibold">Edit profile & pricing</DialogPrimitive.Title>
              <p id="edit-profile-pricing-desc" className="text-sm text-muted-foreground mt-0.5">
                {step === 1 ? 'Step 1 — Profile' : 'Step 2 — Pricing'}
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`rounded-full w-8 h-8 text-sm font-medium ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`rounded-full w-8 h-8 text-sm font-medium ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  2
                </button>
              </div>
            </div>
            <DialogPrimitive.Close className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none [&_svg]:size-4">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          {step === 1 && (
            <div className="space-y-5 max-w-2xl">
              <div>
                <Label className="text-sm font-medium">Display name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 100))}
                  placeholder="Your name"
                  className={inputCn}
                  maxLength={100}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={selectCn}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium">Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell supporters about yourself..."
                  className={inputCn}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">{bio.length}/500</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Creator page URL (username)</Label>
                <Input
                  value={vanityUsername}
                  onChange={(e) => setVanityUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 30))}
                  placeholder="your_username"
                  className={inputCn}
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground mt-1">/creator/{vanityUsername || 'your_username'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium block mb-2">Social links</Label>
                <div className="space-y-2">
                  {platformIds.map((id) => {
                    const p = SOCIAL.find((x) => x.id === id);
                    if (!p) return null;
                    return (
                      <div key={id} className="flex gap-2 items-center">
                        <span className="text-lg">{p.icon}</span>
                        <Input
                          type="url"
                          value={socialLinks[id] ?? ''}
                          onChange={(e) => setSocial(id, e.target.value)}
                          placeholder={`${p.name} URL`}
                          className={inputCn}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removePlatform(id)} aria-label={`Remove ${p.name}`}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                  {availableSocial.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => { const v = e.target.value; if (v) addPlatform(v); e.target.value = ''; }}
                      className={`${selectCn} text-muted-foreground`}
                    >
                      <option value="">Add platform...</option>
                      {availableSocial.map((p) => (
                        <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr,minmax(300px,360px)] gap-8 items-start">
              {/* Left column: tier cards (1★, 2★, 3★) */}
              <div className="space-y-4 order-1 md:order-1">
                <h3 className="text-sm font-semibold text-foreground">Tier pricing (NPR per month)</h3>
                {[1, 2, 3].map((level) => {
                  const t = tiers?.find((x) => x.tier_level === level);
                  const name = t?.tier_name ?? (level === 1 ? 'Supporter' : level === 2 ? 'Inner Circle' : 'Core Member');
                  const is1 = level === 1;
                  const is2 = level === 2;
                  const is3 = level === 3;
                  return (
                    <div
                      key={level}
                      className={cn(
                        'relative rounded-xl border-2 p-5 space-y-4 overflow-hidden',
                        is1 && 'border-border bg-muted/20',
                        is2 && 'border-amber-300 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-900/10',
                        is3 && 'border-violet-300 dark:border-violet-600 bg-violet-50/50 dark:bg-violet-900/10'
                      )}
                    >
                      {is1 && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-500" />}
                      {is2 && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />}
                      {is3 && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />}
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0',
                            is1 && 'bg-slate-500',
                            is2 && 'bg-gradient-to-br from-amber-400 to-orange-500',
                            is3 && 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
                          )}
                        >
                          {is1 ? <User className="w-5 h-5 text-white" /> : is2 ? <Check className="w-5 h-5 text-white" /> : <Crown className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground">
                            {is1 ? 'Community chat & posts' : is2 ? 'Posts + chat' : 'Posts + chat + perks'}
                          </p>
                        </div>
                      </div>
                      {level === 1 ? (
                        <p className="text-sm text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">Free — no payment</p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            value={tierPrices[level] ?? ''}
                            onChange={(e) => setTierPrices({ ...tierPrices, [level]: e.target.value })}
                            className={cn(inputCn, 'w-28')}
                          />
                          <span className="text-sm text-muted-foreground">NPR / month</span>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Extra perks</p>
                        {(extraPerks[level] ?? []).map((perk, i) => (
                          <div key={i} className="flex gap-2 mb-1">
                            <Input
                              value={perk}
                              onChange={(e) => setPerk(level, i, e.target.value)}
                              placeholder="e.g. Early access"
                              className={inputCn}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removePerk(level, i)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => addPerk(level)}>
                          <Plus className="w-3 h-3 mr-1" /> Add perk
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right column: income calculator */}
              <div className="relative order-2 md:order-2 w-full md:w-auto md:min-w-[300px] rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 p-5 space-y-4 md:sticky md:top-0">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-xl" aria-hidden />
                <div className="flex items-center gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-emerald-500/15">
                    <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Income calculator</h3>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Est. Inner Circle supporters</Label>
                  <Input
                    type="number"
                    min={0}
                    value={estTier2}
                    onChange={(e) => setEstTier2(e.target.value)}
                    className={inputCn}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Est. Core Member supporters</Label>
                  <Input
                    type="number"
                    min={0}
                    value={estTier3}
                    onChange={(e) => setEstTier3(e.target.value)}
                    className={inputCn}
                  />
                </div>
                <div className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-4">
                  <p className="text-emerald-100 text-xs">Est. monthly</p>
                  <p className="text-2xl font-bold">NPR {monthlyIncome().toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && err && (
            <p className="mt-4 text-sm text-destructive">{err}</p>
          )}
        </div>

        <footer className="shrink-0 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end border-t px-6 py-4">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={() => setStep(2)}>Next <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={onSave} disabled={saving}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : 'Save changes'}
              </Button>
            </>
          )}
        </footer>
      </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
