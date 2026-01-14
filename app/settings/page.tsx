'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/sidebar-nav';
import { useAuth } from '@/contexts/supabase-auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Bell, 
  Shield, 
  Palette,
  CreditCard,
  Globe,
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
  Crown
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user, userProfile, creatorProfile, isAuthenticated, loading, isCreator } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    display_name: '',
    bio: '',
    category: ''
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        display_name: userProfile.display_name || '',
        bio: creatorProfile?.bio || '',
        category: creatorProfile?.category || ''
      });
    }
  }, [userProfile, creatorProfile]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
        <SidebarNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </main>
      </div>
    );
  }
  const handleSave = async () => {
    setIsSaving(true);
    // Save logic here
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <SidebarNav />
      
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage your account settings and preferences
                </p>
              </div>
              {isCreator && (
                <Badge variant="default" className="bg-red-500">
                  <Crown className="w-3 h-3 mr-1" />
                  Creator
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1 grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-2">
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Billing</span>
              </TabsTrigger>
              <TabsTrigger value="language" className="gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Language</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Settings */}
            <TabsContent value="profile" className="space-y-6">
              {/* Avatar Section */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
                <div className="flex items-center gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={userProfile?.photo_url} alt={userProfile?.display_name || 'User'} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl">
                      {userProfile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Button variant="outline" size="sm">
                      <Camera className="w-4 h-4 mr-2" />
                      Change Avatar
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      Recommended: Square image, at least 400x400px
                    </p>
                  </div>
                </div>
              </Card>

              {/* Profile Information */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Display Name</Label>
                    <Input 
                      id="name" 
                      value={profileData.display_name}
                      onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                      placeholder="Your name" 
                      className="mt-2" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={userProfile?.email || ''}
                      disabled
                      className="mt-2 bg-gray-50 dark:bg-gray-900" 
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  {isCreator && (
                    <>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea 
                          id="bio" 
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          placeholder="Tell us about yourself" 
                          className="mt-2"
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          value={profileData.category}
                          onChange={(e) => setProfileData({ ...profileData, category: e.target.value })}
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
                  <Button onClick={handleSave} disabled={isSaving}>
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
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Choose what notifications you want to receive
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">New followers</p>
                      <p className="text-sm text-gray-500">Get notified when someone follows you</p>
                    </div>
                    <Button variant="outline" size="sm">Enable</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Comments</p>
                      <p className="text-sm text-gray-500">Get notified when someone comments on your posts</p>
                    </div>
                    <Button variant="outline" size="sm">Enable</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Payments</p>
                      <p className="text-sm text-gray-500">Get notified when you receive payments</p>
                    </div>
                    <Button variant="outline" size="sm">Enable</Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Privacy Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Profile visibility</p>
                      <p className="text-sm text-gray-500">Control who can see your profile</p>
                    </div>
                    <Button variant="outline" size="sm">Public</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Activity status</p>
                      <p className="text-sm text-gray-500">Show when you&apos;re active</p>
                    </div>
                    <Button variant="outline" size="sm">On</Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Appearance</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Theme</p>
                      <p className="text-sm text-gray-500">Choose your preferred theme</p>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Billing Settings */}
            <TabsContent value="billing" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Billing Information</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your payment methods and billing information
                </p>
                <div className="mt-6">
                  <Button>Add Payment Method</Button>
                </div>
              </Card>
            </TabsContent>

            {/* Language Settings */}
            <TabsContent value="language" className="space-y-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Language & Region</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <select 
                      id="language" 
                      className="mt-2 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
                    >
                      <option>English</option>
                      <option>नेपाली (Nepali)</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <select 
                      id="timezone" 
                      className="mt-2 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
                    >
                      <option>Asia/Kathmandu</option>
                    </select>
                  </div>
                  <Button>Save Changes</Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
