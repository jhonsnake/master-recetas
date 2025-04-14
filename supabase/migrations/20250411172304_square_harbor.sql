/*
  # Remove custom meal types
  
  1. Changes
    - Remove "Merienda 2" and "sdsd" from meal_types table
    - Remove any associated meal plans
*/

-- First remove any meal plans associated with these meal types
DELETE FROM meal_plans
WHERE meal_type_id IN (
  SELECT id FROM meal_types 
  WHERE name IN ('Merienda 2', 'sdsd')
);

-- Then remove the meal types themselves
DELETE FROM meal_types 
WHERE name IN ('Merienda 2', 'sdsd');