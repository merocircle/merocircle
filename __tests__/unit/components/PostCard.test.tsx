import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PostCard from '@/components/posts/PostCard'

const minimalPost = {
  id: 'post-1',
  title: 'Test Post',
  content: 'Hello world content',
  tier_required: 'free',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  creator: {
    id: 'c1',
    display_name: 'Test Creator',
    photo_url: null,
    role: 'creator',
  },
  creator_profile: { category: 'Education', is_verified: false },
  likes_count: 0,
  comments_count: 0,
}

describe('PostCard', () => {
  it('renders post title and content', () => {
    render(<PostCard post={minimalPost} />)
    expect(screen.getByText('Test Post')).toBeInTheDocument()
    expect(screen.getByText('Hello world content')).toBeInTheDocument()
  })

  it('renders creator display name', () => {
    render(<PostCard post={minimalPost} />)
    expect(screen.getByText('Test Creator')).toBeInTheDocument()
  })

  it('calls onLike when like button is clicked', async () => {
    const user = userEvent.setup()
    const onLike = vi.fn()
    render(<PostCard post={minimalPost} onLike={onLike} currentUserId="user-1" />)
    const actionsRow = screen.getByText('Share').closest('div')?.parentElement
    const buttons = actionsRow?.querySelectorAll('button') ?? []
    const likeButton = buttons[0]
    expect(likeButton).toBeDefined()
    await user.click(likeButton!)
    expect(onLike).toHaveBeenCalledWith('post-1')
  })

  it('shows like and comment counts', () => {
    render(<PostCard post={{ ...minimalPost, likes_count: 3, comments_count: 2 }} />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})
