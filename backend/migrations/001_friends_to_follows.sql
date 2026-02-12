-- Migration: Friends to Follows System
-- This script migrates from bidirectional friends to directional follows (followers/following)

-- Step 1: Create new follows table
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_follow UNIQUE(follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

-- Step 3: Migrate existing friends data to follows
-- Convert bidirectional friendships to directional follows (both directions)
INSERT INTO follows (follower_id, following_id, created_at)
SELECT 
    user_id as follower_id,
    friend_id as following_id,
    created_at
FROM friends
WHERE status = 'accepted'
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- Also create the reverse relationship
INSERT INTO follows (follower_id, following_id, created_at)
SELECT 
    friend_id as follower_id,
    user_id as following_id,
    created_at
FROM friends
WHERE status = 'accepted'
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- Step 4: Enable Row Level Security
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
-- Users can view all follows
CREATE POLICY "Anyone can view follows"
    ON follows FOR SELECT
    USING (true);

-- Users can only create follows where they are the follower
CREATE POLICY "Users can follow others"
    ON follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

-- Users can only delete follows where they are the follower
CREATE POLICY "Users can unfollow"
    ON follows FOR DELETE
    USING (auth.uid() = follower_id);

-- Step 6: Drop old friends table (OPTIONAL - comment out if you want to keep backup)
-- DROP TABLE IF EXISTS friends CASCADE;

-- Verification queries (run these to check migration):
-- SELECT COUNT(*) FROM follows; -- Should be roughly 2x friends count
-- SELECT follower_id, following_id FROM follows LIMIT 10;
