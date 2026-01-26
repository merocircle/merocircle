import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { slugifyDisplayName } from '@/lib/utils';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const decoded = decodeURIComponent(username || '').trim();

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }

    const normalized = decoded
      .toLowerCase()
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const pattern = `%${normalized.split(' ').join('%')}%`;
    const requestedSlug = slugifyDisplayName(decoded);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('creator_profiles')
      .select('user_id, users!inner(display_name, role)')
      .ilike('users.display_name', pattern)
      .limit(10);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const matched = data.find((row: any) => {
      const displayName = row?.users?.display_name || '';
      return slugifyDisplayName(displayName) === requestedSlug;
    }) || data[0];

    return NextResponse.json({
      creatorId: matched.user_id,
      displayName: matched.users?.display_name || ''
    });
  } catch (error) {
    console.error('Username resolve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
