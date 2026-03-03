import { http, HttpResponse } from 'msw'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://test.supabase.co'

/** NextAuth session mock */
export const sessionHandler = http.get(`${baseUrl}/api/auth/session`, () => {
  return HttpResponse.json({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
    },
    expires: '2099-01-01',
  })
})

/** Supabase REST API mocks - match /rest/v1/* */
export const supabaseHandlers = [
  http.get(`${supabaseUrl}/rest/v1/users`, () => {
    return HttpResponse.json(
      [
        {
          id: 'test-user-id',
          email: 'test@example.com',
          display_name: 'Test User',
          photo_url: null,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      { headers: { 'Content-Range': '0-0/1' } }
    )
  }),
  http.get(`${supabaseUrl}/rest/v1/creator_profiles`, () => {
    return HttpResponse.json([], { headers: { 'Content-Range': '0-0/0' } })
  }),
]

/** App API route mocks - used by hooks and components */
export const apiHandlers = [
  http.get(`${baseUrl}/api/auth/session`, () => {
    return HttpResponse.json({
      user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User', image: null },
      expires: '2099-01-01',
    })
  }),
  http.get(`${baseUrl}/api/dashboard/unified-feed`, () => {
    return HttpResponse.json({ posts: [], nextPage: null })
  }),
  http.get(`${baseUrl}/api/dashboard/discover`, () => {
    return HttpResponse.json({ creators: [], nextPage: null })
  }),
  http.get(`${baseUrl}/api/creator/analytics`, () => {
    return HttpResponse.json({ views: 0, likes: 0, revenue: 0 })
  }),
  http.get(`${baseUrl}/api/notifications`, () => {
    return HttpResponse.json({ notifications: [], unreadCount: 0 })
  }),
  http.get(`${baseUrl}/api/community/channels`, () => {
    return HttpResponse.json({ channels: [] })
  }),
  http.get(`${baseUrl}/api/posts`, () => {
    return HttpResponse.json({ posts: [], nextPage: null })
  }),
  http.get(`${baseUrl}/api/creator/tiers`, () => {
    return HttpResponse.json({ tiers: [] })
  }),
  http.get(/^.*\/api\/creator\/[^/]+$/, () => {
    return HttpResponse.json({
      id: 'creator-1',
      user_id: 'test-user-id',
      vanity_username: 'testcreator',
      bio: 'Test bio',
      category: 'Education',
      is_verified: false,
      total_earnings: 0,
      supporters_count: 0,
      followers_count: 0,
      posts_count: 0,
      likes_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }),
  http.get(/^.*\/api\/posts\/[^/]+$/, () => {
    return HttpResponse.json({
      id: 'post-1',
      creator_id: 'creator-1',
      content: 'Test post',
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
    })
  }),
  http.post(`${baseUrl}/api/social/like`, () => {
    return HttpResponse.json({ success: true })
  }),
  http.get(/^.*\/api\/posts\/[^/]+\/comments$/, () => {
    return HttpResponse.json({ comments: [] })
  }),
  http.post(/^.*\/api\/posts\/[^/]+\/comments$/, () => {
    return HttpResponse.json({ id: 'comment-1', content: 'Test comment' })
  }),
  http.post(/^.*\/api\/posts\/[^/]+\/like$/, () => {
    return HttpResponse.json({ success: true })
  }),
  http.delete(/^.*\/api\/posts\/[^/]+\/like$/, () => {
    return HttpResponse.json({ success: true })
  }),
  http.get(`${baseUrl}/api/subscriptions/my-subscriptions`, () => {
    return HttpResponse.json({ subscriptions: [] })
  }),
  http.get(`${baseUrl}/api/supporter/creators`, () => {
    return HttpResponse.json({ creators: [] })
  }),
  http.get(`${baseUrl}/api/supporter/history`, () => {
    return HttpResponse.json({ transactions: [] })
  }),
  http.get(`${baseUrl}/api/earnings`, () => {
    return HttpResponse.json({ earnings: [], total: 0 })
  }),
  http.get(`${baseUrl}/api/admin/stats`, () => {
    return HttpResponse.json({ users: 0, creators: 0, revenue: 0 })
  }),
  http.get(`${baseUrl}/api/admin/transactions`, () => {
    return HttpResponse.json({ transactions: [] })
  }),
  http.get(`${baseUrl}/api/feedback`, () => {
    return HttpResponse.json({ feedback: [] })
  }),
  http.post(`${baseUrl}/api/feedback`, () => {
    return HttpResponse.json({ success: true })
  }),
  http.get(`${baseUrl}/api/email/stats`, () => {
    return HttpResponse.json({ sent: 0, failed: 0 })
  }),
]

/** Payment provider mocks (external URLs) */
export const paymentHandlers = [
  http.post(/esewa\.com\.np.*/, () => {
    return HttpResponse.json({ success: true, transaction_id: 'test-esewa-id' })
  }),
  http.post(/khalti\.com.*/, () => {
    return HttpResponse.json({ success: true, idx: 'test-khalti-idx' })
  }),
  http.post(/dodo.*webhook.*/i, () => {
    return HttpResponse.json({ received: true })
  }),
]

export const handlers = [
  ...supabaseHandlers,
  ...apiHandlers,
  ...paymentHandlers,
]
