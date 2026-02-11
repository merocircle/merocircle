import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { config } from '@/lib/config';
import { validateFileSize } from '@/lib/validation';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { getAuthenticatedUser, handleApiError } from '@/lib/api-utils';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user) return errorResponse || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createAdminClient();

    if (!rateLimit(`upload:${user.id}`, 10, 60000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      logger.error('Failed to parse form data', 'UPLOAD_API', { error: error instanceof Error ? error.message : 'Unknown' });
      return NextResponse.json({ 
        error: 'Failed to process upload. File may be too large. Maximum size is 50MB.' 
      }, { status: 413 });
    }

    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'posts';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const sizeValidation = validateFileSize(file.size, config.upload.maxFileSize);
    if (!sizeValidation.valid) {
      return NextResponse.json({ error: sizeValidation.error }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const uploadOptions: any = {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg'
    };

    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, file, uploadOptions);

    if (error) {
      logger.error('Upload failed', 'UPLOAD_API', { error: error.message, userId: user.id, fileType: file.type });
      return NextResponse.json({ 
        error: error.message || 'Upload failed',
        details: error.message
      }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    logger.info('File uploaded successfully', 'UPLOAD_API', { userId: user.id, path: data.path });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path
    });
  } catch (error) {
    return handleApiError(error, 'UPLOAD_API', 'Upload failed');
  }
}
