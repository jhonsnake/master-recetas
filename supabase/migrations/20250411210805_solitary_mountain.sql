/*
  # Add editable shopping lists functionality

  1. Changes
    - Add original_list_id to shopping_lists table to track copies
    - Add custom_quantity column to shopping_list_items for editable quantities
    - Add custom_unit column to shopping_list_items for editable units
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add original_list_id to shopping_lists
ALTER TABLE shopping_lists
ADD COLUMN IF NOT EXISTS original_list_id uuid REFERENCES shopping_lists(id);

-- Add custom fields to shopping_list_items
ALTER TABLE shopping_list_items
ADD COLUMN IF NOT EXISTS custom_quantity real,
ADD COLUMN IF NOT EXISTS custom_unit text;