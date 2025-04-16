-- Agrega la columna conversion_text a recipe_ingredients
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS conversion_text text;
