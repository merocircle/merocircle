'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Users, Clock, Star, TrendingUp, Heart, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getValidAvatarUrl } from '@/lib/utils';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 16 },
  },
};

// Featured Events Carousel Component
const FeaturedEventsCarousel: React.FC<{ events: Event[] }> = ({ events }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, events.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
    setIsAutoPlaying(false);
  };

  const currentEvent = events[currentIndex];

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden bg-card">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-muted/20">
        <div className="w-full h-full flex items-center justify-center">
          <Calendar className="w-24 h-24 text-muted-foreground/30" />
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-8">
        <div>
          <Badge className="bg-primary text-primary-foreground mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Featured Event
          </Badge>
          <h1 className="text-4xl font-bold mb-3">{currentEvent.title}</h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl">{currentEvent.description}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{formatDate(currentEvent.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{currentEvent.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>{currentEvent.location}</span>
            </div>
          </div>
          
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            {currentEvent.price === 0 ? 'Register for Free' : `Book Spot - NPR ${currentEvent.price}`}
          </Button>
        </div>
      </div>
      
      {/* Navigation Controls */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors border border-border/50"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors border border-border/50"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      
      {/* Progress Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {events.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setIsAutoPlaying(false);
            }}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentIndex ? "bg-primary w-8" : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
};
interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  attendees: number;
  maxAttendees: number;
  category: string;
  isFeatured?: boolean;
  isPopular?: boolean;
  price?: number;
}

// Dummy data
const featuredEvents: Event[] = [
  {
    id: '1',
    title: 'MeroCircle Creator Meetup 2024',
    description: 'Join us for the biggest creator gathering in Nepal. Network with top creators, learn from industry experts, and celebrate the creator economy.',
    date: '2024-03-15',
    time: '17:00',
    location: 'Kathmandu, Hotel Himalaya',
    image: '/api/placeholder/400/200',
    creator: {
      id: 'merocircle',
      name: 'MeroCircle',
      avatar: '/logo/logo-light.png',
      isVerified: true
    },
    attendees: 245,
    maxAttendees: 500,
    category: 'Official',
    isFeatured: true,
    price: 0
  },
  {
    id: '2',
    title: 'Creator Workshop: Monetization Strategies',
    description: 'Learn advanced monetization strategies from successful creators. This workshop covers everything from sponsorships to merchandise.',
    date: '2024-03-20',
    time: '14:00',
    location: 'Online (Zoom)',
    image: '/api/placeholder/400/200',
    creator: {
      id: 'merocircle',
      name: 'MeroCircle',
      avatar: '/logo/logo-light.png',
      isVerified: true
    },
    attendees: 189,
    maxAttendees: 300,
    category: 'Workshop',
    isFeatured: true,
    price: 0
  }
];

const followingEvents: Event[] = [
  {
    id: '3',
    title: 'Live Music Session',
    description: 'An intimate acoustic performance featuring original songs and covers. Join me for an evening of beautiful music.',
    date: '2024-03-18',
    time: '19:00',
    location: 'Patan, Jazz Upstairs',
    image: '/api/placeholder/400/200',
    creator: {
      id: 'creator1',
      name: 'Anisha Shrestha',
      avatar: '/api/placeholder/40/40',
      isVerified: true
    },
    attendees: 45,
    maxAttendees: 80,
    category: 'Music',
    price: 500
  },
  {
    id: '4',
    title: 'Photography Walk: Old Kathmandu',
    description: 'Explore the hidden gems of old Kathmandu through your lens. I\'ll share tips on street photography and storytelling.',
    date: '2024-03-22',
    time: '06:00',
    location: 'Basantapur Durbar Square',
    image: '/api/placeholder/400/200',
    creator: {
      id: 'creator2',
      name: 'Rajesh Lama',
      avatar: '/api/placeholder/40/40',
      isVerified: false
    },
    attendees: 12,
    maxAttendees: 20,
    category: 'Photography',
    price: 300
  },
  {
    id: '5',
    title: 'Cooking Class: Traditional Newari Cuisine',
    description: 'Learn to cook authentic Newari dishes passed down through generations. All ingredients and recipes included.',
    date: '2024-03-25',
    time: '11:00',
    location: 'Bhaktapur, Traditional Kitchen',
    image: '/api/placeholder/400/200',
    creator: {
      id: 'creator3',
      name: 'Sujata Maharjan',
      avatar: '/api/placeholder/40/40',
      isVerified: true
    },
    attendees: 8,
    maxAttendees: 15,
    category: 'Food',
    price: 800
  }
];

const popularEvents: Event[] = [
  {
    id: '6',
    title: 'Stand-up Comedy Night',
    description: 'A night full of laughter with Nepal\'s rising comedians. Featuring fresh material and special guest performances.',
    date: '2024-03-19',
    time: '20:00',
    location: 'Thamel, Moksh',
    image: '/api/placeholder/400/200',
    creator: {
      id: 'creator4',
      name: 'Bikram Giri',
      avatar: '/api/placeholder/40/40',
      isVerified: true
    },
    attendees: 156,
    maxAttendees: 200,
    category: 'Comedy',
    isPopular: true,
    price: 400
  },
  {
    id: '7',
    title: 'Digital Art Masterclass',
    description: 'Master digital illustration techniques from concept to completion. Bring your tablet and creativity!',
    date: '2024-03-21',
    time: '15:00',
    location: 'Lalitpur, Creative Hub',
    image: '/api/placeholder/400/200',
    creator: {
      id: 'creator5',
      name: 'Prajwal Khati',
      avatar: '/api/placeholder/40/40',
      isVerified: false
    },
    attendees: 34,
    maxAttendees: 50,
    category: 'Art',
    isPopular: true,
    price: 600
  },
  {
    id: '8',
    title: 'Podcast Recording Live',
    description: 'Be part of the live audience for our special podcast episode. Interactive Q&A and behind-the-scenes insights.',
    date: '2024-03-23',
    time: '18:00',
    location: 'Kathmandu, Studio Nepal',
    image: '/api/placeholder/400/200',
    creator: {
      id: 'creator6',
      name: 'The Nepal Show',
      avatar: '/api/placeholder/40/40',
      isVerified: true
    },
    attendees: 67,
    maxAttendees: 100,
    category: 'Podcast',
    isPopular: true,
    price: 0
  },
  {
    id: '9',
    title: 'Yoga & Meditation Retreat',
    description: 'A day of mindfulness and relaxation. Suitable for all levels. Mats and refreshments provided.',
    date: '2024-03-24',
    time: '07:00',
    location: 'Nagarkot, Mountain View Resort',
    image: '/api/placeholder/400/200',
    creator: {
      id: 'creator7',
      name: 'Anita Yoga',
      avatar: '/api/placeholder/40/40',
      isVerified: true
    },
    attendees: 28,
    maxAttendees: 40,
    category: 'Wellness',
    isPopular: true,
    price: 1200
  },
  {
    id: '10',
    title: 'Startup Pitch Night',
    description: 'Watch Nepal\'s most promising startups pitch to investors. Network with entrepreneurs and VCs.',
    date: '2024-03-26',
    time: '17:30',
    location: 'Kathmandu, Innovation Hub',
    image: '/api/placeholder/400/200',
    creator: {
      id: 'creator8',
      name: 'Startup Nepal',
      avatar: '/api/placeholder/40/40',
      isVerified: true
    },
    attendees: 234,
    maxAttendees: 300,
    category: 'Business',
    isPopular: true,
    price: 0
  },
  {
    id: '11',
    title: 'Film Screening: Independent Nepali Cinema',
    description: 'Screening of award-winning independent Nepali films followed by Q&A with directors and cast.',
    date: '2024-03-27',
    time: '16:00',
    location: 'Jhamsikhel, Nepal Tourism Board',
    image: '/api/placeholder/400/200',
    creator: {
      id: 'creator9',
      name: 'Cine Circle',
      avatar: '/api/placeholder/40/40',
      isVerified: false
    },
    attendees: 89,
    maxAttendees: 150,
    category: 'Film',
    isPopular: true,
    price: 200
  }
];

const EventCard: React.FC<{ event: Event; variant?: 'default' | 'compact' }> = ({ event, variant = 'default' }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const attendancePercentage = (event.attendees / event.maxAttendees) * 100;

  if (variant === 'compact') {
    return (
      <motion.div variants={itemVariants} className="group">
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-all">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  {event.price === 0 ? (
                    <Badge className="bg-green-500 text-white text-xs">Free</Badge>
                  ) : (
                    <Badge className="bg-orange-500 text-white text-xs">NPR {event.price}</Badge>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {event.description}
                </p>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{event.attendees}/{event.maxAttendees}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={itemVariants} className="group">
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg">
        {/* Header */}
        <div className="relative h-32 bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="w-16 h-16 text-muted-foreground/30" />
          </div>
          
          {event.isPopular && (
            <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
              <TrendingUp className="w-3 h-3 mr-1" />
              Popular
            </Badge>
          )}
          
          {event.price === 0 ? (
            <Badge className="absolute top-3 right-3 bg-green-500 text-white">
              Free
            </Badge>
          ) : (
            <Badge className="absolute top-3 right-3 bg-orange-500 text-white">
              NPR {event.price}
            </Badge>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors mb-2">
                {event.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {event.description}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={getValidAvatarUrl(event.creator.avatar)} alt={event.creator.name} />
                <AvatarFallback className="text-xs">
                  {event.creator.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium truncate">{event.creator.name}</span>
                  {event.creator.isVerified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{event.category}</span>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{event.attendees}/{event.maxAttendees} attending</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${attendancePercentage}%` }}
                />
              </div>
              
              <Button className="w-full group-hover:bg-primary/90 transition-colors">
                {event.price === 0 ? 'Register for Free' : 'Book Spot - NPR ' + event.price}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function EventsSection() {
  return (
    <div className="py-4 sm:py-6 px-3 sm:px-4 md:px-6 max-w-7xl mx-auto h-full space-y-8 pb-8 pt-2">
      {/* Featured Events Carousel */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Star className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Featured Events</h2>
            <p className="text-sm text-muted-foreground">Official events from MeroCircle</p>
          </div>
        </div>
        
        <FeaturedEventsCarousel events={featuredEvents} />
      </motion.section>

      {/* Creator Events Coming Soon */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Heart className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Creator Events</h2>
            <p className="text-sm text-muted-foreground">Events from your favorite creators</p>
          </div>
        </div>
        
        <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 p-8 text-center">
          <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
          <p className="text-sm text-muted-foreground">Creators will soon be able to host events</p>
        </div>
      </motion.section>
    </div>
  );
}
