'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, ExternalLink, Mail, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface PendingCreator {
  id: string;
  profileId: string;
  displayName: string;
  email: string;
  username: string;
  photoUrl: string | null;
  bio: string;
  category: string;
  socialLinks: Record<string, string>;
  createdAt: string;
}

export function OnboardingTab() {
  const [creators, setCreators] = useState<PendingCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingCreators();
  }, []);

  const fetchPendingCreators = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/onboarding');
      const data = await response.json();

      if (data.success) {
        setCreators(data.creators || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load pending creators',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load pending creators',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardClick = async (creator: PendingCreator) => {
    const confirmed = window.confirm(
      `Are you sure you want to onboard ${creator.displayName}? This will grant them full access to creator features.`
    );
    
    if (!confirmed) return;

    try {
      setOnboardingId(creator.id);
      const response = await fetch('/api/admin/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: creator.id })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `${creator.displayName} has been onboarded successfully`
        });
        // Remove from list
        setCreators(creators.filter(c => c.id !== creator.id));
      } else {
        toast({
          title: 'Error',
          description: 'Failed to onboard creator',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to onboard creator',
        variant: 'destructive'
      });
    } finally {
      setOnboardingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (creators.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Creator Onboarding</CardTitle>
          <CardDescription>No creators pending onboarding</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
          <p className="text-muted-foreground">All creators have been onboarded!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Creator Onboarding</CardTitle>
          <CardDescription>
            Review and approve creators waiting to be onboarded ({creators.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {creators.map((creator) => (
              <Card key={creator.id} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={creator.photoUrl || undefined} alt={creator.displayName} />
                      <AvatarFallback className="text-lg">
                        {creator.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {creator.displayName}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Mail className="w-4 h-4" />
                            {creator.email}
                          </div>
                          {creator.username && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <User className="w-4 h-4" />
                              @{creator.username}
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={() => handleOnboardClick(creator)}
                          disabled={onboardingId === creator.id}
                          className="shrink-0"
                        >
                          {onboardingId === creator.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Onboarding...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Verify & Onboard
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Category */}
                      {creator.category && (
                        <Badge variant="secondary" className="mb-2">
                          {creator.category}
                        </Badge>
                      )}

                      {/* Bio */}
                      {creator.bio && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {creator.bio}
                        </p>
                      )}

                      {/* Social Links */}
                      {Object.keys(creator.socialLinks || {}).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {Object.entries(creator.socialLinks).map(([platform, url]) => (
                            <a
                              key={platform}
                              href={url as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              {platform}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Created Date */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        Signed up {format(new Date(creator.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
