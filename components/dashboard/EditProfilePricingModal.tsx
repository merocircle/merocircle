'use client';

import React, { useState, useEffect } from 'react';

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

const inputStyles = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none';
const labelStyles = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

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
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Edit profile & pricing
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex gap-2 border-b border-gray-200 px-5 py-2 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${step === 1 ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            1. Profile
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${step === 2 ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            2. Pricing
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelStyles}>Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 100))}
                  placeholder="Your name"
                  className={inputStyles}
                  maxLength={100}
                />
              </div>
              <div>
                <label className={labelStyles}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputStyles}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelStyles}>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell supporters about yourself..."
                  className={`${inputStyles} min-h-[100px] resize-y`}
                  rows={4}
                  maxLength={500}
                />
                <p className="mt-1 text-xs text-gray-500">{bio.length}/500</p>
              </div>
              <div>
                <label className={labelStyles}>Creator page URL (username)</label>
                <input
                  type="text"
                  value={vanityUsername}
                  onChange={(e) => setVanityUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 30))}
                  placeholder="your_username"
                  className={inputStyles}
                  maxLength={30}
                />
                <p className="mt-1 text-xs text-gray-500">/creator/{vanityUsername || 'your_username'}</p>
              </div>
              <div>
                <label className={labelStyles}>Social links</label>
                <div className="space-y-2">
                  {platformIds.map((id) => {
                    const p = SOCIAL.find((x) => x.id === id);
                    if (!p) return null;
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <span className="text-lg">{p.icon}</span>
                        <input
                          type="url"
                          value={socialLinks[id] ?? ''}
                          onChange={(e) => setSocial(id, e.target.value)}
                          placeholder={`${p.name} URL`}
                          className={inputStyles}
                        />
                        <button
                          type="button"
                          onClick={() => removePlatform(id)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                          aria-label={`Remove ${p.name}`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                  {availableSocial.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => { const v = e.target.value; if (v) addPlatform(v); (e.target as HTMLSelectElement).value = ''; }}
                      className={`${inputStyles} text-gray-500`}
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
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Set your tier prices (NPR per month). Tier 1 is always free.</p>
              {[1, 2, 3].map((level) => {
                const t = tiers?.find((x) => x.tier_level === level);
                const name = t?.tier_name ?? (level === 1 ? 'Supporter' : level === 2 ? 'Inner Circle' : 'Core Member');
                return (
                  <div
                    key={level}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    <p className="mb-2 font-medium text-gray-900 dark:text-gray-100">{name}</p>
                    {level === 1 ? (
                      <p className="text-sm text-gray-500">Free — no payment</p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={tierPrices[level] ?? ''}
                          onChange={(e) => setTierPrices({ ...tierPrices, [level]: e.target.value })}
                          className={`${inputStyles} w-24`}
                        />
                        <span className="text-sm text-gray-500">NPR / month</span>
                      </div>
                    )}
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Extra perks</p>
                      {(extraPerks[level] ?? []).map((perk, i) => (
                        <div key={i} className="mb-1 flex gap-2">
                          <input
                            type="text"
                            value={perk}
                            onChange={(e) => setPerk(level, i, e.target.value)}
                            placeholder="e.g. Early access"
                            className={inputStyles}
                          />
                          <button type="button" onClick={() => removePerk(level, i)} className="rounded p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addPerk(level)}
                        className="mt-1 text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400"
                      >
                        + Add perk
                      </button>
                    </div>
                  </div>
                );
              })}
              {err && <p className="text-sm text-red-600">{err}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                Next →
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
