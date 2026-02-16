'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useCreatorDetails, useSubscription } from '@/hooks/useCreatorDetails';
import {
  Settings,
  Heart,
  Users,
  FileText,
  Crown,
  Camera,
  Edit,
  Save,
  Loader2,
  MessageCircle,
  Eye,
  X,
  Sparkles,
  Share2,
  CheckCircle2,
  ExternalLink,
  Copy,
  ImagePlus,
  Plus,
  Trash2,
  Link as LinkIcon,
  DollarSign,
  Grid3X3,
  List,
} from 'lucide-react';
import { EnhancedPostCard } from '@/components/posts/EnhancedPostCard';
import { TimelineFeed } from '@/components/posts/TimelineFeed';
import { TimelinePost } from '@/components/posts/TimelinePost';
import { staggerContainer, fadeInUp } from '@/components/animations/variants';
import { isToday, isYesterday } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { cn, getValidAvatarUrl } from '@/lib/utils';

const CATEGORIES = [
  'Technology', 'Education', 'Entertainment', 'Music', 'Art & Design',
  'Gaming', 'Photography', 'Writing', 'Business', 'Health & Fitness',
  'Lifestyle', 'Travel', 'Food & Cooking', 'Fashion & Beauty', 'Comedy',
  'Science', 'Sports', 'Politics & News', 'Religion & Spirituality', 'Other',
];

const SOCIAL_PLATFORMS = [
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

// Tab configuration (only for creators)
const creatorTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'posts', label: 'Posts' },
  { id: 'edit', label: 'Edit Profile' },
];

