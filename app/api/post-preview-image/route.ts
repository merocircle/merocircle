import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOptionalUser, handleApiError } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import sharp from 'sharp';

const PREVIEW_MAX_WIDTH = 96;
const PREVIEW_QUALITY = 65;
const CACHE_MAX_AGE = 86400; // 24 hours

type PostRow = {
  id: string;
  creator_id: string;
  image_url: string | null;
  image_urls: string[] | null;
};

export async function GET(request: NextRequest) {
  try {
    const user = await getOptionalUser();
    if (!user) {
      logger.info('Post preview: unauthenticated', 'POST_PREVIEW_IMAGE', {});
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');
    const index = Math.max(0, parseInt(searchParams.get('index') ?? '0', 10));

    if (!postId) {
      return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
    }

    logger.info('Post preview: start', 'POST_PREVIEW_IMAGE', {
      postId,
      index,
      userId: user.id,
    });

    const supabase = await createClient();

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, creator_id, image_url, image_urls')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      logger.info('Post preview: post not found', 'POST_PREVIEW_IMAGE', {
        postId,
        error: postError?.message,
      });
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const row = post as PostRow;

    // This route is only for non-supporters. If user is creator or supporter, deny.
    if (row.creator_id === user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: supporterRow } = await supabase
      .from('supporters')
      .select('id')
      .eq('supporter_id', user.id)
      .eq('creator_id', row.creator_id)
      .eq('is_active', true)
      .maybeSingle();

    if (supporterRow) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const urls = row.image_urls && row.image_urls.length > 0
      ? row.image_urls
      : row.image_url
        ? [row.image_url]
        : [];

    const imageUrl = urls[index];
    if (!imageUrl) {
      logger.info('Post preview: no image URL for index', 'POST_PREVIEW_IMAGE', {
        postId,
        index,
        urlsCount: urls.length,
      });
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    logger.info('Post preview: fetching source image', 'POST_PREVIEW_IMAGE', {
      postId,
      imageUrl: imageUrl.slice(0, 80) + (imageUrl.length > 80 ? '...' : ''),
    });

    const imageRes = await fetch(imageUrl, {
      headers: { 'Accept': 'image/*' },
      cache: 'force-cache',
    });

    const contentType = imageRes.headers.get('content-type') ?? '';
    const contentLength = imageRes.headers.get('content-length');

    if (!imageRes.ok) {
      logger.info('Post preview: source fetch failed', 'POST_PREVIEW_IMAGE', {
        postId,
        status: imageRes.status,
        contentType,
      });
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
    }

    const buffer = Buffer.from(await imageRes.arrayBuffer());

    logger.info('Post preview: source loaded', 'POST_PREVIEW_IMAGE', {
      postId,
      bufferLength: buffer.length,
      contentType,
      contentLength,
    });

    if (buffer.length === 0) {
      logger.info('Post preview: empty source buffer', 'POST_PREVIEW_IMAGE', { postId });
      return NextResponse.json({ error: 'Empty image' }, { status: 502 });
    }

    const previewBuffer = await sharp(buffer)
      .resize(PREVIEW_MAX_WIDTH, null, { withoutEnlargement: true })
      .jpeg({ quality: PREVIEW_QUALITY })
      .toBuffer();

    logger.info('Post preview: generated', 'POST_PREVIEW_IMAGE', {
      postId,
      previewLength: previewBuffer.length,
      sourceLength: buffer.length,
    });

    return new NextResponse(new Uint8Array(previewBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
      },
    });
  } catch (error) {
    logger.error('Post preview: error', 'POST_PREVIEW_IMAGE', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return handleApiError(error, 'POST_PREVIEW_IMAGE', 'Failed to generate preview');
  }
}
