"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Clock, BarChart3, ChevronDown } from 'lucide-react';
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
  creatorId?: string;
  showResults?: boolean;
  isCreator?: boolean;
}

const VISIBLE_OPTIONS_LIMIT = 5;

export function PollCard({ pollId, currentUserId, showResults = false, isCreator = false }: PollCardProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [hasExpired, setHasExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [creatorViewResults, setCreatorViewResults] = useState(false);

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
      if (!poll?.allows_multiple_answers) {
        setSelectedOptions([optionId]);
      } else {
        if (selectedOptions.includes(optionId)) {
          setSelectedOptions(prev => prev.filter(id => id !== optionId));
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
        await fetchPollData();
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  };

  const hasMoreOptions = options.length > VISIBLE_OPTIONS_LIMIT;
  const visibleOptions = useMemo(() => {
    if (showAllOptions || !hasMoreOptions) return options;
    return options.slice(0, VISIBLE_OPTIONS_LIMIT);
  }, [options, showAllOptions, hasMoreOptions]);

  if (loading) {
    return (
      <div className="p-5 rounded-xl border border-border/50 bg-card animate-pulse">
        <div className="h-5 bg-muted rounded w-3/4 mb-4"></div>
        <div className="space-y-2.5">
          <div className="h-11 bg-muted rounded-lg"></div>
          <div className="h-11 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const hasVoted = userVotes.length > 0;
  const showPollResults = showResults || hasVoted || hasExpired || creatorViewResults;

  return (
    <div className="p-5 rounded-xl border border-border/50 bg-card">
      {/* Poll Question */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground mb-1.5">{poll.question}</h3>
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
          <span className="font-medium">{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
          {poll.expires_at && (
            <>
              <span className="text-border">&middot;</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {hasExpired
                  ? 'Ended'
                  : `Ends ${formatDistanceToNow(new Date(poll.expires_at), { addSuffix: true })}`}
              </span>
            </>
          )}
          {poll.allows_multiple_answers && (
            <>
              <span className="text-border">&middot;</span>
              <span className="text-primary font-medium">Multiple choice</span>
            </>
          )}
        </div>
      </div>

      {/* Poll Options */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {visibleOptions.map((option) => {
            const isSelected = selectedOptions.includes(option.id);
            const hasUserVoted = userVotes.includes(option.id);

            if (showPollResults) {
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <div
                    className={cn(
                      "relative p-3 rounded-lg border overflow-hidden transition-colors",
                      hasUserVoted
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/50 bg-background"
                    )}
                  >
                    <div
                      className="absolute inset-0 bg-primary/8 transition-all duration-500"
                      style={{ width: `${option.percentage}%` }}
                    />
                    <div className="relative flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {hasUserVoted && (
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium truncate">{option.option_text}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">{option.votes}</span>
                        <span className="text-sm font-semibold text-primary">
                          {option.percentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            } else {
              return (
                <motion.button
                  key={option.id}
                  onClick={() => handleVote(option.id)}
                  disabled={voting || !currentUserId}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    "w-full p-3 rounded-lg border text-left transition-all",
                    "hover:border-primary/40 hover:bg-primary/5",
                    isSelected
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/50 bg-background",
                    voting && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium">{option.option_text}</span>
                  </div>
                </motion.button>
              );
            }
          })}
        </AnimatePresence>

        {hasMoreOptions && (
          <button
            onClick={() => setShowAllOptions(!showAllOptions)}
            className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors rounded-lg hover:bg-primary/5"
          >
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showAllOptions && "rotate-180")} />
            {showAllOptions ? 'Show less' : `Show ${options.length - VISIBLE_OPTIONS_LIMIT} more`}
          </button>
        )}
      </div>

      {isCreator && !showPollResults && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCreatorViewResults(true)}
          className="mt-3 w-full text-primary gap-2 h-8 text-xs"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          View Results
        </Button>
      )}

      {isCreator && creatorViewResults && !hasVoted && !hasExpired && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCreatorViewResults(false)}
          className="mt-3 w-full text-muted-foreground gap-2 h-8 text-xs"
        >
          Hide Results
        </Button>
      )}

      {!currentUserId && !showPollResults && (
        <p className="mt-3 text-xs text-center text-muted-foreground">
          Sign in to vote
        </p>
      )}
    </div>
  );
}
