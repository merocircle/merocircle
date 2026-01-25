'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PageLayout } from '@/components/common/PageLayout'
import { useAuth } from '@/contexts/supabase-auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Settings,
  User,
  Bell,
  Shield,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Mail,
  Smartphone,
  Globe,
  CreditCard
} from 'lucide-react'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
  const router = useRouter()
  const { user, userProfile, isAuthenticated, loading, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [loading, isAuthenticated, router])

  const handleLogout = async () => {
    await signOut()
    router.push('/auth')
  }

  if (loading) {
    return <PageLayout loading />
  }

  if (!isAuthenticated || !userProfile) {
    return null
  }

  const settingSections = [
    {
      title: 'Account',
      icon: User,
      items: [
        {
          label: 'Edit Profile',
          description: 'Update your name, bio, and avatar',
          icon: User,
          onClick: () => router.push('/profile')
        },
        {
          label: 'Email',
          description: userProfile.email || 'Not set',
          icon: Mail,
          onClick: () => {}
        }
      ]
    },
    {
      title: 'Preferences',
      icon: Settings,
      items: [
        {
          label: 'Dark Mode',
          description: 'Toggle between light and dark theme',
          icon: theme === 'dark' ? Moon : Sun,
          toggle: true,
          checked: mounted && theme === 'dark',
          onToggle: () => setTheme(theme === 'dark' ? 'light' : 'dark')
        },
        {
          label: 'Language',
          description: 'English (US)',
          icon: Globe,
          onClick: () => {}
        }
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          label: 'Push Notifications',
          description: 'Receive push notifications',
          icon: Smartphone,
          toggle: true,
          checked: true,
          onToggle: () => {}
        },
        {
          label: 'Email Notifications',
          description: 'Receive email updates',
          icon: Mail,
          toggle: true,
          checked: true,
          onToggle: () => {}
        }
      ]
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        {
          label: 'Privacy Settings',
          description: 'Control who can see your content',
          icon: Shield,
          onClick: () => {}
        },
        {
          label: 'Payment Methods',
          description: 'Manage your payment options',
          icon: CreditCard,
          onClick: () => {}
        }
      ]
    }
  ]

  return (
    <PageLayout hideRightPanel>
      <div className="py-4 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="p-3 bg-primary/10 rounded-xl">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account preferences
            </p>
          </div>
        </motion.div>

        {/* Settings Sections */}
        {settingSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <Card className="overflow-hidden">
              <div className="p-4 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-2">
                  <section.icon className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">{section.title}</h2>
                </div>
              </div>

              <div className="divide-y divide-border">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between p-4 ${
                      !item.toggle ? 'hover:bg-muted/50 cursor-pointer transition-colors' : ''
                    }`}
                    onClick={item.toggle ? undefined : item.onClick}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <item.icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>

                    {item.toggle ? (
                      <Switch
                        checked={item.checked}
                        onCheckedChange={item.onToggle}
                      />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </Card>
        </motion.div>

        {/* Version Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground"
        >
          MeroCircle v1.0.0
        </motion.p>
      </div>
    </PageLayout>
  )
}
