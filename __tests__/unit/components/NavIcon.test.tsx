import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Home } from 'lucide-react'
import { NavIcon } from '@/components/navigation/NavIcon'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('NavIcon', () => {
  it('renders with label', () => {
    render(<NavIcon icon={Home} label="Home" showLabel />)
    expect(screen.getByText('Home')).toBeInTheDocument()
  })

  it('renders as link when href is provided', () => {
    render(<NavIcon icon={Home} label="Home" href="/home" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/home')
  })

  it('calls onClick when clicked and no href', async () => {
    const onClick = vi.fn()
    render(<NavIcon icon={Home} label="Home" onClick={onClick} />)
    const button = screen.getByRole('button')
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('shows badge when badge number is provided', () => {
    render(<NavIcon icon={Home} label="Notifications" badge={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows 99+ for badge over 99', () => {
    render(<NavIcon icon={Home} label="Notifications" badge={100} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })
})
