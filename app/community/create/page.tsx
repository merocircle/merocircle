'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@/components/common/PageLayout';
import { useAuth } from '@/contexts/supabase-auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Hash, Volume2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/dashboard/LoadingSpinner';

export default function CreateChannelPage() {
  const { user, isCreator, loading: authLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'welcome' | 'supporter' | 'custom'>('custom');
  const [channelType, setChannelType] = useState<'text' | 'voice'>('text');
  const [creating, setCreating] = useState(false);

  if (authLoading) {
    return <PageLayout loading />;
  }

  if (!isCreator) {
    router.push('/community');
    return null;
  }

  const handleCreate = async () => {
    if (!name.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/community/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          channel_type: channelType,
        }),
      });

      if (response.ok) {
        router.push('/community');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create channel');
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      alert('Failed to create channel');
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageLayout hideRightPanel>
      <div className="py-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6 text-foreground">
            Create Channel
          </h1>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Channel Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="general"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Channel description..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label>Category</Label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value="welcome"
                    checked={category === 'welcome'}
                    onChange={(e) => setCategory(e.target.value as 'welcome')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-foreground">
                    Welcome (Auto-join when followed)
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value="supporter"
                    checked={category === 'supporter'}
                    onChange={(e) => setCategory(e.target.value as 'supporter')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-foreground">
                    Supporter (Auto-join when paid)
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value="custom"
                    checked={category === 'custom'}
                    onChange={(e) => setCategory(e.target.value as 'custom')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-foreground">
                    Custom (Manual invite)
                  </span>
                </label>
              </div>
            </div>

            <div>
              <Label>Channel Type</Label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="text"
                    checked={channelType === 'text'}
                    onChange={(e) => setChannelType(e.target.value as 'text')}
                    className="w-4 h-4"
                  />
                  <Hash className="w-4 h-4" />
                  <span className="text-sm text-foreground">Text</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="voice"
                    checked={channelType === 'voice'}
                    onChange={(e) => setChannelType(e.target.value as 'voice')}
                    className="w-4 h-4"
                  />
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm text-foreground">Voice</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || creating}
                className="flex-1"
              >
                {creating ? 'Creating...' : 'Create Channel'}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
