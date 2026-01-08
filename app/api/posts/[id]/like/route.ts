import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface Params {
  id: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: postId } = await params;

    // Redirect to the consolidated social like API
    const response = await fetch(`${request.nextUrl.origin}/api/social/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({ postId, action: 'like' })
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    logger.error('Error liking post', 'LIKE_API', { error: error instanceof Error ? error.message : 'Unknown', postId });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: postId } = await params;

    // Redirect to the consolidated social like API
    const response = await fetch(`${request.nextUrl.origin}/api/social/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({ postId, action: 'unlike' })
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    logger.error('Error unliking post', 'LIKE_API', { error: error instanceof Error ? error.message : 'Unknown', postId });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 