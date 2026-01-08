import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          photo_url: string | null;
          role: 'user' | 'creator';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name: string;
          photo_url?: string | null;
          role?: 'user' | 'creator';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          photo_url?: string | null;
          role?: 'user' | 'creator';
          created_at?: string;
          updated_at?: string;
        };
      };
      creator_profiles: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          bio?: string | null;
          category?: string | null;
          is_verified?: boolean;
          total_earnings?: number;
          supporters_count?: number;
          followers_count?: number;
          posts_count?: number;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bio?: string | null;
          category?: string | null;
          is_verified?: boolean;
          total_earnings?: number;
          supporters_count?: number;
          followers_count?: number;
          posts_count?: number;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      supporter_transactions: {
        Row: {
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
          esewa_data: any | null;
          khalti_data: any | null;
          bank_data: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          supporter_id: string;
          creator_id: string;
          amount: number;
          message?: string | null;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          gateway: 'esewa' | 'khalti' | 'bank_transfer';
          transaction_uuid?: string | null;
          product_code?: string | null;
          signature?: string | null;
          esewa_data?: any | null;
          khalti_data?: any | null;
          bank_data?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          supporter_id?: string;
          creator_id?: string;
          amount?: number;
          message?: string | null;
          status?: 'pending' | 'completed' | 'failed' | 'cancelled';
          gateway?: 'esewa' | 'khalti' | 'bank_transfer';
          transaction_uuid?: string | null;
          product_code?: string | null;
          signature?: string | null;
          esewa_data?: any | null;
          khalti_data?: any | null;
          bank_data?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
      };
      post_likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
      post_comments: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          content: string;
          parent_comment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          content: string;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          content?: string;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      creator_tags: {
        Row: {
          id: string;
          creator_id: string;
          tag: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          tag: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          tag?: string;
          created_at?: string;
        };
      };
      user_activities: {
        Row: {
          id: string;
          user_id: string;
          activity_type: 'post_created' | 'post_liked' | 'comment_added' | 'user_followed' | 'support_given';
          target_id: string;
          target_type: 'post' | 'user' | 'comment' | 'transaction';
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: 'post_created' | 'post_liked' | 'comment_added' | 'user_followed' | 'support_given';
          target_id: string;
          target_type: 'post' | 'user' | 'comment' | 'transaction';
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: 'post_created' | 'post_liked' | 'comment_added' | 'user_followed' | 'support_given';
          target_id?: string;
          target_type?: 'post' | 'user' | 'comment' | 'transaction';
          metadata?: any;
          created_at?: string;
        };
      };
    };
    Functions: {
      get_discovery_feed: {
        Args: { user_uuid: string; feed_limit?: number };
        Returns: {
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
        }[];
      };
      search_creators: {
        Args: { search_query: string; search_limit?: number };
        Returns: {
          user_id: string;
          display_name: string;
          photo_url: string | null;
          bio: string | null;
          category: string | null;
          is_verified: boolean;
          followers_count: number;
          posts_count: number;
          total_earnings: number;
        }[];
      };
      get_creator_transaction_stats: {
        Args: { creator_uuid: string };
        Returns: {
          total_amount: number;
          total_transactions: number;
          completed_amount: number;
          completed_transactions: number;
          pending_amount: number;
          pending_transactions: number;
        }[];
      };
    };
  };
}

export default supabase; 
