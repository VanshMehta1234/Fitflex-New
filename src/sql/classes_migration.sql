-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  instructor TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  location TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all levels')),
  type TEXT NOT NULL CHECK (type IN ('yoga', 'cardio', 'strength', 'hiit', 'dance', 'pilates', 'cycling', 'other')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create class_bookings table
CREATE TABLE IF NOT EXISTS public.class_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attendance_status TEXT NOT NULL CHECK (attendance_status IN ('booked', 'attended', 'no_show', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (class_id, user_id)
);

-- Add updated_at trigger to classes table
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_classes_updated_at ON public.classes;
CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS update_class_bookings_updated_at ON public.class_bookings;
CREATE TRIGGER update_class_bookings_updated_at
BEFORE UPDATE ON public.class_bookings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Set up RLS (Row Level Security) policies
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;

-- Classes policies
-- Admin users can do everything
CREATE POLICY "Admins can do everything on classes" ON public.classes
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- All users can view classes
CREATE POLICY "All users can view classes" ON public.classes
  FOR SELECT USING (true);

-- Class bookings policies
-- Admin users can do everything
CREATE POLICY "Admins can do everything on class_bookings" ON public.class_bookings
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings" ON public.class_bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own bookings
CREATE POLICY "Users can create their own bookings" ON public.class_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own bookings
CREATE POLICY "Users can update their own bookings" ON public.class_bookings
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create view for class availability
CREATE OR REPLACE VIEW public.class_availability AS
SELECT 
  c.*,
  c.capacity - COUNT(cb.id) FILTER (WHERE cb.attendance_status != 'cancelled') AS available_spots
FROM
  public.classes c
LEFT JOIN
  public.class_bookings cb ON c.id = cb.class_id
GROUP BY
  c.id;

-- Grant permissions
GRANT SELECT ON public.class_availability TO anon, authenticated;
GRANT SELECT ON public.classes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.class_bookings TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.class_bookings_id_seq TO authenticated; 