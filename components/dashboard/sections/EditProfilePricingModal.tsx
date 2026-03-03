'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Calculator, Pencil, DollarSign } from 'lucide-react';
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

  const monthlyIncome = () => {
    const p2 = (parseFloat(tierPrices[2] ?? '0') || 0) * (parseFloat(estTier2) || 0);
    const p3 = (parseFloat(tierPrices[3] ?? '0') || 0) * (parseFloat(estTier3) || 0);
    return p2 + p3;
  };

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

  const availableSocial = SOCIAL.filter((p) => !platformIds.includes(p.id));

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="modal-title" className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Pencil className="w-5 h-5 text-primary" />
            Edit Profile & Pricing
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Step tabs */}
        <div className="flex gap-2 px-6 pb-4">
          <Button
            variant={step === 1 ? "default" : "outline"}
            size="sm"
            onClick={() => setStep(1)}
            className="rounded-full"
          >
            1. Profile
          </Button>
          <Button
            variant={step === 2 ? "default" : "outline"}
            size="sm"
            onClick={() => setStep(2)}
            className="rounded-full"
          >
            2. Pricing
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-primary" />
                  Basic Info
                </h3>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Display Name</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value.slice(0, 100))}
                    placeholder="Your name"
                    className="rounded-md bg-muted"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="w-full rounded-md border border-input bg-muted px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Bio</label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell supporters about yourself..."
                    rows={4}
                    className="rounded-md resize-none bg-muted"
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{bio.length}/500</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Creator Page URL</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">/creator/</span>
                    <Input
                      value={vanityUsername}
                      onChange={(e) => setVanityUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 30))}
                      placeholder="your_username"
                      className="rounded-md bg-muted"
                      maxLength={30}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Social Links
                </h3>
                <div className="space-y-3">
                  {platformIds.map((id) => {
                    const p = SOCIAL.find((x) => x.id === id);
                    if (!p) return null;
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <span className="text-lg w-8 text-center shrink-0">{p.icon}</span>
                        <Input
                          value={socialLinks[id] ?? ''}
                          onChange={(e) => setSocial(id, e.target.value)}
                          placeholder={`${p.name} URL`}
                          className="rounded-md flex-1 bg-muted"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePlatform(id)}
                          className="rounded-md h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                  {availableSocial.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => { const v = e.target.value; if (v) addPlatform(v); (e.target as HTMLSelectElement).value = ''; }}
                      className="w-full rounded-md border border-input bg-muted px-3 py-2.5 text-sm text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    >
                      <option value="">+ Add social platform...</option>
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,minmax(280px,350px)]">
              {/* Left: Tier pricing */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Set your tier prices (NPR per month). Tier 1 is always free.</p>
                {[1, 2, 3].map((level) => {
                  const t = tiers?.find((x) => x.tier_level === level);
                  const name = t?.tier_name ?? (level === 1 ? 'Supporter' : level === 2 ? 'Inner Circle' : 'Core Member');
                  return (
                    <div
                      key={level}
                      className="rounded-xl border border-border/50 bg-card p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-foreground">{name}</p>
                        <Badge variant="outline" className="rounded-full text-xs">Tier {level}</Badge>
                      </div>
                      {level === 1 ? (
                        <p className="text-sm text-muted-foreground">Free tier — no payment required</p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            value={tierPrices[level] ?? ''}
                            onChange={(e) => setTierPrices({ ...tierPrices, [level]: e.target.value })}
                            className="rounded-xl w-28"
                          />
                          <span className="text-sm text-muted-foreground">NPR / month</span>
                        </div>
                      )}
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Extra perks</p>
                        {(extraPerks[level] ?? []).map((perk, i) => (
                          <div key={i} className="flex items-center gap-2 mb-2">
                            <Input
                              value={perk}
                              onChange={(e) => {
                                const arr = [...(extraPerks[level] ?? [])];
                                arr[i] = e.target.value;
                                setExtraPerks({ ...extraPerks, [level]: arr });
                              }}
                              placeholder="e.g. Early access"
                              className="rounded-xl flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePerk(level, i)}
                              className="rounded-full h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addPerk(level)}
                          className="text-primary text-xs rounded-full gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add perk
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {err && (
                  <div className="rounded-xl p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                    {err}
                  </div>
                )}
              </div>

              {/* Right: Income calculator */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 lg:sticky lg:top-4">
                <div className="mb-3 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Income calculator</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Est. Inner Circle supporters</label>
                    <Input
                      type="number"
                      min={0}
                      value={estTier2}
                      onChange={(e) => setEstTier2(e.target.value)}
                      className="rounded-md"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Est. Core Member supporters</label>
                    <Input
                      type="number"
                      min={0}
                      value={estTier3}
                      onChange={(e) => setEstTier3(e.target.value)}
                      className="rounded-md"
                    />
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-primary px-4 py-3 text-primary-foreground">
                  <p className="text-xs opacity-90">Est. monthly</p>
                  <p className="text-xl font-bold">NPR {monthlyIncome().toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-4 sm:px-6 sm:py-4 bg-card lg:justify-end">
          {step === 1 ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-full h-12 text-base font-medium py-3 flex-1 lg:max-w-48 sm:w-auto"
                size="lg"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                className="rounded-full h-12 text-base font-medium py-3 flex-1 lg:max-w-48 sm:w-auto"
                size="lg"
              >
                Next →
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="rounded-full h-12 text-base font-medium py-3 flex-1 lg:max-w-48 sm:w-auto"
                size="lg"
              >
                ← Back
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-full h-12 text-base font-medium py-3 flex-1 lg:max-w-48 sm:w-auto"
                size="lg"
              >
                Cancel
              </Button>
              <Button
                onClick={onSave}
                disabled={saving}
                className="rounded-full h-12 text-base font-medium py-3 flex-1 lg:max-w-48 sm:w-auto"
                size="lg"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
