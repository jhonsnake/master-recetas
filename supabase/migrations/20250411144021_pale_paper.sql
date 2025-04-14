/*
  # Update base unit structure

  1. Changes
    - Add base_quantity column to ingredients table
    - Update base_unit column description
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add base_quantity column
ALTER TABLE ingredients 
ADD COLUMN base_quantity real NOT NULL DEFAULT 1;

-- Add a comment to clarify the base_unit and base_quantity relationship
COMMENT ON COLUMN ingredients.base_unit IS 'The unit of measurement (e.g., g, ml, kg)';
COMMENT ON COLUMN ingredients.base_quantity IS 'The reference quantity for nutritional values (e.g., 100 for 100g)';