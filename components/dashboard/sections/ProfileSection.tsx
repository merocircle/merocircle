'use client';

import { useState, useEffect } from 'react';
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
import {
  Settings,
  Heart,
  Users,
  FileText,
  Crown,
  Camera,
  Edit,
  Save,
  Grid3X3,
  List,
  Loader2,
  MessageCircle,
  Eye,
  X,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// Tab configuration (only for creators)
const creatorTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'posts', label: 'Posts' },
];

export default function ProfileSection() {
  const { user, userProfile, creatorProfile, isAuthenticated, loading, isCreator, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [posts, setPosts] = useState<Array<any>>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editData, setEditData] = useState({
    display_name: '',
    bio: '',
    category: ''
  });

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
              post_comments(id)
            `)
            .eq('creator_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

          if (!error && data) {
            setPosts(data.map((post: any) => ({
              ...post,
              likes_count: post.post_likes?.length || 0,
              comments_count: post.post_comments?.length || 0
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
    }
  }, [userProfile, creatorProfile]);

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
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
    likes: posts.reduce((acc, p) => acc + (p.likes_count || 0), 0)
  } : null;

  // Simplified profile for supporters
  if (!isCreator) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 overflow-y-auto h-full">
        {/* Simple Hero Section for Supporters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          {/* Avatar */}
          <div className="relative inline-block mb-4">
            <Avatar className="w-28 h-28 border-4 border-background shadow-xl">
              <AvatarImage src={userProfile.photo_url || undefined} />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-pink-500 text-white">
                {userProfile.display_name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
              {isUploadingAvatar ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </label>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
            />
          </div>

          {/* Name */}
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

          {/* Action Buttons */}
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

        {/* Become a Creator CTA */}
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

  // Full profile for creators
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 overflow-y-auto h-full">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8"
      >
        {/* Cover Image */}
        <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-pink-500/20">
          {coverImageUrl && (
            <Image
              src={coverImageUrl}
              alt="Cover"
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="relative -mt-16 px-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-28 h-28 md:w-32 md:h-32 border-4 border-background shadow-xl">
                <AvatarImage src={userProfile.photo_url || undefined} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-pink-500 text-white">
                  {userProfile.display_name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg">
                {isUploadingAvatar ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
              </label>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
              />
            </div>

            {/* Name & Info */}
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {userProfile.display_name}
                </h1>
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Creator
                </Badge>
              </div>
              {creatorProfile?.bio && (
                <p className="text-muted-foreground text-sm md:text-base line-clamp-2">
                  {creatorProfile.bio}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
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
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" asChild className="rounded-xl">
                    <Link href="/settings">
                      <Settings className="w-4 h-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

            {/* Edit Form */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <Card className="p-6 border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Edit Profile</h3>
              <p className="text-sm text-muted-foreground mb-4">Only information visible to others. Change profile picture above.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Cover Image</label>
                  <div className="relative h-32 rounded-xl overflow-hidden bg-muted border">
                    {coverImageUrl && <Image src={coverImageUrl} alt="Cover" fill className="object-cover" />}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <input type="file" id="cover-upload" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                      <label htmlFor="cover-upload">
                        <Button type="button" variant="secondary" size="sm" asChild>
                          <span className="cursor-pointer"><Camera className="w-4 h-4 mr-2" />{coverImageUrl ? 'Change cover' : 'Upload cover'}</span>
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Display Name</label>
                  <Input
                    value={editData.display_name}
                    onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Bio</label>
                  <Textarea
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    rows={3}
                    className="rounded-xl resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
                  <Input
                    value={editData.category}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    placeholder="e.g., Music, Art, Gaming"
                    className="rounded-xl"
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats (only for creators) */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <Card className="p-4 text-center border-border/50 hover:border-primary/30 transition-colors">
            <FileText className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.posts}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </Card>
          <Card className="p-4 text-center border-border/50 hover:border-primary/30 transition-colors">
            <Users className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.supporters}</p>
            <p className="text-xs text-muted-foreground">Supporters</p>
          </Card>
          <Card className="p-4 text-center border-border/50 hover:border-primary/30 transition-colors">
            <Heart className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.likes}</p>
            <p className="text-xs text-muted-foreground">Likes</p>
          </Card>
        </motion.div>
      )}

      {/* Tabs (only for creators) */}
      <div className="flex gap-2 p-1.5 bg-muted/50 rounded-2xl w-fit mb-6">
        {creatorTabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
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
              <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
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
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((post) => (
                    <motion.div
                      key={post.id}
                      className="relative aspect-square bg-muted rounded-lg overflow-hidden group cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                    >
                      {post.image_url ? (
                        <Image src={post.image_url} alt={post.title} fill className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary/20 to-pink-500/20">
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {post.likes_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {post.comments_count}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
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
              <Card className="p-12 text-center border-dashed border-2">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No posts yet</p>
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
              <p className="text-muted-foreground">
                {creatorProfile?.bio || 'No bio yet. Click Edit to add one!'}
              </p>
            </Card>

            <Card className="p-6 border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-4">Creator Info</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="secondary">{creatorProfile?.category || 'Not set'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-green-500/20 text-green-600">Active</Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
