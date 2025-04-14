/*
  # Remove RLS (Row Level Security) completely from unit_equivalences table

  1. Changes
    - Disable Row Level Security (RLS) on unit_equivalences table
    - Drop all existing policies on unit_equivalences table

  2. Security
    - This allows all operations on unit_equivalences without restrictions
    - For development purposes only - should be re-enabled with proper policies in production
*/

-- Disable RLS completely on unit_equivalences
ALTER TABLE unit_equivalences DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on unit_equivalences to avoid any confusion
DROP POLICY IF EXISTS "Allow public read access to unit_equivalences" ON unit_equivalences;
DROP POLICY IF EXISTS "Allow authenticated users to insert unit_equivalences" ON unit_equivalences;
DROP POLICY IF EXISTS "Allow authenticated users to update unit_equivalences" ON unit_equivalences;
DROP POLICY IF EXISTS "Allow authenticated users to delete unit_equivalences" ON unit_equivalences;