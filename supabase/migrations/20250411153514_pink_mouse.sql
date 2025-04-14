/*
  # Add unique constraint to ingredient names

  1. Changes
    - Add unique constraint to ingredients name column
    - First handle existing duplicates by adding a number suffix
*/

-- First handle existing duplicates
DO $$
DECLARE
  duplicate_record RECORD;
  counter INTEGER;
BEGIN
  FOR duplicate_record IN (
    SELECT name, array_agg(id ORDER BY created_at) as ids
    FROM ingredients
    GROUP BY name
    HAVING COUNT(*) > 1
  ) LOOP
    counter := 1;
    
    -- Skip the first ID (keep original name) and update all others
    FOR i IN 2..array_length(duplicate_record.ids, 1) LOOP
      UPDATE ingredients 
      SET name = name || ' (' || counter || ')'
      WHERE id = duplicate_record.ids[i];
      
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;

-- Now add the unique constraint
ALTER TABLE ingredients 
ADD CONSTRAINT ingredients_name_unique UNIQUE (name);