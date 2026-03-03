import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import {
  getAuthenticatedUser,
  checkResourceOwnership,
  handleApiError,
  getOptionalUser,
} from "@/lib/api-utils";

interface Params {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get the current user via NextAuth session (optional — unauthenticated users can still view public posts)
    const user = await getOptionalUser();

    const { data: post, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        creator:users!posts_creator_id_fkey(
          id,
          display_name,
          photo_url,
          role
        ),
        likes:post_likes(
          id,
          user_id,
          created_at,
          user:users(display_name, photo_url)
        ),
        comments:post_comments(
          id,
          content,
          created_at,
          updated_at,
          user:users(id, display_name, photo_url)
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      logger.error("Error fetching post by ID", "POSTS_API", {
        postId: id,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
      });
      return NextResponse.json(
        { error: "Post not found", detail: error.message, code: error.code },
        { status: 404 },
      );
    }

    // Enrich with per-user data if authenticated
    let is_liked = false;
    let is_supporter = false;

    if (user) {
      // Check if the user has liked this post
      is_liked = Array.isArray(post.likes)
        ? post.likes.some(
            (like: { user_id: string }) => like.user_id === user.id,
          )
        : false;

      // Check if the user is an active supporter of this creator
      if (post.creator_id && post.creator_id !== user.id) {
        const { data: supporterRow } = await supabase
          .from("supporters")
          .select("id")
          .eq("supporter_id", user.id)
          .eq("creator_id", post.creator_id)
          .eq("is_active", true)
          .maybeSingle();
        is_supporter = !!supporterRow;
      } else if (post.creator_id === user.id) {
        // The creator always has full access to their own posts
        is_supporter = true;
      }
    }

    return NextResponse.json({ ...post, is_liked, is_supporter });
  } catch (error) {
    logger.error("Error fetching post", "POSTS_API", {
      error: error instanceof Error ? error.message : "Unknown",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { id } = await params;
  try {
    // Authenticate user
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user)
      return (
        errorResponse ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );

    // Check ownership
    const { owns, errorResponse: ownershipError } =
      await checkResourceOwnership("posts", id, user.id);
    if (ownershipError) return ownershipError;
    if (!owns) {
      return NextResponse.json(
        { error: "You can only edit your own posts" },
        { status: 403 },
      );
    }

    const supabase = await createClient();

    const body = await request.json();
    const { title, content, image_url, media_url, is_public, tier_required } =
      body;

    const { data: post, error } = await supabase
      .from("posts")
      .update({
        title,
        content,
        image_url,
        media_url,
        is_public,
        tier_required,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        *,
        creator:users!posts_creator_id_fkey(
          id,
          display_name,
          photo_url,
          role
        ),
        creator_profile:creator_profiles!posts_creator_id_fkey(
          category,
          is_verified
        )
      `,
      )
      .single();

    if (error) {
      logger.error("Error updating post", "POSTS_API", {
        error: error.message,
        postId: id,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Failed to update post" },
        { status: 500 },
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    return handleApiError(error, "POSTS_API", "Failed to update post");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> },
) {
  const { id } = await params;
  try {
    // Authenticate user
    const { user, errorResponse } = await getAuthenticatedUser();
    if (errorResponse || !user)
      return (
        errorResponse ||
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );

    // Check ownership
    const { owns, errorResponse: ownershipError } =
      await checkResourceOwnership("posts", id, user.id);
    if (ownershipError) return ownershipError;
    if (!owns) {
      return NextResponse.json(
        { error: "You can only delete your own posts" },
        { status: 403 },
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      logger.error("Error deleting post", "POSTS_API", {
        error: error.message,
        postId: id,
        userId: user.id,
      });
      return NextResponse.json(
        { error: "Failed to delete post" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    return handleApiError(error, "POSTS_API", "Failed to delete post");
  }
}
