import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

interface CreatorProfile {
  username: string;
  updated_at: string | null;
}

export default async function sitemapCreators(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://merocircle.app";
  const currentDate = new Date();

  try {
    const supabase = await createClient();
    
    // Fetch all active creators from your database
    const { data: creators, error } = await supabase
      .from('profiles')
      .select('username, updated_at')
      .eq('is_creator', true)
      .eq('is_active', true)
      .not('username', 'is', null);

    if (error || !creators) {
      console.error('Error fetching creators for sitemap:', error);
      return [];
    }

    // Generate sitemap entries for each creator
    const creatorSitemaps = creators.map((creator: CreatorProfile) => ({
      url: `${baseUrl}/creator/${creator.username}`,
      lastModified: creator.updated_at ? new Date(creator.updated_at) : currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.9, // Increased from 0.8 - creator profiles are core content
    }));

    return creatorSitemaps;
  } catch (error) {
    console.error('Error generating creator sitemap:', error);
    return [];
  }
}
