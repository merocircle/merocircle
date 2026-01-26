'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, CornerDownRight, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealtimeComments } from '@/hooks/useRealtimeFeed';

interface User {
  id: string;
  display_name: string;
  photo_url?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  user: User;
}

interface ThreadedCommentsProps {
  postId: string;
  comments: Comment[];
  currentUserId?: string;
  onAddComment: (content: string, parentCommentId?: string) => Promise<void>;
  isSubmitting: boolean;
}

// Build comment tree from flat array
function buildCommentTree(comments: Comment[]): Map<string | null, Comment[]> {
  const tree = new Map<string | null, Comment[]>();

  // Initialize with null key for top-level comments
  tree.set(null, []);

  // Group comments by parent_comment_id
  comments.forEach((comment) => {
    const parentId = comment.parent_comment_id;
    if (!tree.has(parentId)) {
      tree.set(parentId, []);
    }
    tree.get(parentId)!.push(comment);
  });

  return tree;
}

export function ThreadedComments({
  postId,
  comments,
  currentUserId,
  onAddComment,
  isSubmitting,
}: ThreadedCommentsProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set());

  // Enable real-time updates for this post's comments
  useRealtimeComments(postId);

  // Build comment tree
  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  // Get replies for a comment
  const getReplies = useCallback(
    (commentId: string) => commentTree.get(commentId) || [],
    [commentTree]
  );

  // Toggle thread collapse
  const toggleThread = (commentId: string) => {
    setCollapsedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  // Handle reply submit
  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmitting) return;

    await onAddComment(replyContent.trim(), parentId);
    setReplyContent('');
    setReplyingTo(null);
  };

  // Render a single comment with its replies
  const renderComment = (comment: Comment, depth: number = 0) => {
    const replies = getReplies(comment.id);
    const hasReplies = replies.length > 0;
    const isCollapsed = collapsedThreads.has(comment.id);
    const maxDepth = 3; // Max nesting level
    const isMaxDepth = depth >= maxDepth;

    return (
      <div key={comment.id} className={cn('relative', depth > 0 && 'ml-6 mt-2')}>
        {/* Thread line for nested comments */}
        {depth > 0 && (
          <div className="absolute left-[-12px] top-0 bottom-0 w-[2px] bg-border" />
        )}

        <div className="flex gap-2">
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarImage src={comment.user.photo_url} />
            <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary to-primary/60 text-white">
              {comment.user.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="bg-muted/50 rounded-lg px-3 py-2">
              <p className="text-sm">
                <span className="font-semibold text-foreground">
                  {comment.user.display_name}
                </span>{' '}
                <span className="text-foreground">{comment.content}</span>
              </p>
            </div>

            {/* Comment actions */}
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>

              {currentUserId && !isMaxDepth && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="font-medium hover:text-foreground transition-colors"
                >
                  Reply
                </button>
              )}

              {hasReplies && (
                <button
                  onClick={() => toggleThread(comment.id)}
                  className="flex items-center gap-1 font-medium hover:text-foreground transition-colors"
                >
                  {isCollapsed ? (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Show {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Hide replies
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Reply input */}
            <AnimatePresence>
              {replyingTo === comment.id && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={(e) => handleReplySubmit(e, comment.id)}
                  className="mt-2 flex items-center gap-2"
                >
                  <CornerDownRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.user.display_name}...`}
                    className="flex-1 bg-muted/50 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!replyContent.trim() || isSubmitting}
                    className="h-7 px-3"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Reply'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent('');
                    }}
                    className="h-7 px-2"
                  >
                    Cancel
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Nested replies */}
            <AnimatePresence>
              {hasReplies && !isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-2"
                >
                  {replies.map((reply) => renderComment(reply, depth + 1))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  };

  // Get top-level comments
  const topLevelComments = commentTree.get(null) || [];

  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No comments yet. Be the first!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {topLevelComments.map((comment) => renderComment(comment, 0))}
    </div>
  );
}

export default ThreadedComments;