export default function ProfileSection() {
  const { user, userProfile, creatorProfile, isAuthenticated, loading, isCreator, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [posts, setPosts] = useState<Array<any>>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [shareCopied, setShareCopied] = useState(false);
  const [editData, setEditData] = useState({
    display_name: '',
    bio: '',
    category: ''
  });

  // Full edit state
  const [vanityUsername, setVanityUsername] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [platformIds, setPlatformIds] = useState<string[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [tierPrices, setTierPrices] = useState<Record<number, string>>({});
  const [extraPerks, setExtraPerks] = useState<Record<number, string[]>>({ 1: [], 2: [], 3: [] });
  const [editStep, setEditStep] = useState<'profile' | 'pricing'>('profile');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  const creatorDetails = useCreatorDetails(user?.id || null)

  // Fetch user's posts (only for creators)
  useEffect(() => {
    const fetchPosts = async () => {
      if (user && isAuthenticated && isCreator) {
        try {
          const { data, error } = await supabase
            .from('posts')
            .select(`
              *,
              post_likes(id),
              post_comments(id),
              polls(id, question, allows_multiple_answers, expires_at)
            `)
            .eq('creator_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

          if (!error && data) {
            setPosts(data.map((post: any) => ({
              ...post,
              likes_count: post.post_likes?.length || 0,
              comments_count: post.post_comments?.length || 0,
              poll: post.polls || null
            })));
          }
        } catch (error) {
          console.error('Failed to fetch posts:', error);
        } finally {
          setPostsLoading(false);
        }
      } else {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, [user, isAuthenticated, isCreator]);

  useEffect(() => {
    if (userProfile) {
      setEditData({
        display_name: userProfile.display_name || '',
        bio: creatorProfile?.bio || '',
        category: creatorProfile?.category || ''
      });
      setCoverImageUrl(creatorProfile?.cover_image_url || null);
      setVanityUsername(creatorProfile?.vanity_username || '');
      const links = (creatorProfile as any)?.social_links || {};
      setSocialLinks(links);
      setPlatformIds(Object.keys(links));
    }
  }, [userProfile, creatorProfile]);

  // Fetch tiers for creator
  useEffect(() => {
    const fetchTiers = async () => {
      if (!user?.id || !isCreator) return;
      try {
        const res = await fetch(`/api/creator/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          const fetchedTiers = data.tiers || [];
          setTiers(fetchedTiers);
          const prices: Record<number, string> = {};
          const perks: Record<number, string[]> = { 1: [], 2: [], 3: [] };
          fetchedTiers.forEach((t: Tier) => {
            prices[t.tier_level] = String(t.price);
            perks[t.tier_level] = Array.isArray(t.extra_perks) ? [...t.extra_perks] : [];
          });
          setTierPrices(prices);
          setExtraPerks(perks);
        }
      } catch (err) {
        console.error('Failed to fetch tiers:', err);
      }
    };
    fetchTiers();
  }, [user?.id, isCreator]);

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'covers');
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (uploadData.success) {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cover_image_url: uploadData.url })
        });
        if (response.ok) {
          setCoverImageUrl(uploadData.url);
          await refreshProfile();
        }
      }
    } catch (error) {
      console.error('Cover upload error:', error);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: editData.display_name,
          bio: editData.bio,
          category: editData.category
        })
      });

      if (response.ok) {
        await refreshProfile();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatars');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (uploadData.success) {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_url: uploadData.url })
        });

        if (response.ok) {
          await refreshProfile();
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleShareProfile = useCallback(async () => {
    if (!user?.id || typeof window === 'undefined') return;
    const slug = creatorProfile?.vanity_username?.trim() || userProfile?.username || user.id;
    const url = `${window.location.origin}/creator/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
      if (navigator.share) {
        await navigator.share({
          title: `${userProfile?.display_name || 'Creator'} on MeroCircle`,
          url,
        });
      }
    } catch {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }, [user?.id, userProfile?.display_name, userProfile?.username, creatorProfile?.vanity_username]);

  const handleViewPublicProfile = useCallback(() => {
    if (!user?.id || typeof window === 'undefined') return;
    const slug = creatorProfile?.vanity_username?.trim() || userProfile?.username || user.id;
    window.open(`/creator/${slug}`, '_blank');
  }, [user?.id, userProfile?.username, creatorProfile?.vanity_username]);

  // Full edit save (profile + pricing)
  const handleFullSave = async () => {
    setEditSaving(true);
    setEditError(null);
    setEditSuccess(false);
    try {
      const profileRes = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: editData.display_name.trim() || null,
          bio: editData.bio.trim() || null,
          category: editData.category || null,
          vanity_username: vanityUsername.trim() || null,
          social_links: Object.fromEntries(Object.entries(socialLinks).filter(([, v]) => (v ?? '').trim() !== '')),
        }),
      });
      if (!profileRes.ok) {
        const d = await profileRes.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to update profile');
      }

      // Save tiers
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

      await refreshProfile();
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setEditSaving(false);
    }
  };

  // Social link helpers
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

  const addPerk = (level: number) => {
    setExtraPerks({ ...extraPerks, [level]: [...(extraPerks[level] ?? []), ''] });
  };

  const removePerk = (level: number, i: number) => {
    setExtraPerks({ ...extraPerks, [level]: (extraPerks[level] ?? []).filter((_, j) => j !== i) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const stats = isCreator ? {
    posts: posts.length,
    supporters: creatorProfile?.supporter_count || 0,
    likes: posts.reduce((acc: number, p: any) => acc + (p.likes_count || 0), 0)
  } : null;

  // Simplified profile for supporters (non-creators)
  if (!isCreator) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 overflow-y-auto h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative inline-block mb-4">
            <Avatar className="w-28 h-28 border-4 border-background shadow-xl">
              <AvatarImage src={getValidAvatarUrl(userProfile.photo_url)} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                {userProfile.display_name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label htmlFor="avatar-upload-supporter" className="absolute bottom-1 right-1 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
              {isUploadingAvatar ? (
                <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-primary-foreground" />
              )}
            </label>
            <input
              type="file"
              id="avatar-upload-supporter"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
            />
          </div>

          {isEditing ? (
            <div className="max-w-xs mx-auto mb-4">
              <Input
                value={editData.display_name}
                onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                className="text-center text-xl font-bold rounded-xl"
                placeholder="Your name"
              />
            </div>
          ) : (
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {userProfile.display_name}
            </h1>
          )}

          <p className="text-muted-foreground mb-6">Supporter</p>

          <div className="flex justify-center gap-3 mb-8">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl">
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveProfile} disabled={isSaving} className="rounded-xl">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="rounded-xl">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm" asChild className="rounded-xl">
                  <Link href="/settings">
                    <Settings className="w-4 h-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/5 to-pink-500/5">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Become a Creator
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Share your passion, build your community, and earn from your content. Start your creator journey today!
              </p>
              <Button asChild className="bg-gradient-to-r from-primary to-pink-500 text-white rounded-xl px-8">
                <Link href="/signup/creator">
                  <Crown className="w-4 h-4 mr-2" />
                  Get Started
                </Link>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── Full Creator Profile ──
  return (
    <div className="max-w-full sm:max-w-3xl lg:max-w-4xl mx-auto overflow-y-auto h-full">
      {/* Cover Image + Avatar Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        {/* Cover Image */}
        <div className="relative h-32 sm:h-44 md:h-52 lg:h-60 overflow-hidden bg-gradient-to-br from-primary/25 via-primary/10 to-pink-500/20">
          {coverImageUrl && (
            <Image
              src={coverImageUrl}
              alt="Cover"
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50" />

          {/* Decorative circles when no cover */}
          {!coverImageUrl && (
            <>
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full border border-white/10" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full border border-white/10" />
              <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full border border-white/5" />
            </>
          )}

          {/* Cover upload button */}
          <div className="absolute top-3 right-3 z-10">
            <label htmlFor="cover-upload-main" className="cursor-pointer">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs font-medium backdrop-blur-md border border-white/10 transition-colors">
                {isUploadingCover ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImagePlus className="w-3.5 h-3.5" />
                )}
                {coverImageUrl ? 'Change Cover' : 'Add Cover'}
              </div>
            </label>
            <input
              type="file"
              id="cover-upload-main"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
              disabled={isUploadingCover}
            />
          </div>
        </div>

        {/* Profile info overlapping cover */}
        <div className="px-4 sm:px-6 lg:px-8 pb-6">
          <div className="relative -mt-10 sm:-mt-14 lg:-mt-16">
            {/* Avatar */}
            <div className="flex items-end gap-4 sm:gap-5">
              <div className="relative flex-shrink-0">
                <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-[3px] border-background shadow-xl ring-2 ring-background">
                  <AvatarImage src={getValidAvatarUrl(userProfile.photo_url)} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                    {userProfile.display_name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label htmlFor="avatar-upload-creator" className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg border-2 border-background">
                  {isUploadingAvatar ? (
                    <Loader2 className="w-3.5 h-3.5 text-primary-foreground animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                  )}
                </label>
                <input
                  type="file"
                  id="avatar-upload-creator"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                />
              </div>

              {/* Name and actions (desktop) */}
              <div className="flex-1 min-w-0 pb-1 hidden sm:block">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
                    {userProfile.display_name}
                  </h1>
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[11px] px-2 py-0.5 rounded-full">
                    <Crown className="w-3 h-3 mr-1" />
                    Creator
                  </Badge>
                </div>
                {creatorProfile?.category && (
                  <Badge variant="outline" className="px-2.5 py-0.5 text-[11px] text-primary border-primary/30 bg-primary/5 rounded-full font-medium">
                    {creatorProfile.category}
                  </Badge>
                )}
              </div>

              {/* Action buttons */}
              <div className="hidden sm:flex items-center gap-2 pb-1 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => setActiveTab('edit')} className="rounded-full h-9 gap-1.5">
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleShareProfile} className="rounded-full h-9 gap-1.5">
                  {shareCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  {shareCopied ? 'Copied!' : 'Share'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleViewPublicProfile} className="rounded-full h-9 gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Public
                </Button>
                <Button variant="ghost" size="icon" asChild className="rounded-full h-9 w-9">
                  <Link href="/settings">
                    <Settings className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Mobile: Name + Badge */}
            <div className="sm:hidden mt-3">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  {userProfile.display_name}
                </h1>
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[11px] px-2 py-0.5 rounded-full">
                  <Crown className="w-3 h-3 mr-1" />
                  Creator
                </Badge>
              </div>
              {creatorProfile?.category && (
                <Badge variant="outline" className="px-2.5 py-0.5 text-[11px] text-primary border-primary/30 bg-primary/5 rounded-full font-medium mb-3">
                  {creatorProfile.category}
                </Badge>
              )}

              {/* Mobile actions */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setActiveTab('edit')} className="rounded-full h-8 text-xs gap-1">
                  <Edit className="w-3 h-3" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleShareProfile} className="rounded-full h-8 text-xs gap-1">
                  {shareCopied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Share2 className="w-3 h-3" />}
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={handleViewPublicProfile} className="rounded-full h-8 text-xs gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Public
                </Button>
                <Button variant="ghost" size="icon" asChild className="rounded-full h-8 w-8">
                  <Link href="/settings">
                    <Settings className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Bio */}
            {creatorProfile?.bio && (
              <p className="text-sm text-muted-foreground/80 max-w-lg mt-3 leading-relaxed">
                {creatorProfile.bio}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <div className="px-4 sm:px-6 lg:px-8 pb-8">
        {/* Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-8"
          >
            <Card className="p-3 sm:p-4 text-center border-border/50 hover:border-primary/30 transition-colors">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-foreground tabular-nums">{stats.posts}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Posts</p>
            </Card>
            <Card className="p-3 sm:p-4 text-center border-border/50 hover:border-primary/30 transition-colors">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-foreground tabular-nums">{stats.supporters}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Supporters</p>
            </Card>
            <Card className="p-3 sm:p-4 text-center border-border/50 hover:border-primary/30 transition-colors">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-foreground tabular-nums">{stats.likes}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Likes</p>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 p-1.5 bg-muted/50 rounded-2xl w-fit mb-6 border border-border/30 overflow-x-auto scrollbar-hide max-w-full">
          {creatorTabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'posts' && (
            <motion.div
              key="posts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* View Toggle */}
              <div className="flex justify-end mb-4">
                <div className="flex gap-1 p-1 bg-muted/50 rounded-xl border border-border/30">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      viewMode === 'grid' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      viewMode === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {postsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : posts.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 sm:gap-1.5">
                    {posts.map((post) => (
                      <motion.div
                        key={post.id}
                        className="relative aspect-square bg-muted rounded-lg overflow-hidden group cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                      >
                        {post.image_url ? (
                          <Image src={post.image_url} alt={post.title || 'Post'} fill className="object-cover" sizes="33vw" />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/10 to-pink-500/10">
                            <FileText className="w-8 h-8 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                          <span className="flex items-center gap-1 text-sm">
                            <Heart className="w-4 h-4" />
                            {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1 text-sm">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments_count}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <Card key={post.id} className="p-4 border-border/50 hover:border-primary/30 transition-colors">
                        <h3 className="font-semibold text-foreground mb-2">{post.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {post.comments_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.view_count || 0}
                          </span>
                        </div>
                      </Card>
                    ))}
                  </div>
                )
              ) : (
                <Card className="p-12 text-center border-dashed border-2 border-border/50">
                  <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-muted-foreground">No posts yet</p>
                  <Button asChild className="mt-4 rounded-full" size="sm">
                    <Link href="/home">Create Your First Post</Link>
                  </Button>
                </Card>
              )}
            </motion.div>
          )}

          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Card className="p-6 border-border/50">
                <h3 className="text-lg font-semibold text-foreground mb-4">About</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {creatorProfile?.bio || 'No bio yet. Click Edit to add one!'}
                </p>
              </Card>

              <Card className="p-6 border-border/50">
                <h3 className="text-lg font-semibold text-foreground mb-4">Creator Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Category</span>
                    <Badge variant="secondary" className="rounded-full">{creatorProfile?.category || 'Not set'}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Status</span>
                    <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20 rounded-full">Active</Badge>
                  </div>
                  {creatorProfile?.vanity_username && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">Profile URL</span>
                      <span className="text-sm font-mono text-foreground/80">@{creatorProfile.vanity_username}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Quick share card */}
              <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
                <h3 className="text-lg font-semibold text-foreground mb-2">Share Your Profile</h3>
                <p className="text-sm text-muted-foreground mb-4">Let your audience know where to find you.</p>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={handleShareProfile} className="rounded-full gap-1.5">
                    <Copy className="w-3.5 h-3.5" />
                    {shareCopied ? 'Copied!' : 'Copy Link'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleViewPublicProfile} className="rounded-full gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Public Profile
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'edit' && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Sub-tabs: Profile / Pricing */}
              <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit border border-border/30">
                <button
                  onClick={() => setEditStep('profile')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                    editStep === 'profile'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Edit className="w-3.5 h-3.5" />
                  Profile
                </button>
                <button
                  onClick={() => setEditStep('pricing')}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                    editStep === 'pricing'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Pricing
                </button>
              </div>

              {/* Success / Error banners */}
              {editSuccess && (
                <div className="rounded-xl p-3 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Profile updated successfully!
                </div>
              )}
              {editError && (
                <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm font-medium">
                  {editError}
                </div>
              )}

              {editStep === 'profile' && (
                <div className="space-y-5">
                  {/* Basic Info */}
                  <Card className="p-5 border-border/50 space-y-4">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <Edit className="w-4 h-4 text-primary" />
                      Basic Info
                    </h3>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Display Name</label>
                      <Input
                        value={editData.display_name}
                        onChange={(e) => setEditData({ ...editData, display_name: e.target.value.slice(0, 100) })}
                        placeholder="Your name"
                        className="rounded-xl"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
                      <select
                        value={editData.category}
                        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
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
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        placeholder="Tell supporters about yourself..."
                        rows={4}
                        className="rounded-xl resize-none"
                        maxLength={500}
                      />
                      <p className="mt-1 text-xs text-muted-foreground">{editData.bio.length}/500</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Creator Page URL</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">/creator/</span>
                        <Input
                          value={vanityUsername}
                          onChange={(e) => setVanityUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 30))}
                          placeholder="your_username"
                          className="rounded-xl"
                          maxLength={30}
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Social Links */}
                  <Card className="p-5 border-border/50 space-y-4">
                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-primary" />
                      Social Links
                    </h3>
                    <div className="space-y-3">
                      {platformIds.map((id) => {
                        const p = SOCIAL_PLATFORMS.find((x) => x.id === id);
                        if (!p) return null;
                        return (
                          <div key={id} className="flex items-center gap-2">
                            <span className="text-lg w-8 text-center flex-shrink-0">{p.icon}</span>
                            <Input
                              value={socialLinks[id] ?? ''}
                              onChange={(e) => setSocialLinks({ ...socialLinks, [id]: e.target.value })}
                              placeholder={`${p.name} URL`}
                              className="rounded-xl flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePlatform(id)}
                              className="rounded-full h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                      {SOCIAL_PLATFORMS.filter((p) => !platformIds.includes(p.id)).length > 0 && (
                        <select
                          value=""
                          onChange={(e) => { if (e.target.value) addPlatform(e.target.value); e.target.value = ''; }}
                          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        >
                          <option value="">+ Add social platform...</option>
                          {SOCIAL_PLATFORMS.filter((p) => !platformIds.includes(p.id)).map((p) => (
                            <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {editStep === 'pricing' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Set your tier prices (NPR per month). Tier 1 is always free.</p>
                  {[1, 2, 3].map((level) => {
                    const t = tiers?.find((x) => x.tier_level === level);
                    const name = t?.tier_name ?? (level === 1 ? 'Supporter' : level === 2 ? 'Inner Circle' : 'Core Member');
                    return (
                      <Card key={level} className="p-5 border-border/50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-foreground">{name}</h4>
                          <Badge variant="outline" className="rounded-full text-xs">Tier {level}</Badge>
                        </div>
                        {level === 1 ? (
                          <p className="text-sm text-muted-foreground">Free tier — no payment required</p>
                        ) : (
                          <div className="flex items-center gap-2 mb-3">
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
                                className="rounded-full h-8 w-8 text-muted-foreground hover:text-red-500"
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
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Save button */}
              <div className="flex justify-end gap-3 pt-2 pb-4">
                <Button
                  onClick={handleFullSave}
                  disabled={editSaving}
                  className="rounded-full px-8"
                >
                  {editSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
