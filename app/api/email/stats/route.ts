import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Email Queue Statistics and Health Check
 * GET /api/email/stats
 * 
 * Returns:
 * - Queue statistics (pending, sent, failed)
 * - Recent failures
 * - Health score
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get statistics for last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Count by status
    const { data: statusCounts } = await supabase
      .from('email_queue')
      .select('status')
      .gte('created_at', last24Hours);
    
    const stats = {
      pending: statusCounts?.filter(e => e.status === 'pending').length || 0,
      processing: statusCounts?.filter(e => e.status === 'processing').length || 0,
      sent: statusCounts?.filter(e => e.status === 'sent').length || 0,
      failed: statusCounts?.filter(e => e.status === 'failed').length || 0,
      total: statusCounts?.length || 0,
    };
    
    // Get recent failures
    const { data: recentFailures } = await supabase
      .from('email_queue')
      .select('id, email_type, recipient_email, last_error, attempts, created_at')
      .eq('status', 'failed')
      .gte('created_at', last24Hours)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Get oldest pending email (indicates queue backup)
    const { data: oldestPending } = await supabase
      .from('email_queue')
      .select('created_at, email_type')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    
    // Calculate health score (0-100)
    const successRate = stats.total > 0 
      ? ((stats.sent / stats.total) * 100).toFixed(1)
      : 100;
    
    const queueBacklog = stats.pending + stats.processing;
    const isHealthy = parseFloat(successRate) > 95 && queueBacklog < 50;
    
    // Check if oldest pending is too old (> 10 minutes)
    const oldestPendingAge = oldestPending 
      ? Date.now() - new Date(oldestPending.created_at).getTime()
      : 0;
    const hasStaleQueue = oldestPendingAge > 10 * 60 * 1000; // 10 minutes
    
    const health = {
      status: isHealthy && !hasStaleQueue ? 'healthy' : 'degraded',
      score: parseFloat(successRate),
      issues: [
        ...(parseFloat(successRate) < 95 ? ['Low success rate'] : []),
        ...(queueBacklog > 50 ? ['High queue backlog'] : []),
        ...(hasStaleQueue ? ['Stale pending emails detected'] : []),
      ],
    };
    
    logger.info('Email queue health check', 'EMAIL_QUEUE', {
      health: health.status,
      stats,
    });
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      health,
      recentFailures: recentFailures || [],
      queueAge: oldestPending ? {
        created_at: oldestPending.created_at,
        age_minutes: Math.floor(oldestPendingAge / 60000),
        type: oldestPending.email_type,
      } : null,
    });
    
  } catch (error: any) {
    logger.error('Failed to fetch email stats', 'EMAIL_QUEUE', {
      error: error.message,
    });
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch statistics',
    }, { status: 500 });
  }
}
