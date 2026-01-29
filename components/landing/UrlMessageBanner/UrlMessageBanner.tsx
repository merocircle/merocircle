"use client";

import { Card } from "@/components/ui/card";

interface UrlMessageBannerProps {
  message: string | null;
  onClose: () => void;
}

export function UrlMessageBanner({ message, onClose }: UrlMessageBannerProps) {
  if (!message) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-800">
              {message === 'auth_required' && 'Please complete authentication'}
              {message !== 'auth_required' && message}
            </p>
            {message === 'auth_required' && (
              <p className="text-xs text-yellow-600 mt-1">
                Check browser console for detailed logs
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-yellow-600 hover:text-yellow-800"
          >
            ×
          </button>
        </div>
      </Card>
    </div>
  );
}
