import { memo } from 'react';

export const FeedSkeleton = memo(function FeedSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded w-full" />
      <div className="flex gap-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 dark:bg-gray-800 rounded-full w-24" />
        ))}
      </div>
      <div className="grid grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded" />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded" />
      ))}
    </div>
  );
});

export const ChatSkeleton = memo(function ChatSkeleton() {
  return (
    <div className="flex h-full">
      <div className="w-60 border-r border-gray-200 dark:border-gray-800 p-4 space-y-3 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 dark:bg-gray-800 rounded" />
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-32" />
                <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export const NotificationsSkeleton = memo(function NotificationsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4 animate-pulse">
      <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded w-64 mb-8" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
});

export const SettingsSkeleton = memo(function SettingsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse">
      <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-8" />
      <div className="space-y-4">
        <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
    </div>
  );
});
