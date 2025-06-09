-- Function to get leaderboard for a specific time period
CREATE OR REPLACE FUNCTION get_period_leaderboard(start_date TIMESTAMP, limit_count INTEGER)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  profile_image TEXT,
  level INTEGER,
  total_xp BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.name,
    p.profile_image,
    p.level,
    COALESCE(SUM(x.amount), 0)::BIGINT as total_xp
  FROM 
    profiles p
  LEFT JOIN 
    xp_transactions x ON p.id = x.user_id AND x.created_at >= start_date
  GROUP BY 
    p.id, p.name, p.profile_image, p.level
  ORDER BY 
    total_xp DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create the leaderboard function (can be called via RPC)
CREATE OR REPLACE FUNCTION create_leaderboard_function()
RETURNS BOOLEAN AS $$
BEGIN
  -- The actual function is created directly in the migration
  -- This is just a helper function to call via RPC if needed
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql; 