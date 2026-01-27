'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { PageLayout } from '@/components/common/PageLayout'
import { useAuth } from '@/contexts/supabase-auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Settings,
  Heart,
  Users,
  FileText,
  Crown,
  Share2,
  Camera,
  Mail,
  CheckCircle,
  DollarSign,
  MessageCircle,
  Edit,
  Save,
  ExternalLink,
  Grid3X3,
  List,
  Calendar,
  ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const router = useRouter()
  const { user, userProfile, creatorProfile, isAuthenticated, loading, isCreator, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [posts, setPosts] = useState<Array<any>>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [editData, setEditData] = useState({
    display_name: '',
    bio: '',
    category: ''
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [loading, isAuthenticated, router])

  // Fetch user's posts
  useEffect(() => {
    const fetchPosts = async () => {
      if (user && isAuthenticated) {
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
            .limit(20)

          if (!error && data) {
            setPosts(data.map((post: any) => ({
              ...post,
              likes_count: post.post_likes?.length || 0,
              comments_count: post.post_comments?.length || 0
            })))
          }
        } catch (error) {
          console.error('Failed to fetch posts:', error)
        } finally {
          setPostsLoading(false)
        }
      }
    }

    fetchPosts()
  }, [user, isAuthenticated])

  useEffect(() => {
    if (userProfile) {
      setEditData({
        display_name: userProfile.display_name || '',
        bio: creatorProfile?.bio || '',
        category: creatorProfile?.category || ''
      })
      setCoverImageUrl(creatorProfile?.cover_image_url || null)
    }
  }, [userProfile, creatorProfile])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: editData.display_name,
          bio: editData.bio,
          category: editData.category
        })
      })

      if (response.ok) {
        await refreshProfile()
        setIsEditing(false)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'covers')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadResult = await uploadRes.json()
      if (uploadResult.success) {
        const updateRes = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cover_image_url: uploadResult.url })
        })

        if (updateRes.ok) {
          await refreshProfile()
          setCoverImageUrl(uploadResult.url)
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload cover photo')
    } finally {
      setIsUploadingCover(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'avatars')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadResult = await uploadRes.json()
      if (uploadResult.success) {
        const updateRes = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_url: uploadResult.url })
        })

        if (updateRes.ok) {
          await refreshProfile()
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  if (loading) {
    return <PageLayout loading />
  }

  if (!isAuthenticated || !userProfile) {
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <PageLayout hideRightPanel hideContextSidebar fullWidth>
      <div className="-mx-4 md:mx-0">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative h-56 md:h-64 bg-gradient-to-r from-primary/80 via-pink-600 to-red-500 overflow-hidden"
        >
          {coverImageUrl && (
            <Image
              src={coverImageUrl}
              alt="Cover"
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

          {/* Animated gradient overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          />

          <input
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
            id="cover-upload"
            disabled={isUploadingCover}
          />
          <label htmlFor="cover-upload">
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 z-10 cursor-pointer bg-background/80 backdrop-blur-sm hover:bg-background"
              disabled={isUploadingCover}
              asChild
            >
              <span>
                <Camera className="w-4 h-4 mr-2" />
                {isUploadingCover ? 'Uploading...' : 'Change Cover'}
              </span>
            </Button>
          </label>
        </motion.div>

        {/* Profile Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative -mt-20 mb-8"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {/* Profile Avatar */}
              <motion.div
                className="relative"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Avatar className="w-32 h-32 md:w-36 md:h-36 border-4 border-background shadow-2xl ring-4 ring-background">
                  <AvatarImage src={userProfile.photo_url} alt={userProfile.display_name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-pink-500 text-primary-foreground text-4xl font-bold">
                    {userProfile.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                  disabled={isUploadingAvatar}
                />
                <label htmlFor="avatar-upload">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-1 right-1 rounded-full h-10 w-10 cursor-pointer bg-background shadow-lg hover:bg-muted"
                    disabled={isUploadingAvatar}
                    asChild
                  >
                    <span>
                      {isUploadingAvatar ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </span>
                  </Button>
                </label>
                {creatorProfile?.is_verified && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, delay: 0.4 }}
                  >
                    <CheckCircle className="absolute -top-1 -right-1 w-8 h-8 text-blue-500 bg-background rounded-full" />
                  </motion.div>
                )}
              </motion.div>

              {/* Profile Info */}
              <div className="flex-1 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <motion.div
                      className="flex items-center gap-3 mb-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                        {userProfile.display_name || user.email?.split('@')[0]}
                      </h1>
                      {isCreator && (
                        <Badge className="bg-gradient-to-r from-primary to-pink-500 text-primary-foreground border-0">
                          <Crown className="w-3 h-3 mr-1" />
                          Creator
                        </Badge>
                      )}
                    </motion.div>

                    <motion.div
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Mail className="w-4 h-4" />
                      {userProfile.email}
                    </motion.div>
                  </div>

                  {/* Action Buttons */}
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                      disabled={isSaving}
                      className={cn(
                        "transition-all",
                        isEditing && "bg-gradient-to-r from-primary to-pink-500 hover:opacity-90"
                      )}
                    >
                      {isEditing ? (
                        <>
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </>
                      )}
                    </Button>

                    <Button variant="outline" size="icon" className="hover:scale-105 transition-transform">
                      <Share2 className="w-4 h-4" />
                    </Button>

                    <Link href="/settings">
                      <Button variant="outline" size="icon" className="hover:scale-105 transition-transform">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </Link>
                  </motion.div>
                </div>

                {creatorProfile?.bio && !isEditing && (
                  <motion.p
                    className="mt-4 text-muted-foreground max-w-3xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    {creatorProfile.bio}
                  </motion.p>
                )}

                {isEditing && (
                  <motion.div
                    className="mt-4 space-y-4 bg-card p-4 rounded-xl border"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div>
                      <Label className="text-foreground">Display Name</Label>
                      <Input
                        value={editData.display_name}
                        onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    {isCreator && (
                      <>
                        <div>
                          <Label className="text-foreground">Bio</Label>
                          <Textarea
                            value={editData.bio}
                            onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                            className="mt-2"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label className="text-foreground">Category</Label>
                          <select
                            value={editData.category}
                            onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                            className="w-full mt-2 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                          >
                            <option value="">Select a category</option>
                            <option value="Art">Art</option>
                            <option value="Music">Music</option>
                            <option value="Photography">Photography</option>
                            <option value="Writing">Writing</option>
                            <option value="Cooking">Cooking</option>
                            <option value="Tech">Tech</option>
                            <option value="Fashion">Fashion</option>
                            <option value="Travel">Travel</option>
                            <option value="Gaming">Gaming</option>
                            <option value="Education">Education</option>
                            <option value="Fitness">Fitness</option>
                            <option value="Crafts">Crafts</option>
                          </select>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(false)}
                          className="text-muted-foreground"
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          {isCreator && creatorProfile && (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/10">
                    <Users className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <motion.p
                      className="text-2xl font-bold text-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {creatorProfile.supporters_count || 0}
                    </motion.p>
                    <p className="text-xs text-muted-foreground">Supporters</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10">
                    <FileText className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <motion.p
                      className="text-2xl font-bold text-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      {posts.length}
                    </motion.p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-green-500/10">
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <motion.p
                      className="text-2xl font-bold text-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      Rs. {creatorProfile.total_earnings || 0}
                    </motion.p>
                    <p className="text-xs text-muted-foreground">Earnings</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-pink-500/10">
                    <Heart className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <motion.p
                      className="text-2xl font-bold text-foreground"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      {creatorProfile.likes_count || 0}
                    </motion.p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Tab Navigation */}
          <motion.div
            className="border-b border-border mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-1">
              {['overview', 'posts', 'activity'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'relative px-4 md:px-6 py-3 text-sm font-medium transition-colors',
                    activeTab === tab
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'posts' && ` (${posts.length})`}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="profile-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="pb-8"
          >
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="overflow-hidden">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {creatorProfile?.bio ? (
                      <p className="text-muted-foreground">{creatorProfile.bio}</p>
                    ) : (
                      <p className="text-muted-foreground italic">No bio added yet.</p>
                    )}

                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Category</span>
                        <Badge variant="outline">{creatorProfile?.category || 'Not set'}</Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Joined</span>
                        <span className="text-sm text-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(userProfile.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">Role</span>
                        <Badge variant={isCreator ? 'default' : 'outline'}>
                          {isCreator ? 'Creator' : 'Supporter'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ChevronRight className="w-5 h-5 text-primary" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {isCreator ? (
                      <>
                        <Link href="/dashboard" className="block">
                          <Button variant="outline" className="w-full justify-between group hover:border-primary/50">
                            <span className="flex items-center">
                              <Crown className="w-4 h-4 mr-2 text-primary" />
                              Creator Dashboard
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                        <Link href={`/creator/${user?.id}`} className="block">
                          <Button variant="outline" className="w-full justify-between group hover:border-primary/50">
                            <span className="flex items-center">
                              <ExternalLink className="w-4 h-4 mr-2 text-primary" />
                              View Public Profile
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                        <Link href="/dashboard" className="block">
                          <Button variant="outline" className="w-full justify-between group hover:border-primary/50">
                            <span className="flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-primary" />
                              Create Post
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <Link href="/signup/creator" className="block">
                        <Button className="w-full bg-gradient-to-r from-primary to-pink-500 hover:opacity-90">
                          <Crown className="w-4 h-4 mr-2" />
                          Become a Creator
                        </Button>
                      </Link>
                    )}
                    <Link href="/settings" className="block">
                      <Button variant="outline" className="w-full justify-between group hover:border-primary/50">
                        <span className="flex items-center">
                          <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
                          Settings
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {/* View Toggle */}
                <div className="flex items-center justify-end gap-2 mb-4">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {postsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                  </div>
                ) : posts.length > 0 ? (
                  viewMode === 'grid' ? (
                    <div className="grid grid-cols-3 gap-1 md:gap-2">
                      {posts.map((post) => (
                        <motion.div
                          key={post.id}
                          whileHover={{ scale: 1.02 }}
                          className="aspect-square relative overflow-hidden rounded-lg bg-muted cursor-pointer group"
                        >
                          {post.image_url ? (
                            <Image
                              src={post.image_url}
                              alt={post.title || 'Post'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                              <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                            <span className="flex items-center gap-1 text-sm">
                              <Heart className="w-4 h-4" />
                              {post.likes_count || 0}
                            </span>
                            <span className="flex items-center gap-1 text-sm">
                              <MessageCircle className="w-4 h-4" />
                              {post.comments_count || 0}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <Card key={post.id} className="overflow-hidden hover:border-primary/30 transition-colors">
                          <CardContent className="p-4 md:p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-primary to-pink-500 rounded-full flex items-center justify-center">
                                  {post.image_url ? <Camera className="w-5 h-5 text-white" /> : <FileText className="w-5 h-5 text-white" />}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground">
                                    {post.title || 'Untitled Post'}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(post.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={post.is_public ? "default" : "secondary"} className="text-xs">
                                {post.is_public ? "Public" : "Supporters Only"}
                              </Badge>
                            </div>

                            {post.content && (
                              <p className="text-muted-foreground mb-4 line-clamp-3">{post.content}</p>
                            )}

                            {post.image_url && (
                              <div className="mb-4 rounded-xl overflow-hidden bg-muted">
                                <Image
                                  src={post.image_url}
                                  alt="Post image"
                                  width={600}
                                  height={400}
                                  className="w-full h-auto object-cover"
                                />
                              </div>
                            )}

                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <span className="flex items-center gap-2">
                                <Heart className="w-4 h-4" />
                                {post.likes_count || 0} likes
                              </span>
                              <span className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" />
                                {post.comments_count || 0} comments
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                ) : (
                  <Card className="p-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No Posts Yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {isCreator
                        ? 'Start creating content to share with your supporters!'
                        : 'Become a creator to start posting content!'
                      }
                    </p>
                    {isCreator ? (
                      <Link href="/dashboard">
                        <Button className="bg-gradient-to-r from-primary to-pink-500 hover:opacity-90">
                          <FileText className="w-4 h-4 mr-2" />
                          Create Post
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/signup/creator">
                        <Button className="bg-gradient-to-r from-primary to-pink-500 hover:opacity-90">
                          <Crown className="w-4 h-4 mr-2" />
                          Become Creator
                        </Button>
                      </Link>
                    )}
                  </Card>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {posts.length > 0 ? (
                    <div className="divide-y divide-border">
                      {posts.slice(0, 10).map((post, index) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm truncate">
                              {post.title || 'Untitled Post'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Posted on {new Date(post.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4" />
                              {post.likes_count || 0}
                            </span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <p className="text-muted-foreground">No activity yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </PageLayout>
  )
}
