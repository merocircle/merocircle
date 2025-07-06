-- Creators Nepal Database Seeding Script
-- This script populates the database with sample data for development and testing
-- Uses existing auth.users and creates additional sample users

-- First, let's create sample users using existing auth user IDs and some new UUIDs
-- Note: In a real scenario, these would be created through Supabase Auth

-- Get existing user IDs for reference
-- User 1: 7124487b-29df-41a9-90ee-49d866cefcec (nmiya15@gmail.com)
-- User 2: d1b83c85-4b88-40e6-82a1-9685d4ab4657 (nishar@dayos.com)  
-- User 3: 6f4a0567-c9b7-4c88-883f-a1ce0bb1233d (miyannishar786@gmail.com)

-- Insert/Update users in public.users table (this syncs with auth.users)
INSERT INTO users (id, email, display_name, photo_url, role, created_at, updated_at) VALUES
-- Existing users (update their profiles to be creators)
('7124487b-29df-41a9-90ee-49d866cefcec', 'nmiya15@gmail.com', 'Nishar Miya', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'creator', NOW() - INTERVAL '30 days', NOW()),
('d1b83c85-4b88-40e6-82a1-9685d4ab4657', 'nishar@dayos.com', 'Nishar (Dayos)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'creator', NOW() - INTERVAL '25 days', NOW()),
('6f4a0567-c9b7-4c88-883f-a1ce0bb1233d', 'miyannishar786@gmail.com', 'Miya Nishar', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', 'user', NOW() - INTERVAL '20 days', NOW())
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  photo_url = EXCLUDED.photo_url,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Create additional sample users with UUIDs (these would normally be created via Supabase Auth)
-- For demo purposes, we'll create them directly but in production they'd come from auth.users
INSERT INTO users (id, email, display_name, photo_url, role, created_at, updated_at) VALUES
-- Additional creators
('550e8400-e29b-41d4-a716-446655440001', 'aakriti.art@gmail.com', 'Aakriti Sharma', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', 'creator', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'rohan.music@gmail.com', 'Rohan Thapa', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'creator', NOW() - INTERVAL '25 days', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'priya.writer@gmail.com', 'Priya Gurung', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', 'creator', NOW() - INTERVAL '20 days', NOW()),

-- Supporters  
('550e8400-e29b-41d4-a716-446655440011', 'ram.supporter@gmail.com', 'Ram Bahadur', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'user', NOW() - INTERVAL '28 days', NOW()),
('550e8400-e29b-41d4-a716-446655440012', 'sita.fan@gmail.com', 'Sita Devi', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', 'user', NOW() - INTERVAL '22 days', NOW()),
('550e8400-e29b-41d4-a716-446655440013', 'hari.music@gmail.com', 'Hari Prasad', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'user', NOW() - INTERVAL '18 days', NOW()),
('550e8400-e29b-41d4-a716-446655440014', 'gita.reader@gmail.com', 'Gita Tamang', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', 'user', NOW() - INTERVAL '12 days', NOW()),
('550e8400-e29b-41d4-a716-446655440015', 'krishna.tech@gmail.com', 'Krishna Maharjan', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'user', NOW() - INTERVAL '8 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create creator profiles for all creators
INSERT INTO creator_profiles (user_id, bio, category, is_verified, total_earnings, supporters_count, created_at, updated_at) VALUES
('7124487b-29df-41a9-90ee-49d866cefcec', 'Full-stack developer and tech entrepreneur from Nepal. Building the future of digital payments and creator economy in South Asia.', 'Technology', true, 125000.00, 0, NOW() - INTERVAL '30 days', NOW()),
('d1b83c85-4b88-40e6-82a1-9685d4ab4657', 'Founder & CEO of Dayos. Creating innovative solutions for businesses in Nepal. Passionate about technology and entrepreneurship.', 'Business & Tech', true, 89000.00, 0, NOW() - INTERVAL '25 days', NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'Digital artist from Kathmandu. I create beautiful illustrations inspired by Nepali culture and traditions. Follow my journey as I blend modern art with our rich heritage.', 'Art & Design', true, 45000.00, 0, NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Musician and composer creating fusion music that combines traditional Nepali instruments with modern sounds. Every song tells a story of our beautiful Nepal.', 'Music', true, 32000.00, 0, NOW() - INTERVAL '25 days', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Writer and storyteller sharing tales from the mountains. I write about life in Nepal, our culture, and the beauty of the Himalayas in both Nepali and English.', 'Writing', false, 18500.00, 0, NOW() - INTERVAL '20 days', NOW())
ON CONFLICT (user_id) DO UPDATE SET
  bio = EXCLUDED.bio,
  category = EXCLUDED.category,
  is_verified = EXCLUDED.is_verified,
  updated_at = NOW();

-- Create posts for each creator
INSERT INTO posts (id, creator_id, title, content, image_url, is_public, tier_required, created_at, updated_at) VALUES
-- Nishar's posts (Technology)
('550e8400-e29b-41d4-a716-446655440101', '7124487b-29df-41a9-90ee-49d866cefcec', 'Building the Future of Payments in Nepal', 'Just launched a new feature for our payment gateway that makes transactions 50% faster! 🚀 Working on integrating with more local banks to make digital payments accessible to every Nepali. The future is digital, and Nepal is ready! #FinTech #Nepal', 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800', true, 'free', NOW() - INTERVAL '2 days', NOW()),
('550e8400-e29b-41d4-a716-446655440102', '7124487b-29df-41a9-90ee-49d866cefcec', 'Open Source Project: Nepal Digital Identity', 'Excited to announce our new open-source project for digital identity verification in Nepal! This will help reduce fraud and make online transactions safer. Contributors welcome! 💻 #OpenSource #DigitalNepal', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800', true, 'free', NOW() - INTERVAL '5 days', NOW()),

-- Nishar (Dayos) posts (Business & Tech)
('550e8400-e29b-41d4-a716-446655440103', 'd1b83c85-4b88-40e6-82a1-9685d4ab4657', 'Scaling Startups in Nepal: Lessons Learned', 'After 3 years of building Dayos, here are the key lessons about scaling a tech startup in Nepal. The challenges are real, but so are the opportunities! 🇳🇵 Thread below 👇', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', true, 'free', NOW() - INTERVAL '1 day', NOW()),
('550e8400-e29b-41d4-a716-446655440104', 'd1b83c85-4b88-40e6-82a1-9685d4ab4657', 'Hiring Nepali Talent: Remote Work Revolution', 'We''re hiring 10 new developers at Dayos! All remote positions. Proof that Nepali talent can compete globally. Let''s build the future from the mountains! 🏔️💼', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800', true, 'free', NOW() - INTERVAL '4 days', NOW()),

-- Aakriti's posts (Art & Design)
('550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440001', 'Digital Art: Swayambhunath at Sunset', 'Just finished this digital painting of Swayambhunath at sunset. The golden light hitting the stupa was absolutely magical! 🏛️✨ This piece took me 15 hours to complete, but every minute was worth it. What do you think of this blend of traditional architecture with digital art techniques?', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', true, 'free', NOW() - INTERVAL '3 days', NOW()),
('550e8400-e29b-41d4-a716-446655440106', '550e8400-e29b-41d4-a716-446655440001', 'Faces of Nepal Portrait Series', 'Working on a series called "Faces of Nepal" - portraits of people from different ethnic communities. This is Pemba, a Sherpa guide I met in Namche Bazaar. His stories of the mountains inspired this piece. 🏔️', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', true, 'free', NOW() - INTERVAL '6 days', NOW()),

-- Rohan's posts (Music)
('550e8400-e29b-41d4-a716-446655440107', '550e8400-e29b-41d4-a716-446655440002', 'New Track: Himalayan Dreams', 'New track alert! 🎵 "Himalayan Dreams" combines the haunting sound of the bansuri with electronic beats. This song is about the dreams that echo through our mountains. Link in bio to listen!', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', true, 'free', NOW() - INTERVAL '4 days', NOW()),
('550e8400-e29b-41d4-a716-446655440108', '550e8400-e29b-41d4-a716-446655440002', 'Live at Patan Durbar Square', 'Performing live at Patan Durbar Square tonight! Come join us for an evening of fusion music under the stars. Traditional meets modern in the heart of our heritage city. 🌟', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800', true, 'free', NOW() - INTERVAL '1 day', NOW()),

-- Priya's posts (Writing)
('550e8400-e29b-41d4-a716-446655440109', '550e8400-e29b-41d4-a716-446655440003', 'The Tea Houses of Annapurna', 'New blog post: "The Tea Houses of Annapurna" - A journey through the stories shared over cups of chiya in the mountains. Each tea house holds a thousand tales of trekkers, locals, and dreams. ☕🏔️', 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800', true, 'free', NOW() - INTERVAL '7 days', NOW()),
('550e8400-e29b-41d4-a716-446655440110', '550e8400-e29b-41d4-a716-446655440003', 'Dreams from Mustang', 'Just published a short story about a young girl from Mustang who dreams of becoming an astronaut. Sometimes the biggest dreams come from the highest places. 🚀✨', 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800', true, 'free', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create supporter relationships
INSERT INTO supporters (supporter_id, creator_id, tier, amount, is_active, created_at, updated_at) VALUES
-- Support for Nishar (main creator)
('6f4a0567-c9b7-4c88-883f-a1ce0bb1233d', '7124487b-29df-41a9-90ee-49d866cefcec', 'premium', 1000.00, true, NOW() - INTERVAL '15 days', NOW()),
('550e8400-e29b-41d4-a716-446655440011', '7124487b-29df-41a9-90ee-49d866cefcec', 'basic', 500.00, true, NOW() - INTERVAL '10 days', NOW()),
('550e8400-e29b-41d4-a716-446655440012', '7124487b-29df-41a9-90ee-49d866cefcec', 'premium', 1000.00, true, NOW() - INTERVAL '8 days', NOW()),

-- Support for Nishar (Dayos)
('6f4a0567-c9b7-4c88-883f-a1ce0bb1233d', 'd1b83c85-4b88-40e6-82a1-9685d4ab4657', 'basic', 500.00, true, NOW() - INTERVAL '12 days', NOW()),
('550e8400-e29b-41d4-a716-446655440013', 'd1b83c85-4b88-40e6-82a1-9685d4ab4657', 'premium', 1000.00, true, NOW() - INTERVAL '6 days', NOW()),

-- Support for other creators
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'basic', 500.00, true, NOW() - INTERVAL '20 days', NOW()),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'premium', 1000.00, true, NOW() - INTERVAL '18 days', NOW()),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'premium', 1000.00, true, NOW() - INTERVAL '15 days', NOW()),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440003', 'basic', 500.00, true, NOW() - INTERVAL '12 days', NOW()),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 'basic', 500.00, true, NOW() - INTERVAL '8 days', NOW())
ON CONFLICT (supporter_id, creator_id) DO NOTHING;

-- Create post likes
INSERT INTO post_likes (post_id, user_id, created_at) VALUES
-- Likes on Nishar's tech posts
('550e8400-e29b-41d4-a716-446655440101', '6f4a0567-c9b7-4c88-883f-a1ce0bb1233d', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440011', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440012', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440101', 'd1b83c85-4b88-40e6-82a1-9685d4ab4657', NOW() - INTERVAL '1 day'),

('550e8400-e29b-41d4-a716-446655440102', '6f4a0567-c9b7-4c88-883f-a1ce0bb1233d', NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '4 days'),

-- Likes on other posts
('550e8400-e29b-41d4-a716-446655440103', '7124487b-29df-41a9-90ee-49d866cefcec', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '1 day'),

('550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440011', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440012', NOW() - INTERVAL '2 days'),

('550e8400-e29b-41d4-a716-446655440107', '550e8400-e29b-41d4-a716-446655440013', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440107', '550e8400-e29b-41d4-a716-446655440015', NOW() - INTERVAL '3 days')
ON CONFLICT (post_id, user_id) DO NOTHING;

-- Create comments
INSERT INTO comments (post_id, user_id, content, created_at, updated_at) VALUES
-- Comments on Nishar's posts
('550e8400-e29b-41d4-a716-446655440101', '6f4a0567-c9b7-4c88-883f-a1ce0bb1233d', 'This is amazing! Finally a payment solution built for Nepal. Can''t wait to integrate this into my business. 🚀', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440011', 'As a small business owner, this is exactly what we needed. The speed improvement will make a huge difference!', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440013', 'Open source approach is brilliant! I''d love to contribute to this project. Where can I find the GitHub repo?', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

-- Comments on other posts
('550e8400-e29b-41d4-a716-446655440103', '7124487b-29df-41a9-90ee-49d866cefcec', 'Great insights! As a fellow entrepreneur, these lessons are gold. Thanks for sharing your journey! 💪', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

('550e8400-e29b-41d4-a716-446655440105', '550e8400-e29b-41d4-a716-446655440011', 'Absolutely stunning! The way you captured the golden hour light is incredible. This brings back memories of my morning walks around the stupa. 🙏', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

('550e8400-e29b-41d4-a716-446655440107', '550e8400-e29b-41d4-a716-446655440013', 'Just listened to this track and got goosebumps! The bansuri melody is so haunting and beautiful. When is the full album coming?', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Create supporter transactions (payments)
INSERT INTO supporter_transactions (supporter_id, creator_id, amount, currency, gateway, status, message, transaction_uuid, created_at, updated_at) VALUES
-- Recent payments to Nishar
('6f4a0567-c9b7-4c88-883f-a1ce0bb1233d', '7124487b-29df-41a9-90ee-49d866cefcec', 1000.00, 'NPR', 'esewa', 'completed', 'Monthly support for tech content', 'ESW' || extract(epoch from NOW())::text, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440011', '7124487b-29df-41a9-90ee-49d866cefcec', 500.00, 'NPR', 'esewa', 'completed', 'Love your payment gateway tutorials!', 'ESW' || extract(epoch from NOW() - INTERVAL '10 days')::text, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440012', '7124487b-29df-41a9-90ee-49d866cefcec', 1000.00, 'NPR', 'esewa', 'completed', 'Keep building the future!', 'ESW' || extract(epoch from NOW() - INTERVAL '8 days')::text, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

-- Payments to other creators
('6f4a0567-c9b7-4c88-883f-a1ce0bb1233d', 'd1b83c85-4b88-40e6-82a1-9685d4ab4657', 500.00, 'NPR', 'esewa', 'completed', 'Supporting Dayos journey', 'ESW' || extract(epoch from NOW() - INTERVAL '12 days')::text, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440013', 'd1b83c85-4b88-40e6-82a1-9685d4ab4657', 1000.00, 'NPR', 'esewa', 'completed', 'Inspiring startup content!', 'ESW' || extract(epoch from NOW() - INTERVAL '6 days')::text, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 500.00, 'NPR', 'esewa', 'completed', 'Beautiful art work!', 'ESW' || extract(epoch from NOW() - INTERVAL '20 days')::text, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 1000.00, 'NPR', 'esewa', 'completed', 'Love the cultural art series', 'ESW' || extract(epoch from NOW() - INTERVAL '18 days')::text, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),

('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 1000.00, 'NPR', 'esewa', 'completed', 'Amazing fusion music!', 'ESW' || extract(epoch from NOW() - INTERVAL '15 days')::text, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 500.00, 'NPR', 'esewa', 'completed', 'Traditional meets modern perfectly', 'ESW' || extract(epoch from NOW() - INTERVAL '8 days')::text, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440003', 500.00, 'NPR', 'esewa', 'completed', 'Beautiful mountain stories', 'ESW' || extract(epoch from NOW() - INTERVAL '12 days')::text, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days')
ON CONFLICT (id) DO NOTHING;

-- Create follows (social connections)
INSERT INTO follows (follower_id, following_id, created_at) VALUES
-- Everyone follows the main creators
('6f4a0567-c9b7-4c88-883f-a1ce0bb1233d', '7124487b-29df-41a9-90ee-49d866cefcec', NOW() - INTERVAL '20 days'),
('6f4a0567-c9b7-4c88-883f-a1ce0bb1233d', 'd1b83c85-4b88-40e6-82a1-9685d4ab4657', NOW() - INTERVAL '18 days'),

-- Supporters follow creators they support
('550e8400-e29b-41d4-a716-446655440011', '7124487b-29df-41a9-90ee-49d866cefcec', NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440012', '7124487b-29df-41a9-90ee-49d866cefcec', NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '18 days'),
('550e8400-e29b-41d4-a716-446655440013', 'd1b83c85-4b88-40e6-82a1-9685d4ab4657', NOW() - INTERVAL '8 days'),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '8 days'),

-- Creators follow each other
('7124487b-29df-41a9-90ee-49d866cefcec', 'd1b83c85-4b88-40e6-82a1-9685d4ab4657', NOW() - INTERVAL '25 days'),
('d1b83c85-4b88-40e6-82a1-9685d4ab4657', '7124487b-29df-41a9-90ee-49d866cefcec', NOW() - INTERVAL '24 days'),
('550e8400-e29b-41d4-a716-446655440001', '7124487b-29df-41a9-90ee-49d866cefcec', NOW() - INTERVAL '28 days'),
('550e8400-e29b-41d4-a716-446655440002', '7124487b-29df-41a9-90ee-49d866cefcec', NOW() - INTERVAL '23 days'),
('550e8400-e29b-41d4-a716-446655440003', 'd1b83c85-4b88-40e6-82a1-9685d4ab4657', NOW() - INTERVAL '19 days')
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- Update creator profiles with correct supporter counts and earnings
UPDATE creator_profiles SET 
  supporters_count = (SELECT COUNT(*) FROM supporters WHERE supporters.creator_id = creator_profiles.user_id AND supporters.is_active = true),
  total_earnings = (SELECT COALESCE(SUM(amount), 0) FROM supporter_transactions WHERE supporter_transactions.creator_id = creator_profiles.user_id AND supporter_transactions.status = 'completed');

-- Final summary
SELECT 'Database seeding completed successfully!' as message,
       (SELECT COUNT(*) FROM users) as total_users,
       (SELECT COUNT(*) FROM creator_profiles) as total_creators,
       (SELECT COUNT(*) FROM posts) as total_posts,
       (SELECT COUNT(*) FROM post_likes) as total_likes,
       (SELECT COUNT(*) FROM comments) as total_comments,
       (SELECT COUNT(*) FROM supporters) as total_supporters,
       (SELECT COUNT(*) FROM supporter_transactions) as total_transactions,
       (SELECT COUNT(*) FROM follows) as total_follows; 