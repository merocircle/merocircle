'use client'

import { useState, useEffect } from 'react'
import { useCreatorSearch } from '@/hooks/useSocial'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import CreatorCard from './CreatorCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils';
import { layout, responsive, colors, typography, effects } from '@/lib/tailwind-utils';

interface CreatorSearchProps {
  placeholder?: string
}

export default function CreatorSearch({ 
  placeholder = "Search creators..." 
}: CreatorSearchProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const { results, loading, error, searchCreators, clearResults } = useCreatorSearch()

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      searchCreators(debouncedQuery)
    } else {
      clearResults()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  const handleClear = () => {
    setQuery('')
    clearResults()
  }

  return (
    <div className="w-full">
      <div className="relative">
        <Search className={cn('absolute left-3 top-1/2 transform -translate-y-1/2', colors.text.muted, responsive.icon)} />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className={cn('absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-auto')}
          >
            <X className={cn(responsive.icon, colors.text.muted)} />
          </Button>
        )}
      </div>

      <div className="mt-4">
        {loading && (
          <div className={cn(layout.flexCenter, 'py-8')}>
            <div className={cn('w-5 h-5 border-2 border-gray-300 border-t-blue-600', effects.rounded.full, 'animate-spin')} />
            <span className={cn('ml-2', colors.text.muted)}>Searching creators...</span>
          </div>
        )}

        {error && (
          <div className={cn('bg-red-50 border border-red-200', effects.rounded.lg, 'p-4 text-center')}>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && debouncedQuery && results.length === 0 && (
          <div className="text-center py-8">
            <p className={colors.text.muted}>No creators found for &quot;{debouncedQuery}&quot;</p>
          </div>
        )}

        {results.length > 0 && (
          <div className={layout.gapLarge}>
            <h3 className={cn('font-semibold', colors.text.primary)}>
              Found {results.length} creator{results.length !== 1 ? 's' : ''}
            </h3>
            <div className="grid gap-4">
              {results.map((creator) => (
                <CreatorCard key={creator.user_id} creator={creator} />
              ))}
            </div>
          </div>
        )}

        {!query && !loading && (
          <div className="text-center py-8">
            <Search className={cn('w-12 h-12 text-gray-300 mx-auto mb-3')} />
            <p className={colors.text.muted}>Start typing to search for creators</p>
          </div>
        )}
      </div>
    </div>
  )
} 