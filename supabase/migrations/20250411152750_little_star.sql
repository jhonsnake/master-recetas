/*
  # Fix unit_equivalences INSERT RLS policy

  1. Changes
     - Drops the existing INSERT policy for unit_equivalences
     - Creates a new INSERT policy that properly checks if the user owns the referenced ingredient
  
  2. Security
     - Ensures only authenticated users can insert unit equivalences for ingredients they own
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Allow authenticated users to insert unit_equivalences" ON public.unit_equivalences;

-- Create a new INSERT policy with proper checks
CREATE POLICY "Allow authenticated users to insert unit_equivalences" 
ON public.unit_equivalences
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM ingredients 
    WHERE 
      ingredients.id = unit_equivalences.ingredient_id AND 
      ingredients.user_id = auth.uid()
  )
);