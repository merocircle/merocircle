'use client'

import { useState, useEffect } from 'react'
import { useCreatorSearch } from '@/hooks/useSocial'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import CreatorCard from './CreatorCard'
import { Button } from '@/components/ui/button'

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
  }, [debouncedQuery])

  const handleClear = () => {
    setQuery('')
    clearResults()
  }

  return (
    <div className="w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
            className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-auto"
          >
            <X className="w-4 h-4 text-gray-400" />
          </Button>
        )}
      </div>

      <div className="mt-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <span className="ml-2 text-gray-500">Searching creators...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && debouncedQuery && results.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No creators found for "{debouncedQuery}"</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">
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
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Start typing to search for creators</p>
          </div>
        )}
      </div>
    </div>
  )
} 