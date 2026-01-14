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
  LucideIcon
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

export const APP_CONFIG = {
  name: 'Creators Nepal',
  description: 'Support Nepal\'s creative community',
  stats: {
    activeCreators: 1234,
    supporters: '50K+',
    totalEarned: 2000000,
    uptime: '99.9%',
  },
  currency: '₹',
  recentlyVisitedLimit: 10,
  defaultPostsPerPage: 20,
};

export const PAYMENT_PRESETS = [
  { value: '500', label: '₹500' },
  { value: '1000', label: '₹1000' },
  { value: '2000', label: '₹2000' },
  { value: '5000', label: '₹5000' },
];
