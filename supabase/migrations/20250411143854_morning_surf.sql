/*
  # Fix RLS policies for ingredients table

  1. Changes
    - Drop existing RLS policies that are too permissive
    - Add new RLS policies that properly handle authentication
    
  2. Security
    - Enable RLS on ingredients table (already enabled)
    - Add policies for authenticated users to:
      - Read all ingredients
      - Create new ingredients when authenticated
      - Update their own ingredients
      - Delete their own ingredients
    - Add policy for public users to read ingredients
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to delete ingredients" ON ingredients;
DROP POLICY IF EXISTS "Allow authenticated users to insert ingredients" ON ingredients;
DROP POLICY IF EXISTS "Allow authenticated users to update ingredients" ON ingredients;
DROP POLICY IF EXISTS "Allow public read access to ingredients" ON ingredients;

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ingredients' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE ingredients ADD COLUMN user_id UUID REFERENCES auth.users(id);
    
    -- Set existing rows to have the user_id of the first user (if any exist)
    UPDATE ingredients 
    SET user_id = (SELECT id FROM auth.users LIMIT 1)
    WHERE user_id IS NULL;
    
    -- Make user_id required for future inserts
    ALTER TABLE ingredients ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON ingredients
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON ingredients
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON ingredients
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON ingredients
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);