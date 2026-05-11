-- Add attachment support to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type TEXT; -- 'image' | 'audio' | 'video'
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Storage bucket for message attachments (public, 20MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  true,
  20971520,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','audio/mpeg','audio/wav','audio/ogg','video/mp4','video/quicktime','video/webm']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "msg-attach-upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'message-attachments');

CREATE POLICY "msg-attach-read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'message-attachments');
