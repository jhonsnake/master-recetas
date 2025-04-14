/*
  # Temporarily disable RLS for development
  
  1. Changes
    - Disable Row Level Security (RLS) on the `unit_equivalences` table
    - This is a temporary measure for development purposes only
    - Should be re-enabled with proper policies before production deployment
*/

-- Disable RLS on unit_equivalences table
ALTER TABLE unit_equivalences DISABLE ROW LEVEL SECURITY;