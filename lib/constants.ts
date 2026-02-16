// Shared constants across the application
import {
  Sparkles,
  Music,
  Palette,
  Camera,
  Video,
  BookOpen,
  Utensils,
  Code,
  Dumbbell,
  Gamepad2,
  Briefcase,
  Heart,
  Plane,
  Shirt,
  Laugh,
  FlaskConical,
  Trophy,
  Newspaper,
  Church,
  MoreHorizontal,
  GraduationCap,
  LucideIcon,
} from 'lucide-react';

export interface Category {
  name: string;
  icon: LucideIcon;
  color: string;
}

export const CATEGORIES: Category[] = [
  { name: 'All', icon: Sparkles, color: 'from-purple-500 to-pink-500' },
  { name: 'Music', icon: Music, color: 'from-blue-500 to-cyan-500' },
  { name: 'Art', icon: Palette, color: 'from-red-500 to-orange-500' },
  { name: 'Photography', icon: Camera, color: 'from-green-500 to-emerald-500' },
  { name: 'Video', icon: Video, color: 'from-purple-500 to-violet-500' },
  { name: 'Writing', icon: BookOpen, color: 'from-yellow-500 to-orange-500' },
  { name: 'Cooking', icon: Utensils, color: 'from-red-500 to-pink-500' },
  { name: 'Tech', icon: Code, color: 'from-blue-500 to-indigo-500' },
  { name: 'Fitness', icon: Dumbbell, color: 'from-green-500 to-teal-500' },
];

/** Creator signup + explore: single source of truth. Value is stored in DB (creator_profile.category). */
export const CREATOR_CATEGORIES = [
  'Technology',
  'Education',
  'Entertainment',
  'Music',
  'Art & Design',
  'Gaming',
  'Photography',
  'Writing',
  'Business',
  'Health & Fitness',
  'Lifestyle',
  'Travel',
  'Food & Cooking',
  'Fashion & Beauty',
  'Comedy',
  'Science',
  'Sports',
  'Politics & News',
  'Religion & Spirituality',
  'Other',
] as const;

export type CreatorCategoryValue = (typeof CREATOR_CATEGORIES)[number];

export interface ExploreCategoryOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

const creatorCategoryIcons: Record<string, LucideIcon> = {
  Technology: Code,
  Education: GraduationCap,
  Entertainment: Video,
  Music: Music,
  'Art & Design': Palette,
  Gaming: Gamepad2,
  Photography: Camera,
  Writing: BookOpen,
  Business: Briefcase,
  'Health & Fitness': Dumbbell,
  Lifestyle: Heart,
  Travel: Plane,
  'Food & Cooking': Utensils,
  'Fashion & Beauty': Shirt,
  Comedy: Laugh,
  Science: FlaskConical,
  Sports: Trophy,
  'Politics & News': Newspaper,
  'Religion & Spirituality': Church,
  Other: MoreHorizontal,
};

/** For explore page: "All" + one option per creator category (id matches DB value). */
export const EXPLORE_CATEGORY_OPTIONS: ExploreCategoryOption[] = [
  { id: 'all', label: 'All', icon: Sparkles },
  ...CREATOR_CATEGORIES.map((value) => ({
    id: value,
    label: value,
    icon: creatorCategoryIcons[value] ?? Sparkles,
  })),
];
