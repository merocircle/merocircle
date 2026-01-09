export interface User {
  id: string;
  email: string;
  display_name: string;
  photo_url: string | null;
  role: 'user' | 'creator';
  created_at: string;
  updated_at: string;
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  bio: string | null;
  category: string | null;
  is_verified: boolean;
  total_earnings: number;
  supporters_count: number;
  followers_count: number;
  posts_count: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  image_url?: string | null;
  media_url?: string | null;
  is_public: boolean;
  tier_required: string;
  created_at: string;
  updated_at: string;
  creator_id: string;
  creator?: User;
  creator_profile?: CreatorProfile;
  likes?: PostLike[];
  comments?: PostComment[];
  likes_count?: number;
  comments_count?: number;
}

export interface PostLike {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Transaction {
  id: string;
  supporter_id: string;
  creator_id: string;
  amount: number;
  message: string | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  gateway: 'esewa' | 'khalti' | 'bank_transfer';
  transaction_uuid: string | null;
  product_code: string | null;
  signature: string | null;
  esewa_data: Record<string, unknown> | null;
  khalti_data: Record<string, unknown> | null;
  bank_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface CreatorTag {
  id: string;
  creator_id: string;
  tag: string;
  created_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: 'post_created' | 'post_liked' | 'comment_added' | 'user_followed' | 'support_given';
  target_id: string;
  target_type: 'post' | 'user' | 'comment' | 'transaction';
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreatorStats {
  monthlyEarnings: number;
  totalEarnings: number;
  supporters: number;
  followers: number;
  posts: number;
  likes: number;
  comments: number;
  growth: {
    earnings: number;
    supporters: number;
    followers: number;
    engagement: number;
  };
}

export interface SupporterStats {
  totalSupported: number;
  creatorsSupported: number;
  thisMonth: number;
  favoriteCreators: number;
  following: number;
}

export interface DiscoveryFeedPost {
  post_id: string;
  creator_id: string;
  creator_name: string;
  creator_photo_url: string | null;
  creator_verified: boolean;
  post_title: string;
  post_content: string;
  post_image_url: string | null;
  post_created_at: string;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  user_follows_creator: boolean;
}

export interface SearchCreatorResult {
  user_id: string;
  display_name: string;
  photo_url: string | null;
  bio: string | null;
  category: string | null;
  is_verified: boolean;
  followers_count: number;
  posts_count: number;
  total_earnings: number;
}

// Payment types
export interface EsewaPaymentInit {
  amount: string;
  tax_amount: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string;
  product_delivery_charge: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
}

export interface EsewaVerifyResponse {
  transaction_code: string;
  status: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  signed_field_names: string;
  signature: string;
}

export interface CreatePostForm {
  title: string;
  content: string;
  image_url?: string;
  media_url?: string;
  is_public?: boolean;
  tier_required?: string;
}

export interface UpdateProfileForm {
  display_name?: string;
  photo_url?: string;
  bio?: string;
  category?: string;
}

export interface SupportCreatorForm {
  creator_id: string;
  amount: number;
  message?: string;
  gateway: 'esewa' | 'khalti' | 'bank_transfer';
}

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
}

export type UserRole = 'user' | 'creator';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type PaymentGateway = 'esewa' | 'khalti' | 'bank_transfer';
export type ActivityType = 'post_created' | 'post_liked' | 'comment_added' | 'user_followed' | 'support_given';
export type TargetType = 'post' | 'user' | 'comment' | 'transaction';

