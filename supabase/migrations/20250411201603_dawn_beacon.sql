/*
  # Add tags column to recipes table

  1. Changes
    - Add `tags` column to `recipes` table as text array with default empty array
    - Column will store recipe categories/types (e.g., breakfast, lunch, dinner, snack)

  2. Schema Update
    - Table: `recipes`
    - New Column: `tags` (text[])
    - Default: Empty array
    - Nullable: No
*/

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];