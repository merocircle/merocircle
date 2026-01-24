'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { SidebarNav } from '@/components/sidebar-nav'
import { useAuth } from '@/contexts/supabase-auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Settings,
  Heart,
  Users,
  FileText,
  Calendar,
  Crown,
  Share2,
  Camera,
  Mail,
  CheckCircle,
  DollarSign,
  MessageCircle,
  Eye,
  Edit,
  Save,
  ExternalLink
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils';
import { StatsCard } from '@/components/dashboard/StatsCard';

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
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </main>
      </div>
    )
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <SidebarNav />
      
      <main className="flex-1 overflow-y-auto">
        {/* Hero Banner */}
        <div className="relative h-48 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600">
          {coverImageUrl && (
            <Image
              src={coverImageUrl}
              alt="Cover"
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
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
              className="absolute top-4 right-4 z-10 cursor-pointer"
              disabled={isUploadingCover}
              asChild
            >
              <span>
                <Camera className="w-4 h-4 mr-2" />
                {isUploadingCover ? 'Uploading...' : 'Change Cover'}
              </span>
            </Button>
          </label>
        </div>

        {/* Profile Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
              {/* Profile Avatar */}
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-900 shadow-xl">
                  <AvatarImage src={userProfile.photo_url} alt={userProfile.display_name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-4xl">
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
                    className="absolute bottom-0 right-0 rounded-full h-10 w-10 cursor-pointer"
                    disabled={isUploadingAvatar}
                    asChild
                  >
                    <span>
                      <Camera className="w-4 h-4" />
                    </span>
                  </Button>
                </label>
                {creatorProfile?.is_verified && (
                  <CheckCircle className="absolute -top-1 -right-1 w-8 h-8 text-blue-500 bg-white rounded-full" />
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {userProfile.display_name || user.email?.split('@')[0]}
                      </h1>
                      {isCreator && (
                        <Badge variant="default" className="bg-red-500">
                          <Crown className="w-3 h-3 mr-1" />
                          Creator
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      {userProfile.email}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                      disabled={isSaving}
                    >
                      {isEditing ? (
                        <>
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
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
                    
                    <Button variant="outline" size="icon">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    
                    <Link href="/settings">
                      <Button variant="outline" size="icon">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {creatorProfile?.bio && !isEditing && (
                  <p className="mt-4 text-gray-700 dark:text-gray-300 max-w-3xl">
                    {creatorProfile.bio}
                  </p>
                )}

                {isEditing && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label>Display Name</Label>
                      <Input
                        value={editData.display_name}
                        onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    {isCreator && (
                      <>
                        <div>
                          <Label>Bio</Label>
                          <Textarea
                            value={editData.bio}
                            onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                            className="mt-2"
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label>Category</Label>
                          <select
                            value={editData.category}
                            onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                            className="w-full mt-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
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
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {isCreator && creatorProfile && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatsCard
                label="Supporters"
                value={creatorProfile.supporters_count || 0}
                icon={Heart}
                iconColor="text-red-500"
                useBauhaus={true}
                accentColor="#ef4444"
              />
              <StatsCard
                label="Posts"
                value={posts.length}
                icon={FileText}
                iconColor="text-purple-600"
                useBauhaus={true}
                accentColor="#8b5cf6"
              />
              <StatsCard
                label="Total Earnings"
                value={creatorProfile.total_earnings || 0}
                icon={DollarSign}
                iconColor="text-green-600"
                prefix="NPR"
                useBauhaus={true}
                accentColor="#10b981"
              />
              <StatsCard
                label="Likes"
                value={creatorProfile.likes_count || 0}
                icon={Heart}
                iconColor="text-pink-600"
                useBauhaus={true}
                accentColor="#ec4899"
              />
            </div>
          )}

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <div className="border-b border-gray-200 dark:border-gray-800">
              <TabsList className="h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-6 py-3 text-base font-medium"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="posts"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-6 py-3 text-base font-medium"
                >
                  My Posts
                </TabsTrigger>
                <TabsTrigger 
                  value="activity"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent px-6 py-3 text-base font-medium"
                >
                  Activity
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">About</h3>
                  {creatorProfile?.bio ? (
                    <p className="text-gray-700 dark:text-gray-300">{creatorProfile.bio}</p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No bio added yet.</p>
                  )}
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Category</span>
                      <Badge variant="outline">{creatorProfile?.category || 'Not set'}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Joined</span>
                      <span className="text-sm">{formatDate(userProfile.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Role</span>
                      <Badge variant={isCreator ? 'default' : 'outline'}>
                        {isCreator ? 'Creator' : 'Supporter'}
                      </Badge>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    {isCreator ? (
                      <>
                        <Link href="/dashboard/creator">
                          <Button variant="outline" className="w-full justify-start">
                            <Crown className="w-4 h-4 mr-2" />
                            Creator Dashboard
                          </Button>
                        </Link>
                        <Link href={`/creator/${user?.id}`}>
                          <Button variant="outline" className="w-full justify-start">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Public Profile
                          </Button>
                        </Link>
                        <Link href="/dashboard/creator">
                          <Button variant="outline" className="w-full justify-start">
                            <FileText className="w-4 h-4 mr-2" />
                            Create Post
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <Link href="/signup/creator">
                        <Button className="w-full bg-gradient-to-r from-red-500 to-pink-600">
                          <Crown className="w-4 h-4 mr-2" />
                          Become a Creator
                        </Button>
                      </Link>
                    )}
                    <Link href="/settings">
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Posts Tab */}
            <TabsContent value="posts" className="mt-6 space-y-6">
              {postsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <Card key={post.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          {post.image_url ? <Camera className="w-5 h-5 text-white" /> : <FileText className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {post.title || 'Untitled Post'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={post.is_public ? "default" : "secondary"}>
                        {post.is_public ? "Public" : "Supporters Only"}
                      </Badge>
                    </div>
                    
                    {post.content && (
                      <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">{post.content}</p>
                    )}
                    
                    {post.image_url && (
                      <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={post.image_url}
                          alt="Post image"
                          width={600}
                          height={400}
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes_count || 0} likes</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments_count || 0} comments</span>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No Posts Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {isCreator 
                      ? 'Start creating content to share with your supporters!'
                      : 'Become a creator to start posting content!'
                    }
                  </p>
                  {isCreator ? (
                    <Link href="/dashboard/creator">
                      <Button>
                        <FileText className="w-4 h-4 mr-2" />
                        Create Post
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/signup/creator">
                      <Button>
                        <Crown className="w-4 h-4 mr-2" />
                        Become Creator
                      </Button>
                    </Link>
                  )}
                </Card>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-6 space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {posts.slice(0, 5).map((post) => (
                    <div key={post.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          Posted: {post.title || 'Untitled Post'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {post.likes_count || 0} likes
                      </div>
                    </div>
                  ))}
                  
                  {posts.length === 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                      No activity yet
                    </p>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
