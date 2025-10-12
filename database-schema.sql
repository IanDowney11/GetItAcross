-- Supabase Database Schema for Get It Across Leaderboard
-- Run these commands in your Supabase SQL Editor

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    level_reached INTEGER NOT NULL,
    time_to_complete REAL NOT NULL, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT score_positive CHECK (score >= 0),
    CONSTRAINT level_valid CHECK (level_reached >= 1 AND level_reached <= 5),
    CONSTRAINT time_positive CHECK (time_to_complete >= 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_level ON leaderboard(level_reached);
CREATE INDEX IF NOT EXISTS idx_leaderboard_created_at ON leaderboard(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security

-- Policy: Anyone can view leaderboard entries
CREATE POLICY "Allow read access to leaderboard" ON leaderboard
    FOR SELECT USING (true);

-- Policy: Authenticated users can insert their own scores
CREATE POLICY "Allow authenticated users to insert scores" ON leaderboard
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own entries (optional, currently not used)
CREATE POLICY "Allow users to update their own scores" ON leaderboard
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own entries (optional, currently not used)
CREATE POLICY "Allow users to delete their own scores" ON leaderboard
    FOR DELETE USING (auth.uid() = user_id);

-- Create a view for leaderboard with additional stats
CREATE OR REPLACE VIEW leaderboard_stats AS
SELECT
    l.*,
    RANK() OVER (ORDER BY score DESC) as global_rank,
    RANK() OVER (PARTITION BY level_reached ORDER BY score DESC) as level_rank
FROM leaderboard l;

-- Grant access to the view
GRANT SELECT ON leaderboard_stats TO authenticated;
GRANT SELECT ON leaderboard_stats TO anon;

-- Create a function to get user's best score
CREATE OR REPLACE FUNCTION get_user_best_score(user_uuid UUID)
RETURNS TABLE (
    score INTEGER,
    level_reached INTEGER,
    time_to_complete REAL,
    global_rank BIGINT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT
        l.score,
        l.level_reached,
        l.time_to_complete,
        ls.global_rank,
        l.created_at
    FROM leaderboard l
    JOIN leaderboard_stats ls ON l.id = ls.id
    WHERE l.user_id = user_uuid
    ORDER BY l.score DESC
    LIMIT 1;
$$;

-- Create a function to get leaderboard with pagination
CREATE OR REPLACE FUNCTION get_leaderboard(
    page_limit INTEGER DEFAULT 10,
    page_offset INTEGER DEFAULT 0,
    level_filter INTEGER DEFAULT NULL
)
RETURNS TABLE (
    id BIGINT,
    username TEXT,
    score INTEGER,
    level_reached INTEGER,
    time_to_complete REAL,
    created_at TIMESTAMP WITH TIME ZONE,
    global_rank BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT
        ls.id,
        ls.username,
        ls.score,
        ls.level_reached,
        ls.time_to_complete,
        ls.created_at,
        ls.global_rank
    FROM leaderboard_stats ls
    WHERE (level_filter IS NULL OR ls.level_reached = level_filter)
    ORDER BY ls.score DESC
    LIMIT page_limit
    OFFSET page_offset;
$$;

-- Create a function to get global statistics
CREATE OR REPLACE FUNCTION get_global_stats()
RETURNS TABLE (
    total_players BIGINT,
    total_games BIGINT,
    highest_score INTEGER,
    average_score NUMERIC,
    fastest_time REAL,
    max_level INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT
        COUNT(DISTINCT user_id) as total_players,
        COUNT(*) as total_games,
        MAX(score) as highest_score,
        AVG(score) as average_score,
        MIN(time_to_complete) as fastest_time,
        MAX(level_reached) as max_level
    FROM leaderboard;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_best_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard(INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard(INTEGER, INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_global_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_global_stats() TO anon;

-- Insert some sample data for testing (optional)
-- You can remove this section in production
/*
INSERT INTO leaderboard (user_id, username, score, level_reached, time_to_complete) VALUES
('00000000-0000-0000-0000-000000000001', 'ChickenMaster', 15000, 5, 300.5),
('00000000-0000-0000-0000-000000000002', 'RoadRunner', 12500, 4, 245.2),
('00000000-0000-0000-0000-000000000003', 'SafeCrosser', 10000, 3, 180.0),
('00000000-0000-0000-0000-000000000004', 'SpeedyBird', 8500, 3, 150.8),
('00000000-0000-0000-0000-000000000005', 'CarDodger', 7200, 2, 120.5);
*/