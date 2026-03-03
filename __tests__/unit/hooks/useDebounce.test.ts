import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '@/hooks/useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300))
    expect(result.current).toBe('initial')
  })

  it('updates debounced value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } }
    )
    expect(result.current).toBe('first')

    rerender({ value: 'second', delay: 300 })
    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('second')
  })

  it('resets timer when value changes before delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    )

    rerender({ value: 'b' })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    rerender({ value: 'c' })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    expect(result.current).toBe('a')

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('c')
  })

  it('uses default delay of 300ms', () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebounce(value), {
      initialProps: { value: 'x' },
    })
    rerender({ value: 'y' })
    expect(result.current).toBe('x')
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('y')
  })
})
