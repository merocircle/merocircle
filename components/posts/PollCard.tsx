"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface PollOption {
  id: string;
  option_text: string;
  votes: number;
  percentage: number;
}

interface Poll {
  id: string;
  question: string;
  allows_multiple_answers: boolean;
  expires_at: string | null;
}

interface PollCardProps {
  pollId: string;
  currentUserId?: string;
  showResults?: boolean;
}

export function PollCard({ pollId, currentUserId, showResults = false }: PollCardProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [hasExpired, setHasExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchPollData();
  }, [pollId]);

  const fetchPollData = async () => {
    try {
      const response = await fetch(`/api/polls/${pollId}`);
      const data = await response.json();

      if (response.ok) {
        setPoll(data.poll);
        setOptions(data.options);
        setTotalVotes(data.totalVotes);
        setUserVotes(data.userVotes || []);
        setHasExpired(data.hasExpired);
        setSelectedOptions(data.userVotes || []);
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionId: string) => {
    if (!currentUserId || hasExpired || voting) return;

    setVoting(true);

    try {
      // If single choice and user already voted, change vote
      if (!poll?.allows_multiple_answers) {
        setSelectedOptions([optionId]);
      } else {
        // Multiple choice - toggle selection
        if (selectedOptions.includes(optionId)) {
          setSelectedOptions(prev => prev.filter(id => id !== optionId));
          // Remove vote
          await fetch(`/api/polls/vote?pollId=${pollId}&optionId=${optionId}`, {
            method: 'DELETE'
          });
        } else {
          setSelectedOptions(prev => [...prev, optionId]);
        }
      }

      const response = await fetch('/api/polls/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, optionId })
      });

      if (response.ok) {
        // Refresh poll data
        await fetchPollData();
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!poll) return null;

  const hasVoted = userVotes.length > 0;
  const showPollResults = showResults || hasVoted || hasExpired;

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      {/* Poll Question */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-blue-500 rounded-lg">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground mb-1">{poll.question}</h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
            {poll.expires_at && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {hasExpired
                      ? 'Ended'
                      : `Ends ${formatDistanceToNow(new Date(poll.expires_at), { addSuffix: true })}`}
                  </span>
                </div>
              </>
            )}
            {poll.allows_multiple_answers && (
              <>
                <span>•</span>
                <span className="text-blue-600 dark:text-blue-400">Multiple choice</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Poll Options */}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option.id);
          const hasUserVoted = userVotes.includes(option.id);

          if (showPollResults) {
            // Show results
            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative"
              >
                <div
                  className={cn(
                    "relative p-4 rounded-lg border-2 overflow-hidden",
                    hasUserVoted
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  )}
                >
                  {/* Progress bar background */}
                  <div
                    className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 transition-all duration-500"
                    style={{ width: `${option.percentage}%` }}
                  />

                  {/* Content */}
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {hasUserVoted && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                      <span className="font-medium">{option.option_text}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{option.votes} votes</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {option.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          } else {
            // Show voting interface
            return (
              <motion.button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={voting || !currentUserId}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full p-4 rounded-lg border-2 text-left transition-all",
                  "hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30",
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
                  voting && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="font-medium">{option.option_text}</span>
                </div>
              </motion.button>
            );
          }
        })}
      </div>

      {/* View Results Button */}
      {!showPollResults && hasVoted && (
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchPollData}
          className="mt-4 w-full text-blue-600 dark:text-blue-400"
        >
          View Results
        </Button>
      )}

      {/* Login Prompt */}
      {!currentUserId && !showPollResults && (
        <p className="mt-4 text-sm text-center text-muted-foreground">
          Sign in to vote
        </p>
      )}
    </Card>
  );
}
