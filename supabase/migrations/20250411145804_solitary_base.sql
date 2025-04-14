/*
  # Add mock ingredients data

  1. Changes
    - Create test user with UUID
    - Insert 10 common ingredients with nutritional values
    - Add common unit conversions for ingredients
    
  2. Data
    - Common ingredients with accurate nutritional information
    - Standard unit conversions for volume measurements
*/

-- Create a test user with a known UUID
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Insert test user if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      test_user_id,
      'authenticated',
      'authenticated',
      'test@example.com',
      crypt('password123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      ''
    );
  END IF;

  -- Insert ingredients
  INSERT INTO ingredients (
    name, description, image_url, calories, carbs, fiber, sugar, fat, protein, 
    base_unit, base_quantity, user_id
  )
  VALUES
    (
      'Arroz blanco',
      'Arroz blanco de grano largo, crudo',
      'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800',
      365, 80, 1.3, 0.1, 0.6, 7.1,
      'g', 100, test_user_id
    ),
    (
      'Pechuga de pollo',
      'Pechuga de pollo sin piel',
      'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800',
      165, 0, 0, 0, 3.6, 31,
      'g', 100, test_user_id
    ),
    (
      'Huevo',
      'Huevo entero fresco',
      'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800',
      155, 1.1, 0, 1.1, 11, 13,
      'u', 1, test_user_id
    ),
    (
      'Leche entera',
      'Leche de vaca entera',
      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800',
      42, 5, 0, 5, 1.5, 3.4,
      'ml', 100, test_user_id
    ),
    (
      'Aguacate',
      'Aguacate maduro',
      'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800',
      160, 8.5, 6.7, 0.7, 14.7, 2,
      'g', 100, test_user_id
    ),
    (
      'Plátano',
      'Plátano maduro mediano',
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800',
      89, 22.8, 2.6, 12.2, 0.3, 1.1,
      'u', 1, test_user_id
    ),
    (
      'Atún en lata',
      'Atún en agua, escurrido',
      'https://images.unsplash.com/photo-1614119068601-147321b2169d?w=800',
      103, 0, 0, 0, 0.8, 23,
      'g', 100, test_user_id
    ),
    (
      'Espinacas',
      'Espinacas frescas crudas',
      'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800',
      23, 3.6, 2.2, 0.4, 0.4, 2.9,
      'g', 100, test_user_id
    ),
    (
      'Almendras',
      'Almendras crudas sin sal',
      'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=800',
      579, 21.6, 12.5, 4.4, 49.9, 21.2,
      'g', 100, test_user_id
    ),
    (
      'Aceite de oliva',
      'Aceite de oliva virgen extra',
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800',
      884, 0, 0, 0, 100, 0,
      'ml', 100, test_user_id
    );

  -- Add common unit equivalences for the newly inserted ingredients
  INSERT INTO unit_equivalences (ingredient_id, unit_name, conversion_factor)
  SELECT 
    id,
    'taza',
    CASE 
      WHEN name = 'Arroz blanco' THEN 200
      WHEN name = 'Leche entera' THEN 240
      WHEN name = 'Almendras' THEN 92
      WHEN name = 'Aceite de oliva' THEN 240
    END
  FROM ingredients
  WHERE name IN ('Arroz blanco', 'Leche entera', 'Almendras', 'Aceite de oliva');

  -- Add tablespoon equivalences
  INSERT INTO unit_equivalences (ingredient_id, unit_name, conversion_factor)
  SELECT 
    id,
    'cucharada',
    CASE 
      WHEN name = 'Aceite de oliva' THEN 15
      WHEN name = 'Leche entera' THEN 15
    END
  FROM ingredients
  WHERE name IN ('Aceite de oliva', 'Leche entera');

END $$;