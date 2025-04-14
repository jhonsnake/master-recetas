-- Enable storage for ingredient images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ingredients', 'ingredients', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload ingredient images"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ingredients' AND
  auth.role() = 'authenticated'
);

-- Create storage policy to allow public access to ingredient images
CREATE POLICY "Allow public access to ingredient images"
ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'ingredients');