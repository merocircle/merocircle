'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, CornerDownRight, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
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

function buildCommentTree(comments: Comment[]): Map<string | null, Comment[]> {
  const tree = new Map<string | null, Comment[]>();
  tree.set(null, []);
  comments.forEach((comment) => {
    const parentId = comment.parent_comment_id;
    if (!tree.has(parentId)) tree.set(parentId, []);
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

  useRealtimeComments(postId);

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  const getReplies = useCallback(
    (commentId: string) => commentTree.get(commentId) || [],
    [commentTree],
  );

  const toggleThread = (commentId: string) => {
    setCollapsedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmitting) return;
    await onAddComment(replyContent.trim(), parentId);
    setReplyContent('');
    setReplyingTo(null);
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const replies = getReplies(comment.id);
    const hasReplies = replies.length > 0;
    const isCollapsed = collapsedThreads.has(comment.id);
    const maxDepth = 3;
    const isMaxDepth = depth >= maxDepth;

    return (
      <div key={comment.id} className={cn('relative', depth > 0 && 'ml-8 mt-2')}>
        {/* Thread connector line */}
        {depth > 0 && (
          <div className="absolute left-[-16px] top-0 bottom-0 w-px bg-border/60" />
        )}

        <div className="flex gap-2.5">
          <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
            <AvatarImage src={comment.user.photo_url} />
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
              {comment.user.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Comment bubble */}
            <div className="bg-muted/40 rounded-2xl rounded-tl-md px-3.5 py-2">
              <p className="text-[13px] leading-relaxed">
                <span className="font-semibold text-foreground">
                  {comment.user.display_name}
                </span>{' '}
                <span className="text-foreground/90">{comment.content}</span>
              </p>
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-3 mt-1 ml-1 text-[11px] text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>

              {currentUserId && !isMaxDepth && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="font-semibold hover:text-primary transition-colors"
                >
                  Reply
                </button>
              )}

              {hasReplies && (
                <button
                  onClick={() => toggleThread(comment.id)}
                  className="flex items-center gap-1 font-semibold hover:text-primary transition-colors"
                >
                  {isCollapsed ? (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Hide
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
                  <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.user.display_name}...`}
                    className="flex-1 bg-muted/40 text-sm rounded-full px-3.5 py-1.5 outline-none focus:ring-2 focus:ring-primary/30 border border-border/40 placeholder:text-muted-foreground"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!replyContent.trim() || isSubmitting}
                    className="h-7 px-3 rounded-full text-xs"
                  >
                    {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Reply'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                    className="h-7 px-2 text-xs text-muted-foreground"
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

  const topLevelComments = commentTree.get(null) || [];

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <MessageCircle className="w-8 h-8 text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">
          No comments yet. Be the first!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topLevelComments.map((comment) => renderComment(comment, 0))}
    </div>
  );
}

export default ThreadedComments;
