'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  BarChart2,
  Globe,
  Lock,
  Plus,
  X,
  Image as ImageIcon,
  ArrowUpRight,
  Loader2,
  Mail,
  BellOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostCreationFormProps {
  postType: 'post' | 'poll';
  postTitle: string;
  postDescription: string;
  uploadedImages: string[];
  isUploadingImage: boolean;
  postVisibility: string | string[]; // 'public' or array of tier strings ['1', '2', '3']
  pollQuestion: string;
  pollOptions: string[];
  onboardingCompleted: boolean;
  isPublishing: boolean;
  notifyByEmail: boolean;
  onPostTypeChange: (type: 'post' | 'poll') => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onVisibilityChange: (visibility: string | string[]) => void;
  onPollQuestionChange: (question: string) => void;
  onPollOptionChange: (index: number, value: string) => void;
  onAddPollOption: () => void;
  onRemovePollOption: (index: number) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onPublish: () => void;
  onNotifyByEmailChange: (notify: boolean) => void;
}

export function PostCreationForm({
  postType,
  postTitle,
  postDescription,
  uploadedImages,
  isUploadingImage,
  postVisibility,
  pollQuestion,
  pollOptions,
  onboardingCompleted,
  isPublishing,
  notifyByEmail,
  onPostTypeChange,
  onTitleChange,
  onDescriptionChange,
  onVisibilityChange,
  onPollQuestionChange,
  onPollOptionChange,
  onAddPollOption,
  onRemovePollOption,
  onImageUpload,
  onRemoveImage,
  onPublish,
  onNotifyByEmailChange,
}: PostCreationFormProps) {
  return (
    <Card className={cn(
      "p-4 sm:p-6 transition-all border-border/50",
      onboardingCompleted ? "hover:border-primary/30" : "opacity-60"
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            {postType === 'post' ? <FileText className="w-5 h-5 text-primary" /> : <BarChart2 className="w-5 h-5 text-primary" />}
          </div>
          <h3 className="text-lg font-semibold text-foreground">Create {postType === 'post' ? 'Post' : 'Poll'}</h3>
        </div>

        <div className={cn("flex gap-1 p-1 bg-muted/50 rounded-xl", !onboardingCompleted && "opacity-50 pointer-events-none")}>
          <button
            onClick={() => onPostTypeChange('post')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              postType === 'post' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            <FileText className="w-4 h-4" />
            Post
          </button>
          <button
            onClick={() => onPostTypeChange('poll')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              postType === 'poll' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            <BarChart2 className="w-4 h-4" />
            Poll
          </button>
        </div>
      </div>

      <div className={cn("space-y-4", !onboardingCompleted && "opacity-50 pointer-events-none")}>
        {/* Visibility Selector */}
        <div className="space-y-3 p-3 bg-muted/30 rounded-xl">
          <span className="text-sm font-medium text-muted-foreground">Visibility:</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onVisibilityChange('public')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                postVisibility === 'public'
                  ? "bg-green-500/20 text-green-600 border border-green-500/30"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border"
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              Public
            </button>
            <button
              type="button"
              onClick={() => {
                const currentTiers = Array.isArray(postVisibility) ? postVisibility : [];
                const tier1Selected = currentTiers.includes('1');
                if (tier1Selected) {
                  // Remove tier 1
                  const newTiers = currentTiers.filter(t => t !== '1');
                  onVisibilityChange(newTiers.length > 0 ? newTiers : 'public');
                } else {
                  // Add tier 1
                  const newTiers = [...currentTiers.filter(t => t !== 'public'), '1'];
                  onVisibilityChange(newTiers);
                }
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                (Array.isArray(postVisibility) && postVisibility.includes('1')) || postVisibility === 'supporters'
                  ? "bg-purple-500/20 text-purple-600 border border-purple-500/30"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border"
              )}
            >
              <Lock className="w-3.5 h-3.5" />
              Supporters Only
            </button>
            <button
              type="button"
              onClick={() => {
                const currentTiers = Array.isArray(postVisibility) ? postVisibility : [];
                const tier2Selected = currentTiers.includes('2');
                if (tier2Selected) {
                  // Remove tier 2
                  const newTiers = currentTiers.filter(t => t !== '2');
                  onVisibilityChange(newTiers.length > 0 ? newTiers : 'public');
                } else {
                  // Add tier 2
                  const newTiers = [...currentTiers.filter(t => t !== 'public'), '2'];
                  onVisibilityChange(newTiers);
                }
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                Array.isArray(postVisibility) && postVisibility.includes('2')
                  ? "bg-blue-500/20 text-blue-600 border border-blue-500/30"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border"
              )}
            >
              <Lock className="w-3.5 h-3.5" />
              Inner Circle Only
            </button>
            <button
              type="button"
              onClick={() => {
                const currentTiers = Array.isArray(postVisibility) ? postVisibility : [];
                const tier3Selected = currentTiers.includes('3');
                if (tier3Selected) {
                  // Remove tier 3
                  const newTiers = currentTiers.filter(t => t !== '3');
                  onVisibilityChange(newTiers.length > 0 ? newTiers : 'public');
                } else {
                  // Add tier 3
                  const newTiers = [...currentTiers.filter(t => t !== 'public'), '3'];
                  onVisibilityChange(newTiers);
                }
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                Array.isArray(postVisibility) && postVisibility.includes('3')
                  ? "bg-amber-500/20 text-amber-600 border border-amber-500/30"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border"
              )}
            >
              <Lock className="w-3.5 h-3.5" />
              Core Member Only
            </button>
          </div>
          {Array.isArray(postVisibility) && postVisibility.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Selected tiers: {postVisibility.map(t => {
                if (t === '1') return 'Supporters Only';
                if (t === '2') return 'Inner Circle';
                if (t === '3') return 'Core Member';
                return t;
              }).join(', ')}
            </p>
          )}
        </div>

        {postType === 'post' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Title</label>
              <Input
                placeholder="Enter post title..."
                value={postTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                className="border-border rounded-xl"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">{postTitle.length}/200 characters</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
              <Textarea
                placeholder="Write a detailed description..."
                value={postDescription}
                onChange={(e) => onDescriptionChange(e.target.value)}
                rows={6}
                className="resize-none border-border rounded-xl"
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground mt-1">{postDescription.length}/5000 characters</p>
            </div>
          </div>
        )}

        {postType === 'poll' && (
          <div className="space-y-3 p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
            <Input
              placeholder="Poll question..."
              value={pollQuestion}
              onChange={(e) => onPollQuestionChange(e.target.value)}
              className="border-border rounded-xl"
            />
            {pollOptions.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => onPollOptionChange(index, e.target.value)}
                  className="flex-1 border-border rounded-xl"
                />
                {pollOptions.length > 2 && (
                  <Button variant="ghost" size="icon" onClick={() => onRemovePollOption(index)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            {pollOptions.length >= 5 && pollOptions.length < 10 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Options 6-10 will be hidden by default. Users will need to press "Show more" to see them.
              </p>
            )}
            {pollOptions.length < 10 && (
              <Button variant="outline" size="sm" onClick={onAddPollOption} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            )}
          </div>
        )}

        {/* Image Preview */}
        {postType === 'post' && uploadedImages.length > 0 && (
          <div className="p-3 rounded-xl border border-border bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-foreground">
                {uploadedImages.length} {uploadedImages.length === 1 ? 'image' : 'images'} added
              </span>
              {uploadedImages.length < 10 && (
                <span className="text-xs text-muted-foreground">
                  (max 10)
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {uploadedImages.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email notification toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2.5">
            {notifyByEmail ? (
              <Mail className="w-4 h-4 text-primary" />
            ) : (
              <BellOff className="w-4 h-4 text-muted-foreground" />
            )}
            <div>
              <span className="text-sm font-medium text-foreground">Notify supporters via email</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {notifyByEmail ? 'Supporters will receive an email about this post' : 'No email notification will be sent'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNotifyByEmailChange(!notifyByEmail)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              notifyByEmail ? "bg-primary" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                notifyByEmail ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          {postType === 'post' && (
            <div>
              <input type="file" accept="image/*" multiple onChange={onImageUpload} className="hidden" id="image-upload" />
              <label htmlFor="image-upload">
                <Button variant="outline" size="sm" className="rounded-xl" asChild disabled={uploadedImages.length >= 10}>
                  <span>
                    {isUploadingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                    {isUploadingImage ? 'Uploading...' : uploadedImages.length > 0 ? 'Add More' : 'Add Images'}
                  </span>
                </Button>
              </label>
            </div>
          )}
          <Button
            onClick={onPublish}
            disabled={!onboardingCompleted || isPublishing}
            className="bg-linear-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl"
          >
            {isPublishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpRight className="w-4 h-4 mr-2" />}
            Publish
          </Button>
        </div>
      </div>
    </Card>
  );
}
