/**
 * Mock Supabase server client for API route handler tests.
 * Chainable: from().select().eq().order().range() etc., then await for { data, error } or { count, error }.
 */
export function createMockSupabaseClient(overrides?: {
  postsData?: unknown[]
  postLikesData?: unknown[]
  postCommentsData?: unknown[]
  creatorProfilesData?: unknown[]
  notificationsData?: unknown[]
  postsCount?: number
}) {
  const state = {
    table: '',
    isCountQuery: false,
    postsData: overrides?.postsData ?? [],
    postLikesData: overrides?.postLikesData ?? [],
    postCommentsData: overrides?.postCommentsData ?? [],
    creatorProfilesData: overrides?.creatorProfilesData ?? [],
    notificationsData: overrides?.notificationsData ?? [],
    postsCount: overrides?.postsCount ?? 0,
  }

  const createChain = (): unknown => {
    return {
      from(table: string) {
        state.table = table
        state.isCountQuery = false
        return createChain()
      },
      select(_cols?: unknown, opts?: { count?: string; head?: boolean }) {
        if (opts?.count === 'exact' && opts?.head === true) state.isCountQuery = true
        return createChain()
      },
      eq(_col: string, _val: unknown) {
        return createChain()
      },
      in(_col: string, _vals: unknown) {
        const data =
          state.table === 'post_likes'
            ? state.postLikesData
            : state.table === 'post_comments'
              ? state.postCommentsData
              : state.table === 'creator_profiles'
                ? state.creatorProfilesData
                : []
        return Promise.resolve({ data: data as unknown[], error: null })
      },
      order(_col: string, _opts?: { ascending?: boolean }) {
        return createChain()
      },
      limit(_n: number) {
        return createChain()
      },
      range(_from: number, _to: number) {
        const data =
          state.table === 'posts'
            ? state.postsData
            : state.table === 'post_likes'
              ? state.postLikesData
              : state.table === 'post_comments'
                ? state.postCommentsData
                : state.table === 'creator_profiles'
                  ? state.creatorProfilesData
                  : []
        return Promise.resolve({ data: data as unknown[], error: null })
      },
      then(resolve: (v: { data?: unknown[]; count?: number; error: null }) => void) {
        if (state.isCountQuery && state.table === 'posts') {
          return Promise.resolve({ count: state.postsCount, error: null }).then(resolve)
        }
        const data =
          state.table === 'notifications'
            ? state.notificationsData
            : state.table === 'posts'
              ? state.postsData
              : []
        return Promise.resolve({ data: data as unknown[], error: null }).then(resolve)
      },
    }
  }

  return createChain()
}
