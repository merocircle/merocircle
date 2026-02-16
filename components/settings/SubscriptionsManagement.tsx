'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, CreditCard, AlertCircle, RefreshCw, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import { getValidAvatarUrl } from '@/lib/utils';
import { UnsubscribeDialog } from './UnsubscribeDialog';

interface Subscription {
  id: string;
  supporterId: string;
  creatorId: string;
  creator: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  tier: {
    level: number;
    name: string;
    price: number;
    description?: string;
    benefits: string[];
  };
  amount: number;
  currency: string;
  paymentGateway: string;
  status: string;
  state: 'active' | 'expiring_soon' | 'expired' | 'cancelled';
  billingCycle: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  daysUntilExpiry: number | null;
  reminderSentAt: Record<string, string>;
  autoRenew: boolean;
  renewalCount: number;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** True when membership is from supporters table only (no subscription row) */
  isSupportOnly?: boolean;
}

export default function SubscriptionsManagement() {
  const queryClient = useQueryClient();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribeDialogOpen, setUnsubscribeDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions/my-subscriptions');
      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (err: any) {
      console.error('Error fetching subscriptions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribeClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setUnsubscribeDialogOpen(true);
  };

  const handleUnsubscribeConfirm = async (feedback?: string) => {
    if (!selectedSubscription) return;

    const isSupportOnly = selectedSubscription.isSupportOnly || String(selectedSubscription.id).startsWith('supporters:');
    const body = isSupportOnly
      ? { creator_id: selectedSubscription.creatorId, feedback }
      : { subscription_id: selectedSubscription.id, feedback };

    try {
      const response = await fetch('/api/subscriptions/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe');
      }

      // Refresh subscriptions list and "Your circle" on home
      await fetchSubscriptions();
      queryClient.invalidateQueries({ queryKey: ['supporter', 'creators'] });
      setUnsubscribeDialogOpen(false);
      setSelectedSubscription(null);
    } catch (err: any) {
      console.error('Error unsubscribing:', err);
      alert(`Failed to unsubscribe: ${err.message}`);
    }
  };

  const handleQuickRenew = async (subscription: Subscription) => {
    try {
      setRenewingId(subscription.id);

      const response = await fetch('/api/subscriptions/quick-renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: subscription.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to prepare renewal');
      }

      const data = await response.json();

      // Redirect to creator page with renew flag
      window.location.href = `/creator/${subscription.creatorId}?renew=true&tier=${subscription.tier.level}`;
    } catch (err: any) {
      console.error('Error renewing subscription:', err);
      alert(`Failed to renew: ${err.message}`);
    } finally {
      setRenewingId(null);
    }
  };

  const getStatusBadge = (subscription: Subscription) => {
    switch (subscription.state) {
      case 'active':
        return (
          <Badge className="bg-green-500 text-white">
            Active
          </Badge>
        );
      case 'expiring_soon':
        return (
          <Badge className="bg-yellow-500 text-white">
            Expiring Soon
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-500 text-white">
            Expired
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="text-gray-500">
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  const getGatewayBadge = (gateway: string) => {
    const gatewayNames: Record<string, string> = {
      esewa: 'eSewa',
      khalti: 'Khalti',
      dodo: 'Dodo (Visa/MC)',
      direct: 'Direct',
    };

    const gatewayColors: Record<string, string> = {
      esewa: 'bg-green-600',
      khalti: 'bg-purple-600',
      dodo: 'bg-blue-600',
      direct: 'bg-gray-600',
    };

    return (
      <Badge className={`${gatewayColors[gateway] || 'bg-gray-500'} text-white text-xs`}>
        {gatewayNames[gateway] || gateway}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Guard against epoch / invalid dates
    if (isNaN(date.getTime()) || date.getTime() < 86400000) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">Loading subscriptions...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>Failed to load subscriptions</p>
          <p className="text-sm mt-1">{error}</p>
          <Button onClick={fetchSubscriptions} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">No Active Subscriptions</p>
          <p className="text-sm">You haven't subscribed to any creators yet.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/explore">Explore Creators</Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Your Subscriptions</h3>
            <p className="text-sm text-gray-500">Manage all your creator subscriptions</p>
          </div>
          <Button onClick={fetchSubscriptions} variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {subscriptions.map((subscription) => (
          <Card key={subscription.id} className="p-4">
            <div className="flex items-start gap-4">
              {/* Creator Avatar */}
              <Avatar className="w-16 h-16">
                <AvatarImage src={getValidAvatarUrl(subscription.creator.avatarUrl)} alt={subscription.creator.displayName} />
                <AvatarFallback>
                  {subscription.creator.displayName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Subscription Details */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-lg">{subscription.creator.displayName}</h4>
                    <p className="text-sm text-gray-600">{subscription.tier.name}</p>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(subscription)}
                    {getGatewayBadge(subscription.paymentGateway)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <CreditCard className="w-4 h-4" />
                    <span>{subscription.currency} {subscription.amount.toLocaleString()}/month</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {subscription.state === 'expired' ? (
                      <span className="text-red-600">Expired {formatDate(subscription.currentPeriodEnd)}</span>
                    ) : subscription.state === 'cancelled' ? (
                      <span className="text-gray-500">Cancelled {subscription.cancelledAt ? formatDate(subscription.cancelledAt) : ''}</span>
                    ) : !subscription.currentPeriodEnd ? (
                      <span className="text-muted-foreground">Free tier (no expiry)</span>
                    ) : (
                      <span>
                        Auto-renews {formatDate(subscription.currentPeriodEnd)}
                        {subscription.daysUntilExpiry !== null && subscription.daysUntilExpiry > 0 && (
                          <span className={subscription.state === 'expiring_soon' ? 'text-yellow-600 font-medium' : ''}>
                            {' '}({subscription.daysUntilExpiry} days)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  {subscription.state !== 'cancelled' && (
                    <>
                      {(subscription.state === 'expired' || subscription.state === 'expiring_soon') && 
                       (subscription.paymentGateway === 'esewa' || subscription.paymentGateway === 'khalti') && (
                        <Button
                          onClick={() => handleQuickRenew(subscription)}
                          disabled={renewingId === subscription.id}
                          size="sm"
                          variant="default"
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${renewingId === subscription.id ? 'animate-spin' : ''}`} />
                          Renew Now
                        </Button>
                      )}

                      <Button
                        onClick={() => handleUnsubscribeClick(subscription)}
                        size="sm"
                        variant="destructive"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Unsubscribe
                      </Button>
                    </>
                  )}

                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                  >
                    <Link href={`/creator/${subscription.creatorId}`}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Creator
                    </Link>
                  </Button>
                </div>

                {/* Additional Info */}
                {subscription.renewalCount > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Renewed {subscription.renewalCount} time{subscription.renewalCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Unsubscribe Dialog */}
      {selectedSubscription && (
        <UnsubscribeDialog
          open={unsubscribeDialogOpen}
          onClose={() => {
            setUnsubscribeDialogOpen(false);
            setSelectedSubscription(null);
          }}
          onConfirm={handleUnsubscribeConfirm}
          subscription={{
            creatorName: selectedSubscription.creator.displayName,
            tierName: selectedSubscription.tier.name,
            amount: selectedSubscription.amount,
            currency: selectedSubscription.currency,
          }}
        />
      )}
    </>
  );
}
