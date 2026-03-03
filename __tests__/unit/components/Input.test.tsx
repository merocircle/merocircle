import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter email" />)
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
  })

  it('has data-slot attribute', () => {
    const { container } = render(<Input />)
    expect(container.querySelector('[data-slot="input"]')).toBeInTheDocument()
  })

  it('accepts and displays value', async () => {
    render(<Input defaultValue="hello" />)
    const input = screen.getByDisplayValue('hello')
    expect(input).toBeInTheDocument()
    await userEvent.clear(input)
    await userEvent.type(input, 'world')
    expect(input).toHaveValue('world')
  })

  it('supports disabled state', () => {
    render(<Input disabled placeholder="Disabled" />)
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled()
  })

  it('supports type attribute', () => {
    render(<Input type="password" placeholder="Password" />)
    const input = screen.getByPlaceholderText('Password')
    expect(input).toHaveAttribute('type', 'password')
  })
})
