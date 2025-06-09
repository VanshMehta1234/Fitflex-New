-- Add streak fields to attendance table
ALTER TABLE attendance 
ADD streak_count INTEGER NOT NULL DEFAULT 1;

ALTER TABLE attendance 
ADD is_streak_day BIT NOT NULL DEFAULT 1;

ALTER TABLE attendance 
ADD streak_broken BIT NOT NULL DEFAULT 0;

-- Add comments for clarity
EXEC sp_addextendedproperty 
@name = N'MS_Description',
@value = N'The current streak count when this check-in was recorded',
@level0type = N'Schema', @level0name = N'dbo',
@level1type = N'Table',  @level1name = N'attendance',
@level2type = N'Column', @level2name = N'streak_count';

EXEC sp_addextendedproperty 
@name = N'MS_Description',
@value = N'Whether this check-in counts towards a streak',
@level0type = N'Schema', @level0name = N'dbo',
@level1type = N'Table',  @level1name = N'attendance',
@level2type = N'Column', @level2name = N'is_streak_day';

EXEC sp_addextendedproperty 
@name = N'MS_Description',
@value = N'Whether this check-in broke a previous streak (missed days)',
@level0type = N'Schema', @level0name = N'dbo',
@level1type = N'Table',  @level1name = N'attendance',
@level2type = N'Column', @level2name = N'streak_broken';

-- Create index for faster streak queries
CREATE INDEX idx_attendance_user_streak ON attendance(user_id, streak_count); 