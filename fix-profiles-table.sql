-- This script checks if the profiles table exists and has the correct columns
-- It will not modify any existing data, only add missing columns

DO $$
BEGIN
    -- Check if the profiles table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        -- Check and add columns if they don't exist
        
        -- Check for name column
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'profiles' 
                       AND column_name = 'name') THEN
            ALTER TABLE profiles ADD COLUMN name TEXT;
        END IF;
        
        -- Check for profile_image column
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'profiles' 
                       AND column_name = 'profile_image') THEN
            ALTER TABLE profiles ADD COLUMN profile_image TEXT;
        END IF;
        
        -- Check for bio column
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'profiles' 
                       AND column_name = 'bio') THEN
            ALTER TABLE profiles ADD COLUMN bio TEXT;
        END IF;
        
        -- Check for location column
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'profiles' 
                       AND column_name = 'location') THEN
            ALTER TABLE profiles ADD COLUMN location TEXT;
        END IF;
        
        -- Check for phone column
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'profiles' 
                       AND column_name = 'phone') THEN
            ALTER TABLE profiles ADD COLUMN phone TEXT;
        END IF;
        
        -- Check for website column
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'profiles' 
                       AND column_name = 'website') THEN
            ALTER TABLE profiles ADD COLUMN website TEXT;
        END IF;
        
        -- Check for birthdate column
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'profiles' 
                       AND column_name = 'birthdate') THEN
            ALTER TABLE profiles ADD COLUMN birthdate DATE;
        END IF;
        
        -- Check for role column
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'profiles' 
                       AND column_name = 'role') THEN
            ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
        END IF;
        
        -- Check for streak column
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'profiles' 
                       AND column_name = 'streak') THEN
            ALTER TABLE profiles ADD COLUMN streak INTEGER DEFAULT 0;
        END IF;
        
        -- Check for membershipType column
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'profiles' 
                       AND column_name = 'membershipType') THEN
            ALTER TABLE profiles ADD COLUMN "membershipType" TEXT DEFAULT 'Basic';
        END IF;
        
        -- Ensure RLS is enabled
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- Check for the RLS policies
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
            CREATE POLICY "Users can view own profile" 
            ON profiles FOR SELECT 
            USING (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
            CREATE POLICY "Users can update own profile" 
            ON profiles FOR UPDATE 
            USING (auth.uid() = user_id);
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
            CREATE POLICY "Users can insert own profile" 
            ON profiles FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
        END IF;
        
        RAISE NOTICE 'Profiles table exists. Any missing columns were added.';
    ELSE
        -- Create the profiles table if it doesn't exist
        CREATE TABLE profiles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT,
            profile_image TEXT,
            bio TEXT,
            location TEXT,
            phone TEXT,
            website TEXT,
            birthdate DATE,
            role TEXT DEFAULT 'user',
            streak INTEGER DEFAULT 0,
            "membershipType" TEXT DEFAULT 'Basic',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY "Users can view own profile" 
        ON profiles FOR SELECT 
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can update own profile" 
        ON profiles FOR UPDATE 
        USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert own profile" 
        ON profiles FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
        
        -- Create user_id index
        CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
        
        RAISE NOTICE 'Profiles table created successfully.';
    END IF;
END $$; 